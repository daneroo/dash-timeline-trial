const fs = require('fs')
const path = require('path')

const { toJSON, toXML } = require('./format')

describe('format', () => {
  test('Convert an XML to JSON', async () => {
    const xml = readFile('manifest.mpd')
    const json = toJSON(xml)
    const expected = JSON.parse(readFile('manifest.json'))
    expect(json).toEqual(expected)
  })

  test('Convert an invalid XML to JSON and throw', async () => {
    const xml = `<?xml version="1.0" encoding="utf-8"?>
  <BadlyFormedXMLWithNoCLoseTag>`
    try {
      toJSON(xml)
    } catch (error) {
      expect(error.message).toEqual(`failed to validate xml`)
    }
  })

  test('Convert a JSON to XML', async () => {
    const json = JSON.parse(readFile('manifest.json'))
    const xml = toXML(json)
    // writeFile('manifest-to-json-and-back.mpd', xml)
    const expected = readFile('manifest-to-json-and-back.mpd')
    expect(xml).toEqual(expected)
  })
})

// Helpers Below

function readFile (fileName) {
  const dataDirectory = './data'
  return fs.readFileSync(path.join(dataDirectory, fileName), 'utf8')
}

// function writeFile (fileName, data) {
//   const dataDirectory = './data'
//   fs.writeFileSync(path.join(dataDirectory, fileName), data)
// }
