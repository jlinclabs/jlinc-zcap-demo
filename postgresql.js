// const { Pool: PGPool } = require('pg')
// const { readFile } = require('fs').promises
// const Path = require('path')

// const SCHEMA_PATH = Path.resolve(__dirname, './schema.sql')

// module.exports = function(options){
//   const pg = new PGPool({
//     connectionString: options.postgresDatabaseUrl,
//   })
//   process.on('SIGTERM', () => { pg.destroy() })
//   Object.assign(pg, {
//     async resetSchema(){
//       const schema = await readFile(SCHEMA_PATH)
//       await this.query(`${schema}`)
//     },

//     async many(...args){
//       const results = await this.query(...args)
//       return results.rows
//     },

//     async one(...args){
//       const [ row ] = await this.many(...args)
//       return row
//     }
//   })
//   return pg
// }


// // class Postgresql {
// //   constructor(connectionString){
// //     this.pg = new PGPool({ connectionString })
// //   }

// //   async reset(){
// //     const schema = await readFile(SCHEMA_PATH)
// //     await this.pg.query(`${schema}`)
// //   }

// //   async query(...args){
// //     const results = await this.pg.query(...args)
// //     return results.rows
// //   }

// //   async one(...args){
// //     const [ row ] = await this.query(...args)
// //     return row
// //   }
// // }

