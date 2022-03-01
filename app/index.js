const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const hbs = require('express-hbs')
const jwt = require('jsonwebtoken')
const zcap = require('@jlinc/zcap')
const parseUrl = require('url').parse

hbs.handlebars.registerHelper('toJSON', object =>
  new hbs.handlebars.SafeString(JSON.stringify(object), null, 2)
)

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
  app.use('*', (req, res, next) => {
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

  app.get('/login', (req, res) => {
    res.render('login')
  })

  app.post('/login', (req, res) => {
    const { email, password } = req.body
    let session
    for (const user of options.users){
      if (user.email === email && user.password === password){
        session = { email, did: user.zcapIdentity.did }
      }
    }
    if (session){
      const sessionJwt = jwt.sign(session, SESSION_SECRET, { expiresIn: 86400 });
      res
        .status(200)
        .cookie(COOKIE_NAME, sessionJwt)
        .redirect('/')
    }else{
      res
        .status(200)
        .clearCookie(COOKIE_NAME)
        .render('error', {
          error: { message: 'bad username or password' },
        })
    }
  })

  app.post('/logout', (req, res) => {
    res.status(200).clearCookie(COOKIE_NAME).redirect('/')
  })

  app.get('/send-me-to', (req, res) => {
    const { email } = res.locals.session
    const appUrl = req.query.app
    const user = options.users.find(user => user.email === email)
    if (!user) throw new Error(`cant find user email="${email}"`)

    const capability = options.zcapCapabilities.find(capability =>
      capability.targetUri.startsWith(appUrl)
    )
    if (!capability) throw new Error(`cant find capability`)

    const delegatedCapability = zcap.delegate(
      user.zcapIdentity,
      capability.id,
      options.zcapIdentity,
      ['authorization'],
      { email },
    );

    const jwt = zcap.invokeDelegable(
      user.zcapIdentity,
      delegatedCapability,
    );

    res.redirect(`${capability.targetUri}?zcap=${jwt}`)
  })

  app.get('/zcap-login', (req, res) => {
    const delegatedCapability = zcap.verifyZcapInvocation(req.query.zcap);

    const zauthCap = options.zcapAuthenticationCapabilities.find(zauthCap =>
      zauthCap.id === delegatedCapability.parentCapabilityId
    )
    const { email } = delegatedCapability.zcap.pii
    const did = delegatedCapability.invoker
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
