
//  This is a clone of the winston flat format to understand

const { flat, shortstamp } = require('./console')
const winston = require('winston')
const stream = require('stream')
const os = require('os')

const MESSAGE = Symbol.for('message')

describe('integration', () => {
  describe('transport', () => {
    test('stream', done => {
      const input = { [MESSAGE]: 'info hey' }
      const expected = 'info hey'

      const write = writeOneLineAndExpect(expected, done)

      const stream = writeable(write)
      const transport = new winston.transports.Stream({ stream })

      transport.log(input)
    })
  })
  describe('logger', () => {
    test('stream transport', done => {
      const input = ['info', 'hey']
      const expected = 'info hey'

      const write = writeOneLineAndExpect(expected, done)
      const format = flat()
      const logger = createLogger(write, format)

      logger.log(...input)
    })
  })

  describe('levels', () => {
    test.each([
    // [level],
      ['debug'],
      ['verbose'],
      ['info'],
      ['warn'],
      ['error']
    ])('level %s', (level, done) => {
      const input = [level, 'hey']
      const expected = `${level} hey`

      const write = writeOneLineAndExpect(expected, done)
      const format = flat()
      const logger = createLogger(write, format)

      logger.log(...input)
    })
  })

  describe('flat-options', () => {
    test.each([
      // [opts,expected],
      [{}, ['hey'], 'info hey'],
      [{}, ['  hey'], 'info   hey'],
      [{ padded: true }, [' hey'], 'info hey'],
      [{ pretty: true }, ['hey'], 'info hey'],
      [{ padded: true, pretty: true }, [' hey'], 'info hey']
    ])(`options %p %p`, (options, input, expected, done) => {
      const write = writeOneLineAndExpect(expected, done)
      const format = flat(options)
      const logger = createLogger(write, format)

      logger.info(...input)
    })
  })

  // winston.format.colorize(),
  // winston.format.padLevels(), // must be after our flat for prettyness
  // winston.format.timestamp(),
  // winston.format.timestamp({ format: 'THH:mm:ss.SZZ' }), // but this is LocalTime
  // require('./console').shortstamp(), // short and UTC

  describe('combined with pad', () => {
    const { combine, padLevels } = winston.format
    test.each([
      // [opts,expected],
      ['flat()-info', flat(), ['info', 'hey'], 'info hey'],
      ['flat()-debug', flat(), ['debug', 'hey'], 'debug hey'],
      ['padded-flat()-info   ', combine(padLevels(), flat()), ['info', 'hey'], 'info     hey'],
      ['padded-flat()-debug  ', combine(padLevels(), flat()), ['debug', 'hey'], 'debug    hey'],
      ['padded-flat()-verbose', combine(padLevels(), flat()), ['verbose', 'hey'], 'verbose  hey'],
      ['padded-flat(pad)-info   ', combine(padLevels(), flat({ padded: true })), ['info', 'hey'], 'info    hey'],
      ['padded-flat(pad)-debug  ', combine(padLevels(), flat({ padded: true })), ['debug', 'hey'], 'debug   hey'],
      ['padded-flat(pad)-verbose', combine(padLevels(), flat({ padded: true })), ['verbose', 'hey'], 'verbose hey']
    ])(`%p`, (name, format, input, expected, done) => {
      const write = writeOneLineAndExpect(expected, done)
      const logger = createLogger(write, format)
      logger.log(...input)
    })
  })
  describe('combined color/pad', () => {
    const { combine, padLevels, colorize } = winston.format
    test.each([
      ['info hey   ', combine(colorize(), padLevels(), flat()), ['info', 'hey'], '\u001b[32minfo\u001b[39m     hey'],
      ['verbose hey', combine(colorize(), padLevels(), flat()), ['verbose', 'hey'], '\u001b[36mverbose\u001b[39m  hey'],
      ['info hey   ', combine(colorize(), padLevels(), flat({ padded: true })), ['info', 'hey'], '\u001b[32minfo\u001b[39m    hey'],
      ['verbose hey', combine(colorize(), padLevels(), flat({ padded: true })), ['verbose', 'hey'], '\u001b[36mverbose\u001b[39m hey']
    ])(`%p`, (name, format, input, expected, done) => {
      const write = writeOneLineAndExpect(expected, done)
      const logger = createLogger(write, format)
      logger.log(...input)
    })
  })
  describe('combined with timestamps', () => {
    const { combine, timestamp } = winston.format
    test.each([
      ['no timestamp', combine(flat()), ['info', 'hey'], 'info hey'],
      ['with timestamp', combine(timestamp(), flat()), ['info', 'hey'], expect.stringMatching(/^\d\d\d\d-\d\d-\d\dT\d\d:\d\d:\d\d\.\d\d\dZ info hey/)],
      ['with shortstamp', combine(shortstamp(), flat()), ['info', 'hey'], expect.stringMatching(/^T\d\d:\d\d:\d\d\.\d\d\dZ info hey/)]
    ])(`%p`, (name, format, input, expected, done) => {
      const write = writeOneLineAndExpect(expected, done)
      const logger = createLogger(write, format)
      logger.log(...input)
    })
  })
})

// helpers
// writeOneLineAndExpect is a writer which will assert the line content and call the done callback
function writeOneLineAndExpect (expected, done) {
  return function (raw) {
    // console.dir(JSON.stringify(raw.toString()))
    // in case we use a matcher
    if (typeof expected !== 'string') {
      expect(raw.toString()).toEqual(expected)
    } else {
      expect(raw.toString()).toEqual(`${expected}${os.EOL}`)
    }
    done()
  }
}
// took/modified these from winston test helpers
function createLogger (write, format, level = 'debug') {
  return winston.createLogger({
    level,
    format,
    transports: [
      new winston.transports.Stream({ stream: writeable(write) })
    ]
  })
}

function writeable (write) {
  return new stream.Writable({ write })
}
