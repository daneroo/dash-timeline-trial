
// See neon for S3/minio

const os = require('os')
const pkg = require('../package')

module.exports = {
  hostname: process.env.HOSTALIAS || os.hostname(),
  version: {
    package: `${pkg.name}@${pkg.version}`,
    node: process.version
  },
  express: {
    port: process.env.PORT || 8000
  },
  graphql: {},
  logging: {
    silent: (process.env.NODE_ENV === 'test'),
    level: process.env.LOG_LEVEL || 'debug', // debug, verbose, info, warn, error
    // replace format by profile
    format: process.env.LOG_FORMAT || 'text', // text , json
    sequelize: process.env.LOG_LEVEL_SEQL || 'none' // debug, verbose, info, warn, error
    //  loggly...,profile
  }
  // sequelize: {
  //   credentials: {
  //     database: process.env.SEQL_DATABASE || 'database',
  //     username: process.env.SEQL_USERNAME || 'username',
  //     password: process.env.SEQL_PASSWORD || 'password'
  //   },
  //   settings: {
  //     host: process.env.SEQL_HOST || 'localhost',
  //     dialect: process.env.SEQL_DIALECT || 'sqlite',
  //     //  dialect: 'mysql'|'sqlite'|'postgres'|'mssql',
  //     pool: {
  //       max: 10,
  //       min: 0,
  //       idle: 10000
  //     },
  //     // Symbol based operators for better security, read more at http://docs.sequelizejs.com/manual/tutorial/querying.html#operators
  //     operatorsAliases: false,

  //     // logging: () => {},
  //     // logging: process.env.SEQL_NOLOG ? () => {} : console.log,
  //     // SQLite only
  //     storage: process.env.SEQL_SQLITE_FILENAME || 'default.sqlite'
  //   }
  // }
}
