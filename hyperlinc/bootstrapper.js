#!/usr/bin/env node
'use strict';

const DHT = require('@hyperswarm/dht')

const PORT = process.env.PORT || 49736

const bootstrapper = DHT.bootstrapper(PORT, {
  ephemeral: true,
  seed: DHT.hash(Buffer.from('hyperlinc')),
})

bootstrapper.ready().then(() => {
  console.log(
    'Hyperswarm bootstrapper running on port',
    bootstrapper.address(),
  )
})

bootstrapper.on('add-node', node => {
  console.log('node added', node.id.toString('hex'))
})

bootstrapper.on('remove-node', node => {
  console.log('node removed', node.id.toString('hex'))
})

process.once('SIGINT', async function () {
  console.log('Closing server...')
  await bootstrapper.destroy()
  process.exit(0)
})

