module.exports = class Users {

  constructor({ pg, hl }){
    this.pg = pg
    this.hl = hl
  }

  async getAll(){
    const users = await this.pg.query('SELECT * FROM users')
    await this._loadHyperlinkProfiles(users)
    return users
  }

  async get(username){
    const [ user ] = await this.pg.query(
      `SELECT * FROM users WHERE username = $1`,
      [username],
    )
    await this._loadHyperlinkProfiles([user])
    return user
  }

  async _loadHyperlinkProfiles(users){
    const hlIdentities = await this.hl.getIdentities(
      users.map(u => u.hyperlink_id)
    )
    users.forEach((user, index) => {
      const hlIdentity = hlIdentities[index]
      if (hlIdentity.id !== user.hyperlink_id)
        throw new Error(`id mismatch?`)

      // load data from hyperlinc profile
      Object.assign(user, {
        realName,
        email,
      })
    })
    // get user profiles from hypercores
  }

  async create({ username, realname }){
    if (await this.get(username))
      throw new Error(`"${username}" is taken`)

    const hlIdentity = await this.hl.createIdentity()

    const user = await this.pg.one(
      `
      INSERT INTO users(username, hyperlink_id, hyperlink_public_key)
      VALUES($1, $2, $3)
      RETURNING *
      `,
      [username, hlIdentity.id, hlIdentity.publicKey]
    )
    if (!user) throw new Error(`failed to insert user`)

    await this.pg.one(
      `
      INSERT INTO hyperlinc_secret_keys
      VALUES($1, $2) RETURNING *
      `,
      [hlIdentity.publicKey, hlIdentity.secretKey]
    )
    // create hypercores
    // append inital message
    // append profile update declairing realname
    return user
  }

}


