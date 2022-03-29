const express = require('express')
const Router = require("express-promise-router");
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const hbs = require('express-hbs')
const jwt = require('jsonwebtoken')
const zcap = require('@jlinc/zcap')
const parseUrl = require('url').parse
// const { HypercoreLog } = require('./hypercore')

const Database = require('./database')

hbs.handlebars.registerHelper('toJSON', object =>
  new hbs.handlebars.SafeString(JSON.stringify(object), null, 2)
)

function createApp(options){
  const appName = options.name

  const app = express()
  // Object.assign(app, options)
  app.port = options.port
  app.url = options.url
  app.db = new Database(options.postgresDatabaseUrl)

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
    app: options,
    partnerApps: options.zcapCapabilities.map(zc => {
      let url = parseUrl(zc.targetUri)
      url = `${url.protocol}//${url.host}`
      const name = url
      return { name, url }
    })
  })

  const SESSION_SECRET = `dont tell anyone this is ${appName}`
  const COOKIE_NAME = `session`

  // ROUTES
  const router = Router()
  app.use(router)
  router.use('*', async (req, res, next) => {
    // pg.connect((error, client, done)
    // await pg.connect()

    const sessionJwt = req.cookies[COOKIE_NAME]
    if (sessionJwt) {
      await new Promise((resolve, reject) => {
        jwt.verify(sessionJwt, SESSION_SECRET, (error, session) => {
          if (error){
            if (error) res.cookie('session', null)
          }else{
            res.locals.session = session
          }
          resolve()
        })
      })
    }

    next()
  })

  router.get('/', async (req, res) => {
    res.render('index', {
      // users: await app.db.getAllUsers(),
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
    const user = await app.db.getUser(username)
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
    const user = await app.db.createUser({ username, realname })
    createSessionCookie(res, user.username)
  })

  router.get('/send-me-to', (req, res) => {
    const { email } = res.locals.session
    const appUrl = req.query.app
    const user = options.users.find(user => user.email === email)
    if (!user) throw new Error(`cant find user email="${email}"`)

    const capability = options.zcapCapabilities.find(capability =>
      capability.targetUri.startsWith(appUrl)
    )
    if (!capability) throw new Error(`cant find capability`)

    // signed by the user identity
    const delegatedCapability = zcap.delegate(
      user.zcapIdentity,
      capability.id,
      options.zcapIdentity,
      ['authorization'],
      { email },
    );

    // signed by the server identity
    const jwt = zcap.invokeDelegable(
      user.zcapIdentity,
      delegatedCapability,
    );

    res.redirect(`${capability.targetUri}?zcap=${jwt}`)
  })

  router.get('/zcap-login', (req, res) => {
    const delegatedCapability = zcap.verifyZcapInvocation(req.query.zcap);

    const zauthCap = options.zcapAuthenticationCapabilities.find(zauthCap =>
      zauthCap.id === delegatedCapability.parentCapabilityId
    )
    const { email } = delegatedCapability.zcap.pii
    const did = delegatedCapability.invoker

    // query for existing user for did
    // if !exists
    //    insert user record here
    //        associated with did
    //
    // login as user

    // res.json({ zauthCap, delegatedCapability })

    const sessionJwt = jwt.sign({ email, did }, SESSION_SECRET, { expiresIn: 86400 });
    res
      .status(200)
      .cookie(COOKIE_NAME, sessionJwt)
      .redirect('/')


    // TODO login magic
    // res.redirect('/')
  })

  app.start = function start(callback){
    app.server = app.listen(app.port, callback)
  }

  return app
}

Object.assign(module.exports, { createApp })
