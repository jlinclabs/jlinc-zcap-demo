import Path from 'path'
import JlinxApp from 'jlinx-app'
import appConfig from './appConfig.js'

const jlinxApp = new JlinxApp({
  storagePath: Path.join(appConfig.APP_DIR, 'jlinx'),
})

export default jlinxApp
