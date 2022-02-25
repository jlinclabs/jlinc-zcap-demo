const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const hbs = require('express-hbs')
const jwt = require('jsonwebtoken')

function createApp(options){
  const appName = options.name
  const app = express()
  // Object.assign(app, options)
  app.port = options.port
  app.url = options.url
  app.use(express.static(__dirname + '/public'));
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json({ }))
  app.use(cookieParser())
  // Use `.hbs` for extensions and find partials in `views/partials`.
  app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials',
    // defaultLayout: __dirname + '/views/layout/default.hbs',
  }))
  app.set('view engine', 'hbs')
  app.set('views', __dirname + '/views')
  Object.assign(app.locals, {
    app: options,
    otherApps: options.otherApps,
  })

  const SESSION_SECRET = `dont tell anyone this is ${appName}`
  const COOKIE_NAME = `session`
  // ROUTES
  app.use('*', (req, res, next) => {
    // console.log('COOKIES', req.cookies)
    const sessionJwt = req.cookies[COOKIE_NAME]
    const setSession = (error, session) => {
      if (error) res.cookie('session', null)
      res.locals.session = session
      next()
    }
    if (sessionJwt) jwt.verify(sessionJwt, SESSION_SECRET, setSession)
    else setSession()
  })

  app.get('/', (req, res) => {
    res.render('index')
  })

  app.post('/login', (req, res) => {
    const session = {
      did: 'did:jlinc:8AZLka1zkZ8Ve5bK_mS9QwS9oTkTX4IgwhPR4FW99iQ',
      email: 'frog@example.com',
    }
    const sessionJwt = jwt.sign(session, SESSION_SECRET, { expiresIn: 86400 });
    res
      .status(200)
      .cookie(COOKIE_NAME, sessionJwt, {
        domain: options.url, // extract domain
        httpOnly: true,
        // signed: true,
        // sameSite: true,
      })
      .redirect('/')
  })

  app.post('/logout', (req, res) => {
    res.status(200).clearCookie(COOKIE_NAME).redirect('/')
  })

  app.get('/send-me-to', (req, res) => {
    const appName = req.query.app
    const app = options.otherApps.find(app => app.name === appName)
    if (!app){
      res.status(500).send(`ERROR: bad app url`)
    }else{
      res.redirect(`${app.url}/zcap-login?zcap=2u3h21jh3j12h3kj21hjkh321jk3h`)
    }
  })

  app.get('/zcap-login', (req, res) => {
    const zcap = req.query.zcap
    res.send(`MAGIC LOGIN TBD: ${zcap}`)
    // TODO login magic
    // res.redirect('/')
  })

  app.start = function start(callback){
    app.server = app.listen(app.port, callback)
  }

  return app
}

Object.assign(module.exports, { createApp })
