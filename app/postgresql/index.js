const { Pool: PGPool } = require('pg')
const { readFile } = require('fs').promises
const Path = require('path')

const SCHEMA_PATH = Path.resolve(__dirname, './schema.sql')

module.exports = function(options){
  const pg = new PGPool({
    connectionString: options.postgresDatabaseUrl,
  })
  return pg
}

module.exports.resetSchema = async function(){
  const pg = this()
  const schema = await readFile(SCHEMA_PATH)
  await pg.query(`${schema}`)
}

class Postgresql {
  constructor(connectionString){
    this.pg = new PGPool({ connectionString })
  }

  async reset(){
    const schema = await readFile(SCHEMA_PATH)
    await this.pg.query(`${schema}`)
  }

  async query(...args){
    const results = await this.pg.query(...args)
    return results.rows
  }

  async one(...args){
    const [ row ] = await this.query(...args)
    return row
  }
}

