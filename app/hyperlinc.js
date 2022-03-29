const Hyperlinc = require('../lib/hyperlinc')

module.exports = function(options){
  const hl = new Hyperlinc({
    storagePath: options.appDirectory + '/hyperlinc',
  })
  return hl
}

