
//  This is a clone of the winston simple format to understand

describe.only('sanity checks', () => {
  test('NODE_ENV == test', () => {
    expect(process.env.NODE_ENV).toEqual('test')
  })
})
