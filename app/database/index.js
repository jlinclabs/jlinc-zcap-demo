const { Pool: PGPool } = require('pg')
const { readFile } = require('fs').promises
const Path = require('path')

const SCHEMA_PATH = Path.resolve(__dirname, './schema.sql')

module.exports = class Database {
  constructor(connectionString){
    this.pg = new PGPool({ connectionString })
  }

  async loadSchema(){
    const schema = await readFile(SCHEMA_PATH)
    await app.pg.query(`${schema}`)
  }

  async getUsers(){
    await this.pg.query('SELECT * FROM users')
  }
}

