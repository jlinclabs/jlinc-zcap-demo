const Path = require('path')
const hypercore = require('hypercore')
const { toPromises } = require('hypercore-promisifier')

const TMP_PATH = Path.resolve(process.cwd(), 'tmp')

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

module.exports = {
  HypercoreLog,
}
