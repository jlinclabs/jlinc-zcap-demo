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
    console.log(await this.getAllUsers())
    console.log({ username })
    const result = await this.pg.query({
      text: `SELECT * FROM users WHERE username = 'jared' LIMIT 1`,
      // values: [username],
    })
    console.log(result)
    return result.rows[0]
  }

  async createUser({ username, realname }){
    const x = await this.pg.query(
      `INSERT INTO users(username, realname) VALUES($1, $2) RETURNING *`,
      [username, realname]
    )
    console.log(x)
    return await this.getUser(username)
  }

}

