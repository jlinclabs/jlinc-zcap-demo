const crypto = require('hypercore-crypto')
const b64 = require('urlsafe-base64')

const keys = crypto.keyPair()
const publicKeyHex = keys.publicKey.toString('hex')
console.log(`public key HEX "${publicKeyHex}"`)
const publicKeyB64 = b64.encode(keys.publicKey)
console.log(`public key B64 "${publicKeyB64}"`)
const publicKeyHex2 = b64.decode(publicKeyB64).toString('hex')
console.log(`public key HEX "${publicKeyHex2}"`)

if (publicKeyHex !== publicKeyHex2) throw new Error('fail')


