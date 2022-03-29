#!/usr/bin/env node

const Path = require('path')
const { createApp } = require('../app')

module.exports = function getApp(appDirectory){
  appDirectory = Path.resolve(appDirectory)
  if (!appDirectory) throw new Error(`app directory required`)
  console.log(`appDirectory=${appDirectory}`)
  process.chdir(appDirectory)
  console.log(`cwd=${process.cwd()}`)

  // fs.existsSync(appDirectory)

  const configPath = Path.resolve(appDirectory + '/config.json')
  console.log(`configPath=${configPath}`)

  const config = require(configPath)
  if (process.env.PORT) config.port = process.env.PORT
  return createApp(config)
}
