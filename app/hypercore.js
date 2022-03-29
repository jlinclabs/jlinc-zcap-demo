// const Path = require('path')
// const { Client: HyperspaceClient } = require('hyperspace')
// const hypercore = require('hypercore')
// const { toPromises } = require('hypercore-promisifier')
// const hyperbee = require('hyperbee')
// const TMP_PATH = Path.resolve(process.cwd(), 'tmp')

// const hyperspaceClient = new HyperspaceClient()
// const beeCore = hyperspaceClient.corestore().get({
//   key: '01a8cd697302f406cb77c7d4717c68872ea219f9fe4d690d6f9276c270b27dd6',
// })
// const bee = new hyperbee(beeCore, {
//   keyEncoding: 'utf-8',
//   valueEncoding: 'json',
// })

// console.log('bee', bee)
// bee.get(0)

// class HypercoreLog {
//   constructor(publicKey, options){
//     this.directory = TMP_PATH + '/' + publicKey
//     this.core = toPromises(hypercore(this.directory, publicKey, {
//       keyEncoding: 'utf-8',
//       valueEncoding: 'json',
//       ...options,
//     }))
//     this.bee = new Hyperbee(this.core, {
//       keyEncoding: 'utf-8',
//       valueEncoding: 'json',
//     })
//   }

//   get length(){ return this.core.length }

//   get key(){ return this.core.key }

//   async append(...entries){
//     await this.core.append(...entries)
//   }

//   async get(n){
//     return await this.core.get(n)
//   }

//   async all(){
//     return Promise.all(
//       Array(this.length).fill().map((_, i) => this.bee.get(i))
//     )
//   }

// }

// module.exports = {
//   HypercoreLog,
// }
