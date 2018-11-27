
//  This is a clone of the winston simple format to understand

const simple = require('./simple')
// const { MESSAGE } = require('triple-beam')
const MESSAGE = Symbol.for('message')

function invoke (fmt, input) {
  return fmt.transform({ ...input }, fmt.options)
}

describe('simple', () => {
  test('simple() (default) sets info[MESSAGE]', () => {
    const info = invoke(
      simple(),
      { level: 'info', message: 'whatever' }
    )
    expect(info.level).toEqual('info')
    expect(info.message).toEqual('whatever')
    expect(info[MESSAGE]).toEqual('info: whatever')
  })

  test('simple() strips { splat }', () => {
    const info = invoke(
      simple(),
      { level: 'info', message: 'whatever', splat: [1, 2, 3] }
    )
    expect(Array.isArray(info.splat)).toBe(true)
    expect(info.level).toEqual('info')
    expect(info.message).toEqual('whatever')
    expect(info.splat).toEqual([1, 2, 3])

    expect(info[MESSAGE]).toEqual('info: whatever')
  })

  test('simple() shows { rest }', () => {
    const info = invoke(
      simple(),
      { level: 'info', message: 'whatever', rest: 'something' }
    )
    expect(info.level).toEqual('info')
    expect(info.message).toEqual('whatever')
    expect(info.rest).toEqual('something')

    expect(info[MESSAGE]).toEqual('info: whatever {"rest":"something"}')
  })

  expect(process.env.NODE_ENV).toEqual('test')
})
