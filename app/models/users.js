module.exports = app => new Users(app)

class Users {

  constructor({ url, pg, hl }){
    this.pg = pg
    this.hl = hl
    this.appUrl = url
  }

  async getAll(){
    const users = await this.pg.many('SELECT * FROM users')
    await this._loadHyperlinkProfiles(users)
    return users
  }

  async get(username){
    const [ user ] = await this.pg.many(
      `SELECT * FROM users WHERE username = $1`,
      [username],
    )
    if (user) await this._loadHyperlinkProfiles([user])
    return user
  }

  async _loadHyperlinkProfiles(users){
    const profiles = await this.hl.getProfiles(
      users.map(u => u.hyperlink_id)
    )
    users.forEach((user, index) => {
      const profile = profiles[index]
      const { realname, email } = profile
      Object.assign(user, { realname, email })
    })
  }

  async create({ username, realname }){
    if (await this.get(username))
      throw new Error(`"${username}" is taken`)

    const hlIdentity = await this.hl.createIdentity({
      appUrl: this.appUrl,
    })

    await hlIdentity.patchProfile({ realname })

    const user = await this.pg.one(
      `
      INSERT INTO users(username, hyperlink_id)
      VALUES($1, $2)
      RETURNING *
      `,
      [username, hlIdentity.id]
    )
    if (!user) throw new Error(`failed to insert user`)

    await this.pg.one(
      `
      INSERT INTO hyperlinc_secret_keys
      VALUES($1, $2) RETURNING *
      `,
      [hlIdentity.id, hlIdentity.secretKey]
    )

    return await this.get(username)
  }

  async _getHyperlinkIdentity(username){
    const {
      hyperlink_id: id,
      hyperlink_secret_key: secretKey,
    } = await this.pg.one(
      `
        SELECT
          hyperlinc_secret_keys.hyperlink_id,
          hyperlinc_secret_keys.hyperlink_secret_key
        FROM users
        LEFT JOIN hyperlinc_secret_keys
        ON hyperlinc_secret_keys.hyperlink_id = users.hyperlink_id
        WHERE username=$1
      `,
      [username]
    )
    return await this.hl.getIdentity(id, secretKey)
  }

  async updateProfile(username, changes){
    const hlIdentity = await this._getHyperlinkIdentity(username)
    await hlIdentity.patchProfile(changes)
  }

  async getProfileEvents(username){
    const hlIdentity = await this._getHyperlinkIdentity(username)
    await hlIdentity.update()
    return await hlIdentity.getEventsForType('patchProfile')
  }

}


