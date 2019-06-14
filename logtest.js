const { log } = require('./src/lib')

const combos = [
  ['hello'],
  ['hello', { a: 1 }],
  [{ a: 1 }],
  ['hello', 'str1', 'str2'],
  ['hello %s', 'str1', 'str2'],
  ['hello', 'str1', { arg: 2 }],
  ['hello', { arg: 11 }, { arg: 22 }, { arg: 3, deeper: { than: 'others' } }],
  // [{ arg: 11 }, { arg: 22 }, { arg: 3, deeper: { than: 'others' } }], // Broken
  [new Error('BAD!'), { arg: 2 }]
  // ['hello', new Error('BAD!'), { arg: 3 }] // Broken
]
combos.forEach(c => {
  // log.debug(...c)
  // console.log(`\ninput:${JSON.stringify(c)}`)
  log.verbose(...c)
  log.info(...c)
  // log.warn(...c)
  // log.error(...c)
})
