#!/usr/bin/env node
'use strict';

import DHT from '@hyperswarm/dht'

const bootstrapper = DHT.bootstrapper(49736, {
  ephemeral: true,
  seed: DHT.hash(Buffer.from('jlinc-zcap-demo-dht-bootstrap')),
})

bootstrapper.ready().then(() => {
  console.log(
    'Hyperswarm bootstrapper running on port',
    bootstrapper.address().port
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
