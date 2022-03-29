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
  }

  async connect(){
    this.swarm = new Hyperswarm({})

    this.swarm.on('connection', (socket) => {
      console.log(
        '[Hyperlinc] new peer connection from',
        toHex(socket.remotePublicKey)
      )
    })

    this.topicCore = corestore.get(TOPIC_KEY)

    this.swarm.join(this.topicCore.discoveryKey)
    // swarm.join(topic, { server: false, client: true })


    await this.topicCore.ready()

    // await this.swarm.flush()
    swarm.flush().then(() => {
      console.log('[Hyperlinc] swarm flushed!')
    })
  }

  createIdentity(){
    const { publicKey, secretKey } = crypto.keyPair()
    return {
      // id: toHex(hashPublicKey(publicKey)),
      id: toHex(publicKey),
      secretKey: toHex(secretKey),
    }
  }

  async getProfiles(ids){
    this.corestore.get({
      key: fromHex(publicKey),
      secretKey: user.publicKey === publicKey
        ? fromHex(user.secretKey)
        : undefined,
    })
  }

  async getProfiles(ids){
    // update all cores
    // render projections
    // return index matches array
    return ids.map((_, i) => {
      return {
        realname: `fake${i}`,
        email: `${i}@fake.me`,
      }
    })
  }
}


function fromHex(str){ return str && b4a.from(str, 'hex') }
function toHex(buf){ return buf && b4a.toString(buf, 'hex') }

async function coreToArray(core){
  const array = []
  for (let i = core.length - 1; i >= 0; i--)
    array[i] = deserialize(await core.get(i))
  return array
}

function serialize(payload){ return JSON.stringify(payload) }
function deserialize(msg){ return JSON.parse(msg) }


function hashPublicKey(publicKey){
  const digest = Buffer.allocUnsafe(32)
  sodium.crypto_generichash(digest, Buffer.from('hyperlinc'), Buffer.from(publicKey))
  return digest
}
