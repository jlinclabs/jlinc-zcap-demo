const knexfile = require('./knexfile.js')
const knex = require('knex')(
  knexfile[process.env.NODE_ENV || 'development']
)
module.exports = knex