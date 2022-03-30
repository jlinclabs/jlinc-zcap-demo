/* Hyperlinc
 *
 * this code is intended to be in required node package dependency
 */
const b4a = require('b4a')
const sodium = require('sodium-universal')
const Corestore = require('corestore')
const Hyperswarm = require('hyperswarm')
const crypto = require('hypercore-crypto')

const TOPIC_KEY = fromHex('604d03ea2045c1adfcb6adad02d71667e03c27ec846fe4f5c4d912c10464aea0')

module.exports = class Hyperlinc {
  constructor(options = {}){
    const { storagePath } = options
    this.storagePath = storagePath
    this.corestore = new Corestore(this.storagePath)
    this.topicCore = this.corestore.get({ key: TOPIC_KEY })
  }

  async connect(){
    this.swarm = new Hyperswarm({})

    // process.on('SIGINT', () => { this.destroy() })
    process.on('SIGTERM', () => { this.destroy() })
    // process.on('SIGQUIT', () => { this.destroy() })

    this.swarm.on('connection', (socket) => {
      console.log(
        '[Hyperlinc] new peer connection from',
        toHex(socket.remotePublicKey)
      )
      this.corestore.replicate(socket, {
        keepAlive: true,
        // live?
      })
    })

    this._ready = this.topicCore.ready().then(async () => {
      console.log(`connecting to hyperlinc swarm ${toHex(this.topicCore.discoveryKey)}`)
      this.swarm.join(this.topicCore.discoveryKey)
      // swarm.join(topic, { server: false, client: true })
      // await this.swarm.flush()
      // this.swarm.flush().then(() => {
      //   console.log('[Hyperlinc] swarm flushed!')
      // })
    })
  }

  async ready(){
    if (!this._ready) await this.connect()
    await this._ready
  }

  async destroy(){
    console.log('destroying the swarm!')
    await this.swarm.clear()
    await this.swarm.destroy()
    console.log('swarm destroyed!')
  }

  async createIdentity({ appUrl }){
    await this.ready()
    let { publicKey: id, secretKey } = crypto.keyPair()
    id = toHex(id)
    secretKey = toHex(secretKey)
    const identity = this.getIdentity(id, secretKey)
    await identity.init({ appUrl })
    return identity
  }

  getIdentity(id, secretKey){
    const core = this.corestore.get({
      key: fromHex(id),
      secretKey: fromHex(secretKey),
    })
    return new Identity(id, secretKey, core)
  }

  async getProfiles(ids){
    return await Promise.all(
      ids.map(async id => {
        const identity = this.getIdentity(id)
        await identity.update()
        return await identity.getProfile()
      })
    )
  }

}


class Identity {
  constructor(id, secretKey, core){
    this.id = id
    this.secretKey = secretKey
    this.core = core
  }

  async update(){
    // if (!this.core.writable)
    console.log('AWAITING FOR CORE TO UPDATE', this.core)
    await this.core.update()
  }

  async appendBatch(...updates){
    await this.core.append(
      ...updates.map(([eventType, payload]) =>
        serialize({...payload, eventType, at: Date.now()})
      )
    )
  }

  async append(eventType, payload){
    return await this.appendBatch([eventType, payload])
  }

  async getAllEvents(){
    const gets = []
    for (let i = this.core.length - 1; i >= 0; i--)
      gets.push(this.core.get(i))
    const rawEvents = await Promise.all(gets)
    return rawEvents.map(json => {
      const event = deserialize(json)
      event.at = new Date(event.at)
      return event
    })
  }

  async getEventsForType(eventType){
    return (await this.getAllEvents())
      .filter(e => e.eventType === eventType)
  }

  async init({ appUrl }){
    await this.declareAppAgent({ appUrl })
  }

  async declareAppAgent({ appUrl }){
    await this.append('declareAppAgent', { url: appUrl })
  }

  async patchProfile(patch){
    await this.append('patchProfile', {patch})
  }

  async getProfile(){
    const events = await this.getEventsForType('patchProfile')
    return events.reverse().reduce(
      (profile, {patch}) => Object.assign(profile, patch),
      {}
    )
  }
}

function fromHex(str){ return str && b4a.from(str, 'hex') }
function toHex(buf){ return buf && b4a.toString(buf, 'hex') }

async function coreToArray(core){
  const array = []
  for (let i = core.length - 1; i >= 0; i--)
    array[i] = await core.get(i)
  return array
}

function serialize(payload){ return JSON.stringify(payload) }
function deserialize(msg){ return JSON.parse(msg) }


function hashPublicKey(publicKey){
  const digest = Buffer.allocUnsafe(32)
  sodium.crypto_generichash(digest, Buffer.from('hyperlinc'), Buffer.from(publicKey))
  return digest
}
