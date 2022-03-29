const { Pool: PGPool } = require('pg')
const { readFile } = require('fs').promises
const Path = require('path')

const SCHEMA_PATH = Path.resolve(__dirname, './schema.sql')

module.exports = class Database {
  constructor(connectionString){
    this.pg = new PGPool({ connectionString })
  }

  async reset(){
    const schema = await readFile(SCHEMA_PATH)
    await this.pg.query(`${schema}`)
  }

  async getAllUsers(){
    const { rows: users } = await this.pg.query('SELECT * FROM users')
    return users
  }

  async getUser(username){
    const { rows: [ user ] } = await this.pg.query(
      `SELECT * FROM users WHERE username = $1`,
      [username],
    )
    return user
  }

  async createUser({ username, realname }){
    const { rows: [ user ] } = await this.pg.query(
      `INSERT INTO users(username, realname) VALUES($1, $2) RETURNING *`,
      [username, realname]
    )
    return user
  }

}

