const Path = require('path')
const hypercore = require('hypercore')
const { toPromises } = require('hypercore-promisifier')

const TMP_PATH = Path.resolve(process.cwd(), 'tmp')

console.log('HUYPERCORE TEMP PATH', TMP_PATH)

class HypercoreLog {
  constructor(publicKey, options){
    this.directory = TMP_PATH + '/' + publicKey
    this.core = toPromises(hypercore(this.directory, publicKey, {
      valueEncoding: 'utf-8',
      ...options,
    }))
  }

  get length(){ return this.core.length }

  get key(){ return this.core.key }

  async append(...entries){
    await this.core.append(entries.map(JSON.stringify))
  }

  async get(n){
    return JSON.parse(await this.core.get(n))
  }

  async all(){
    return Promise.all(
      Array(this.length).fill().map((_, i) => this.get(i))
    )
  }

}

var key = Buffer.from('9718a1ff1c4ca79feac551c0c7212a65e4091278ec886b88be01ee4039682238', 'hex')
var secretKey = Buffer.from(
  '53729c0311846cca9cc0eded07aaf9e6689705b6a0b1bb8c3a2a839b72fda383' +
  '9718a1ff1c4ca79feac551c0c7212a65e4091278ec886b88be01ee4039682238',
  'hex'
)


module.exports = {
  HypercoreLog,
}
