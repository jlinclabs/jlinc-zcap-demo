const Path = require('path')
const configPath = Path.join(process.cwd(), 'config.json')
console.log('CONFIG=', configPath)
module.exports = configPath
