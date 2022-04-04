#!/usr/bin/env node

const Path = require('path')
const createHttpServer = require('../http-server')

module.exports = function getHttpServer(appDirectory){
  appDirectory = Path.resolve(appDirectory)
  if (!appDirectory) throw new Error(`app directory required`)
  process.chdir(appDirectory)
  const configPath = Path.resolve(appDirectory + '/config.json')
  const config = require(configPath)
  config.appDirectory = appDirectory
  if (process.env.PORT) config.port = process.env.PORT
  return createHttpServer(config)
}
