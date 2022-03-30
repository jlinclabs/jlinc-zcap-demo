const express = require('express')
const Router = require("express-promise-router");
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const hbs = require('express-hbs')
const jwt = require('jsonwebtoken')

hbs.handlebars.registerHelper('toJSON', object =>
  new hbs.handlebars.SafeString(JSON.stringify(object), null, 2)
)

function createApp(options){
  const appName = options.name

  const app = express()
  app.port = options.port
  app.url = options.url
  app.pg = require('./postgresql')(options)
  app.hl = require('./hyperlinc')(options)
  app.users = require('./models/users')(app)

  app.use(express.static(__dirname + '/public'));
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json({ }))
  app.use(cookieParser())
  app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials',
    defaultLayout: __dirname + '/views/layout/default.hbs',
  }))
  app.set('view engine', 'hbs')
  app.set('views', __dirname + '/views')
  Object.assign(app.locals, {
    appName,
    appColor: options.color,
    // TODO move this static lists
    partnerApps: [
      {name: 'cat-walkers', url: 'https://cat-walkers.zcap.test'},
      {name: 'dope-dogs', url: 'https://dope-dogs.zcap.test'},
      {name: 'bad-birders', url: 'https://bad-birders.zcap.test'},
    ].filter(pa => pa.url !== app.url)
  })

  const SESSION_SECRET = `dont tell anyone this is ${appName}`
  const COOKIE_NAME = `session`

  app.start = function start(callback){
    app.server = app.listen(app.port, callback)
  }

  // ROUTES
  const router = Router()
  app.use(router)

  async function verifySession(sessionJwt){
    const session = await new Promise((resolve, reject) => {
      jwt.verify(sessionJwt, SESSION_SECRET, (error, session) => {
        if (error) reject(error)
        else resolve(session)
      })
    })

    return session
  }

  router.use('*', async (req, res, next) => {
    const sessionJwt = req.cookies[COOKIE_NAME]
    let session
    if (sessionJwt){
      try{
        session = await verifySession(sessionJwt)
      }catch(error){
        res.cookie('session', null)
      }
    }

    let currentUser
    if (session) {
      currentUser = await app.users.get(session.username)
      if (!currentUser){
        res.status(401).clearCookie(COOKIE_NAME).redirect('/')
        return
      }
    }

    Object.assign(res.locals, { session, currentUser })

    next()
  })

  router.get('/', async (req, res) => {
    res.render('index', {
      users: await app.users.getAll(),
    })
  })

  router.get('/login', (req, res) => {
    res.render('login')
  })

  const createSessionCookie = (res, username) =>
    res
      .cookie(COOKIE_NAME, jwt.sign(
        { username },
        SESSION_SECRET,
        { expiresIn: 86400 }
      ))
      .redirect('/')

  router.post('/login', async (req, res) => {
    const { username } = req.body
    const user = await app.users.get(username)
    if (user) {
      createSessionCookie(res, user.username)
    }else{
      res
        .clearCookie(COOKIE_NAME)
        .render('error', {
          error: { message: `user "${username}" not found` },
        })
    }
  })

  router.post('/logout', (req, res) => {
    res.status(200).clearCookie(COOKIE_NAME).redirect('/')
  })

  router.post('/signup', async (req, res) => {
    const { username, realname } = req.body
    const user = await app.users.create({ username, realname })
    createSessionCookie(res, user.username)
  })

  router.get('/@:username', async (req, res) => {
    const { currentUser } = res.locals
    const { username } = req.params
    const itsUs = currentUser && currentUser.username === username
    const user = itsUs ? currentUser : (await app.users.get(username))
    const hyperlincEvents = user && await app.users._getAllHyperlincEvents(username)
    res.render('profile', {
      username, itsUs, user, hyperlincEvents
    })
  })

  router.post('/profile', async (req, res) => {
    const { username } = res.locals.currentUser
    const changes = req.body
    await app.users.updateProfile(username, changes)
    res.redirect(`/@${username}`)
  })

  router.get('/send-me-to', (req, res) => {
    const { currentUser } = res.locals
    const appUrl = req.query.app
    res.redirect(`${appUrl}/hyper-login?hlid=${currentUser.hyperlinc_id}`)
  })

  router.get('/hyper-login', async (req, res) => {
    const hyperlincId = req.query.hlid
    const user = await app.users.findByHyperlincId(hyperlincId)
    if (user) return createSessionCookie(res, user.username)

    const [hlProfile] = await app.hl.getProfiles([hyperlincId])
    console.log({ hlProfile })
    if (hlProfile){
      if (hlProfile.preferredUsername){
        const user = await app.users.create({
          username: hlProfile.preferredUsername,
          hyperlincId,
        })
        if (user) return createSessionCookie(res, user.username)
      }
      return res.render('hypersignup', {
        hlProfile,
      })
    }
    res.render('error', { error: { message: 'didnt work :(' }})
  })


  router.get('/__hyperlinc/:id', async (req, res) => {
    const { id } = req.params
    const identity = await app.hl.getIdentity(id)
    await identity.update()
    const hyperlincEvents = await identity.getAllEvents()
    const writable = (
      await app.pg.query(
        `
        SELECT 1
        FROM hyperlinc_secret_keys
        WHERE hyperlinc_id = $1
        `,
        [id]
      )
    ).rowCount > 0
    res.render('hyperlinc_events', {
      writable,
      hyperlincEvents,
    })
  })

  return app
}

Object.assign(module.exports, { createApp })
