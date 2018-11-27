
//  This is a clone of the winston simple format to understand
const { format } = require('winston')

// const { MESSAGE } = require('triple-beam')
const MESSAGE = Symbol.for('message')

const jsonStringify = require('fast-safe-stringify')

module.exports = format((info, opts) => {
  const stringifiedRest = jsonStringify(Object.assign({}, info, {
    level: undefined,
    message: undefined,
    splat: undefined
  }))

  const padding = (info.padding && info.padding[info.level]) || ''
  if (stringifiedRest !== '{}') {
    info[MESSAGE] = `${info.level}:${padding} ${info.message} ${stringifiedRest}`
  } else {
    info[MESSAGE] = `${info.level}:${padding} ${info.message}`
  }

  return info
})
