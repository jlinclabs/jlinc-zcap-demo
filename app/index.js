const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const hbs = require('express-hbs')
const jwt = require('jsonwebtoken')

function createApp({ apps, appName, appColor, port }){
  const SESSION_SECRET = `dont tell anyone this is ${appName}`

  const app = express()
  app.port = port
  app.url = `http://localhost:${port}`
  app.use(express.static(__dirname + '/public'));
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json({ }))
  app.use(cookieParser(SESSION_SECRET, {}))
  // Use `.hbs` for extensions and find partials in `views/partials`.
  app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials',
    // defaultLayout: __dirname + '/views/layout/default.hbs',
  }))
  app.set('view engine', 'hbs')
  app.set('views', __dirname + '/views')
  Object.assign(app.locals, {
    appUrl: app.url,
    appName,
    appColor,
    getAppUrls: () => apps.map(app => app.url),
  })

  // ROUTES
  app.use('*', (req, res, next) => {
    console.log('COOKIES', req.signedCookies)
    const sessionJwt = req.cookies.session
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
      .cookie('session', sessionJwt, {
        domain: `localhost:${port}`,
        httpOnly: true,
        signed: true,
        // sameSite: true,
      })
      .redirect('/')
  })

  app.post('/logout', (req, res) => {
    res.status(200).cookie('session', null).redirect('/')
  })

  app.start = function start(callback){
    app.server = app.listen(port, callback)
  }

  return app
}

Object.assign(module.exports, { createApp })
