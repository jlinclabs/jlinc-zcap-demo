const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const hbs = require('express-hbs')
const jwt = require('jsonwebtoken')

function createApp({ appName, appColor, port }){
  const app = express()
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
    appName,
    appColor,
  })

  const SESSION_SECRET = `dont tell anyone this is ${appName}`


  // ROUTES
  app.use('*', (req, res, next) => {
    console.log('COOKIES', req.cookies.session)
    const sessionJwt = req.cookies.session
    const setSession = (error, session) => {
      if (error){
        res.status(500).cookie('session', null).send(`error=${error}`)
      }else{
        res.locals.session = session
        next()
      }
    }
    if (sessionJwt) jwt.verify(sessionJwt, SESSION_SECRET, setSession)
    else setSession()
  })

  app.get('/', (req, res) => {
    res.render('index')
  })

  app.post('/login', (req, res) => {
    // const signedToken = jwt.sign(token, tokenSecret, { expiresIn: 86400 });
    const session = {
      did: 'did:jlinc:8AZLka1zkZ8Ve5bK_mS9QwS9oTkTX4IgwhPR4FW99iQ',
      email: 'frog@example.com',
    }
    const sessionJwt = jwt.sign(session, SESSION_SECRET, { expiresIn: 86400 });
    res.status(200).cookie('session', sessionJwt).redirect('/')
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
