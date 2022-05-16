const { Sequelize } = require('sequelize')

module.exports = app =>
  new Sequelize(app.config.postgresDatabaseUrl, {
    logging: console.log,
  })
