const { fetchXml } = require('./io')

// Gist: https://gist.github.com/daneroo/a76a9e89432bb62da68d386d312c3953
const gistBase = 'https://gist.githubusercontent.com/daneroo/a76a9e89432bb62da68d386d312c3953/raw/705265126caf704d2b40db061c314df95bc84581'

describe.skip('io', () => {
  test('Can Fetch a valid xml document', async () => {
    const gist = `${gistBase}/valid.xml`
    // const xml =
    expect(await fetchXml(gist)).toEqual(`<?xml version="1.0" encoding="utf-8"?>
<MPD> 
  <ProgramInformation>
      <Title>This Document is valid XML</Title>
  </ProgramInformation>
</MPD>`)
  })

  test('Can Fetch an invalid xml document', async () => {
    const gist = `${gistBase}/invalid.xml`
    try {
      await fetchXml(gist)
    } catch (error) {
      expect(error.message).toEqual(`failed to parse xml: ${gist}`)
    }
  })
})
