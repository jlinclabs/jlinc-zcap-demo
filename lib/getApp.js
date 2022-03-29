#!/usr/bin/env node

const Path = require('path')
const { createApp } = require('../app')

module.exports = function getApp(appDirectory){
  appDirectory = Path.resolve(appDirectory)
  if (!appDirectory) throw new Error(`app directory required`)
  process.chdir(appDirectory)
  const configPath = Path.resolve(appDirectory + '/config.json')
  const config = require(configPath)
  if (process.env.PORT) config.port = process.env.PORT
  return createApp(config)
}
