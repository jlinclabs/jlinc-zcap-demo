const Hyperlinc = require('../lib/hyperlinc')

module.exports = function(options){
  return new Hyperlinc({
    storagePath: options.appDirectory + '/hyperlinc',
  })
}

