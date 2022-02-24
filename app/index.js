const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const hbs = require('express-hbs')

function createApp({ appName, appColor, port }){
  const app = express()
  app.use(express.static(__dirname + '/public'));
  app.use(bodyParser.urlencoded({ extended: false }))
  app.use(bodyParser.json({ }))
  app.use(cookieParser())
  // Use `.hbs` for extensions and find partials in `views/partials`.
  app.engine('hbs', hbs.express4({
    partialsDir: __dirname + '/views/partials',
    defaultLayout: __dirname + '/views/layout/default.hbs',
  }))
  app.set('view engine', 'hbs')
  app.set('views', __dirname + '/views')
  Object.assign(app.locals, {
    appName,
    appColor,
  })

  // ROUTES
  app.use('*', (req, res, next) => {
    // res.locals.currentUser = getCurrentUser(req)
    console.log('COOKIES', req.cookies)
    res.locals.currentUser = {
      did: 'did:jlinc:8AZLka1zkZ8Ve5bK_mS9QwS9oTkTX4IgwhPR4FW99iQ',
      email: 'frog@example.com',
    }
    next()
  })

  app.get('/', (req, res) => {
    res.render('index');
  })

  app.get('/logout', (req, res) => {
    res.send('/login TBD')
  })

  app.get('/login', (req, res) => {
    res.send('/login TBD')
  })

  app.start = function start(callback){
    app.server = app.listen(port, callback)
  }

  return app
}

Object.assign(module.exports, { createApp })
