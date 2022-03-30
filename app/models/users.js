module.exports = app => new Users(app)

class Users {

  constructor({ url, pg, hl }){
    this.pg = pg
    this.hl = hl
    this.appUrl = url
  }

  async getAll(){
    const users = await this.pg.many('SELECT * FROM users')
    await this._loadHyperlincProfiles(users)
    return users
  }

  async get(username){
    const [ user ] = await this.pg.many(
      `SELECT * FROM users WHERE username = $1`,
      [username],
    )
    if (user) await this._loadHyperlincProfiles([user])
    return user
  }

  async _loadHyperlincProfiles(users){
    const profiles = await this.hl.getProfiles(
      users.map(u => u.hyperlinc_id)
    )
    users.forEach((user, index) => {
      const profile = profiles[index]
      const { realname, email } = profile
      Object.assign(user, { realname, email })
    })
  }

  async create({ username, hyperlincId }){
    console.log('CREATE USER', { username, hyperlincId })
    if (await this.get(username))
      throw new Error(`"${username}" is taken`)

    const hlIdentity = hyperlincId
      ? await this.hl.getIdentity(hyperlincId)
      : await this.hl.createIdentity({ appUrl: this.appUrl })

    // await hlIdentity.patchProfile({
    //   realname,
    //   preferredUsername: username,
    // })

    const user = await this.pg.one(
      `
      INSERT INTO users(username, hyperlinc_id)
      VALUES($1, $2)
      RETURNING *
      `,
      [username, hlIdentity.id]
    )
    if (!user) throw new Error(`failed to insert user`)

    if (hlIdentity.secretKey)
      await this.pg.one(
        `
        INSERT INTO hyperlinc_secret_keys
        VALUES($1, $2) RETURNING *
        `,
        [hlIdentity.id, hlIdentity.secretKey]
      )

    return await this.get(username)
  }

  async _getHyperlincIdentity(username){
    const {
      hyperlinc_id: id,
      hyperlinc_secret_key: secretKey,
    } = await this.pg.one(
      `
        SELECT
          hyperlinc_secret_keys.hyperlinc_id,
          hyperlinc_secret_keys.hyperlinc_secret_key
        FROM users
        LEFT JOIN hyperlinc_secret_keys
        ON hyperlinc_secret_keys.hyperlinc_id = users.hyperlinc_id
        WHERE username=$1
      `,
      [username]
    )
    return await this.hl.getIdentity(id, secretKey)
  }

  async findByHyperlincId(hyperlincId){
    const user = await this.pg.one(
      `SELECT * FROM users WHERE hyperlinc_id=$1`,
      [hyperlincId]
    )
    if (user) return await this.get(user.username)
  }

  // async getHyperlincProfile(hyperlincId){
  //   const hlIdentity = await this.hl.getIdentity(hyperlincId)
  //   return await hlIdentity.getProfile()
  // }

  async updateProfile(username, changes){
    const hlIdentity = await this._getHyperlincIdentity(username)
    await hlIdentity.patchProfile(changes)
  }

  async _getAllHyperlincEvents(username){
    const hlIdentity = await this._getHyperlincIdentity(username)
    await hlIdentity.update()
    return await hlIdentity.getAllEvents()
  }

}


