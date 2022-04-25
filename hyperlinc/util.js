const b4a = require('b4a')

function fromHex(str){
  return str && b4a.from(str, 'hex')
}

function toHex(buf){
  return buf && b4a.toString(buf, 'hex')
}

// async function coreToArray(core){
//   const array = []
//   for (let i = core.length - 1; i >= 0; i--)
//     array[i] = await core.get(i)
//   return array
// }

// function hashPublicKey(publicKey){
//   const digest = Buffer.allocUnsafe(32)
//   sodium.crypto_generichash(digest, Buffer.from('hyperlinc'), Buffer.from(publicKey))
//   return digest
// }

Object.assign(module.exports, {
  fromHex,
  toHex,
})
