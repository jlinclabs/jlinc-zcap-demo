const Hyperlinc = require('./hyperlinc')

module.exports = function(options){
  const hl = new Hyperlinc({
    storagePath: options.appDirectory + '/hyperlinc',
  })
  // hl.connect() dont connect until start
  return hl
}

