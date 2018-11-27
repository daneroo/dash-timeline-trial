'use strict'

// TODO(daneroo): See neon for userInfo,requestId,product/serviceName
// TODO(daneroo): Exception logging: https://github.com/winstonjs/winston#exceptions
// TODO(daneroo): figure out how to control default level (which is info) from ENV (verbose,debug)

// dependencies - core-public-internal
const winston = require('winston')
// const morgan = require('morgan')
// const json = require('morgan-json')

const config = require('../../config')

// Remove to add our own..
const logger = winston.createLogger({
  transports: [
    // - Write to all logs with level `info` and below to `combined.log`
    // new winston.transports.File({ filename: 'error.log', level: 'error' }),
    // - Write all logs error (and below) to `error.log`.
    // new winston.transports.File({ filename: 'combined.log' })
    // new winston.transports.Stream
    new winston.transports.Console({
      silent: config.logging.silent,
      level: config.logging.level,
      format: winston.format.combine(
        // keepers
        winston.format.colorize(),
        winston.format.padLevels(), // must be after our flat for prettyness
        // winston.format.timestamp(),
        // winston.format.timestamp({ format: 'THH:mm:ss.SZZ' }), // but this is LocalTime
        require('./console').shortstamp(), // short and UTC
        require('./console').flat({ padded: false, pretty: true })

        // Experiments
        // winston.format.splat(),
        // winston.format.simple()
        // winston.format.json()
        // winston.format.prettyPrint()
        // winston.format.printf((info) => {
        //   // console.log(JSON.stringify(info))
        //   // console.log(JSON.stringify(require('util').inspect(info, null, true), null, 2))
        //   // console.log(require('util').inspect(info))
        //   // console.log(require('util').inspect(info[Symbol.for('splat')]))

        //   return `${info.timestamp.slice(10)} ${info.level}${info.message}`
        // })
        // winston.format.prettyPrint()
      )
    })
  ]
})
// if (process.env.NODE_ENV !== 'production') {
//   logger.add(new winston.transports.Console({
//     format: winston.format.simple()
//   }))
// }

// http://tostring.it/2014/06/23/advanced-logging-with-nodejs/
// const morganStream = {
//   write: function (message /*, encoding */) {
//     // trim to remove new line
//     // winston.info(message.trim())
//     winston.info(JSON.parse(message))
//   }
// }

// should be function of logger returning (msg)=>{}
// TODO: find a better way than morgan-json, which parse(stringify(tokens))
// morgan.token('host', (req, res) => config.hostname)
// const requestLogger = morgan(json({
//   // 'remote-user': ':remote-user',
//   // 'remote-addr': ':remote-addr',
//   method: ':method',
//   url: ':url',
//   status: ':status',
//   // short: ':method :url :status',
//   length: ':res[content-length]',
//   'response-time': ':response-time',
//   host: ':host'
// }), { // dev has color - we really want structured logging
//   skip: function (req, res) {
//     if (req.url === '/route-to-ignore' && res.statusCode === 200) {
//       return true
//     }
//     return false
//   },
//   stream: morganStream
// })

// should be function of logger returning (msg)=>{}
// function sequelizeLogger (msg) {
//   if (config.logging.sequelize === 'none') {
//     return
//   }
//   winston.log(config.logging.sequelize, msg)
// }

// an object singleton, so we can update mmember dynamically
// { info: can be swapped at runtime  }
exports = module.exports = {
  ...logger // this is the default logger, which can be set post config ???
  // requestLogger: requestLogger
  // sequelizeLogger: sequelizeLogger
}
