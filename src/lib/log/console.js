
//  This is a logform formatter customized for my console output

const jsonStringify = require('fast-safe-stringify')
const { format } = require('winston')

const MESSAGE = Symbol.for('message')
const SPLAT = Symbol.for('splat')

// info.timestamp = T02:32:34.857Z
const shortstamp = format((info, opts) => {
  if (!info.timestamp) {
    info.timestamp = new Date().toISOString().slice(10) // T02:32:34.857Z
  }
  return info
})

// padded: indicates padLevels is used (and already has extra space before message)
const flat = format((info, opts) => {
  const { padded, pretty } = opts
  let { level, message, timestamp } = info
  const rest = info[SPLAT]

  // console.dir(info, '\n')
  timestamp = (timestamp) ? timestamp + ' ' : ''

  if (pretty) {
    if (typeof message === 'object') {
      // console.log('-', jsonStringify(message))
      message = JSON.stringify(message) // prettify(message)
      // console.log('+', jsonStringify(message))
    }
  }

  if (!padded) {
    message = ' ' + message
  }
  // console.log('++', jsonStringify(message))

  let stringifiedRest = (rest === undefined) ? '' : ' ' + jsonStringify(rest)

  info[MESSAGE] = `${timestamp}${level}${message}${stringifiedRest}`

  return info
})

// gets applied to all objects message and ...rest
// if error: convert errors to useful string
// if object: remove top level {}, and []
function prettify (o) {
  console.log('pretty type:', typeof o)

  if (o instanceof Error) return o.toString()
  if (typeof message === 'object') {
    return jsonStringify(o)
  }
  return o
}
module.exports = {
  flat,
  shortstamp,
  prettify
}
