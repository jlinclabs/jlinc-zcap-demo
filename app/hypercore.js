const Path = require('path')
const hypercore = require('hypercore')
const { toPromises } = require('hypercore-promisifier')
const Hyperbee = require('hyperbee')
const TMP_PATH = Path.resolve(process.cwd(), 'tmp')



class HypercoreLog {
  constructor(publicKey, options){
    this.directory = TMP_PATH + '/' + publicKey
    this.core = toPromises(hypercore(this.directory, publicKey, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json',
      ...options,
    }))
    this.bee = new Hyperbee(this.core, {
      keyEncoding: 'utf-8',
      valueEncoding: 'json',
    })
  }

  get length(){ return this.core.length }

  get key(){ return this.core.key }

  async append(...entries){
    await this.core.append(...entries)
  }

  async get(n){
    return await this.core.get(n)
  }

  async all(){
    return Promise.all(
      Array(this.length).fill().map((_, i) => this.bee.get(i))
    )
  }

}

module.exports = {
  HypercoreLog,
}
