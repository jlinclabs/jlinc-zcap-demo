const Path = require('path')
const express = require('express')
const Router = require("express-promise-router");
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const expressSession = require('express-session')
const passport = require('passport')
const hbs = require('express-hbs')
const jwt = require('jsonwebtoken')

const app = express()
module.exports = app
app.config = require('./appConfig')
app.pg = require('./postgresql')
app.users = require('./models/User')
// app.hl = require('./hyperlinc')(config)

const appName = app.config.name

hbs.handlebars.registerHelper('toJSON', object =>
  new hbs.handlebars.SafeString(JSON.stringify(object), null, 2)
)


app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json({ }))
app.use(cookieParser())
app.use(expressSession({
  secret: app.config.sessionSecret,
  resave: true,
  saveUninitialized: true,
}))
app.use(passport.initialize())
app.use(passport.session())
app.engine('hbs', hbs.express4({
  partialsDir: __dirname + '/views/partials',
  defaultLayout: __dirname + '/views/layout/default.hbs',
}))
app.set('view engine', 'hbs')
app.set('views', __dirname + '/views')
Object.assign(app.locals, {
  appName,
  appColor: app.config.color,
  // TODO move this static lists
  // partnerApps: app.config.partnerApps,
})

const SESSION_SECRET = `dont tell anyone this is ${appName}`
const COOKIE_NAME = `session`

app.start = async function start(){
  // await app.pg.connect()
  // await app.hl.connect()
  const startHttpServer = () =>
    new Promise((resolve, reject) => {
      app.server = app.listen(app.config.port, error => {
        if (error) return reject(error);
        console.log(`${appName} listening on port ${app.config.port} at ${app.config.url}`)
        resolve();
      })
    })

  await Promise.all([
    // app.sequelize.authenticate(),
    startHttpServer()
  ])
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
    users: await app.users.all(),
  })
})

router.get('/login', async (req, res) => {
  if (req.query.zcap){
    const delegatedCapability = zcap.verifyZcapInvocation(req.query.zcap);
    const jlincDid = delegatedCapability.zcap.invokerDid
    const user = await app.users.findByJlincDid(jlincDid)
    return user
      ? createSessionCookie(res, user.username)
      : res.render('zcapsignup', { jlincDid })
  }else{
    res.render('login')
  }
})

function createSessionCookie(res, username, destination = '/'){
  if (!username) throw new Error('no username!')
  res
    .cookie(COOKIE_NAME, jwt.sign(
      { username },
      SESSION_SECRET,
      { expiresIn: 86400 }
    ))
    .redirect(destination)
}

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

router.get('/signup', (req, res) => {
  res.render('signup')
})

router.post('/signup', async (req, res) => {
  const { username, realname } = req.body
  const user = await app.users.create({ username, realname })
  createSessionCookie(res, user.username, `/@${user.username}`)
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
  if (hlProfile){
    if (hlProfile.preferredUsername){
      const user = await app.users.create({
        username: hlProfile.preferredUsername,
        hyperlincId,
      })
      return createSessionCookie(res, user.username)
    }
    const hyperlincStatus = await app.hl.status()
    return res.render('hypersignup', {
      hyperlincId, hlProfile, hyperlincStatus
    })
  }
  res.render('error', { error: { message: 'didnt work :(' }})
})

router.post('/hyper-signup', async (req, res) => {
  const { hlid: hyperlincId, username } = req.body
  const user = await app.users.create({ username, hyperlincId })
  return createSessionCookie(res, user.username)
})

router.post('/zcap-signup', async (req, res) => {
  const { jlincDid, username } = req.body
  const user = await app.users.create({ username, jlincDid })
  return createSessionCookie(res, user.username)
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

router.use((error, req, res, next) => {
  res.render('error', { error })
})
