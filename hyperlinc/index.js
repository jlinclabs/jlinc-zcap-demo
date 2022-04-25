
const { inspect }  = require('util')
const Corestore  = require('corestore')
const Hyperswarm  = require('hyperswarm')
const crypto  = require('hypercore-crypto')
const dht  = require('@hyperswarm/dht')
const { fromHex, toHex } = require('./util')
const Identity = require('./Identity')

const TOPIC_KEY = fromHex('604d03ea2045c1adfcb6adad02d71667e03c27ec846fe4f5c4d912c10464aea0')

module.exports = class Hyperlinc {
  constructor(options = {}){
    const { storagePath } = options
    this.storagePath = storagePath
    this.corestore = new Corestore(this.storagePath)
    this.topicCore = this.corestore.get({ key: TOPIC_KEY })
  }

  async connect(){
    const seed = dht.hash(Buffer.from(this.storagePath))
    this.swarm = new Hyperswarm({
      seed,
      bootstrap: [
        { host: '127.0.0.1', port: 49736 },
      ]
    })
    console.log('bootstrapNodes', this.swarm.dht.bootstrapNodes)

    this.swarm.dht.ready().then(async () => {
      console.log('SWARM DHT READY!', {
        bootstrapped: this.swarm.dht.bootstrapped,
        nodes: this.swarm.dht.nodes,
      })
    })

    console.log(
      `[Hyperlinc] connecting to swarm as`,
      toHex(this.swarm.keyPair.publicKey),
    )

    process.on('SIGTERM', () => { this.destroy() })

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
      // if (this.swarm.peers.size === 0){
      //   console.log('waiting for first peer…')
      //   await new Promise((resolve, reject) => {
      //     this.swarm.once('connection', () => { resolve() })
      //     setTimeout(
      //       () => { console.error('timeout waiting for first hyperswarm connection') },
      //       60 * 1000
      //     )
      //   })
      // }
    })

    await this.swarm.listen()
  }

  async ready(){
    if (!this._ready) await this.connect()
    await this._ready
  }

  async destroy(){
    console.log('[Hyperlinc] disconnecting from swarm')
    await this.swarm.clear()
    await this.swarm.destroy()
  }

  async status(){
    const discoveryKeys = [...this.corestore.cores.keys()]
    return {
      numberOfPeers: this.swarm.peers.size,
      connected: this.swarm.peers.size > 0,
      numberOfCores: this.corestore.cores.size,
      cores: discoveryKeys.map(discoveryKey => {
        const core = this.corestore.cores.get(discoveryKey)
        return {
          key: toHex(core.key),
          length: core.length,
        }
      }),
    }
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
    console.log('Hyperlinc.getProfiles', ids)
    return await Promise.all(
      ids.map(async id => {
        const identity = this.getIdentity(id)
        await identity.update()
        console.log('Hyperlinc.getProfiles updated', id)
        return await identity.getProfile()
      })
    )
  }

}

