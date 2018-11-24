const axios = require('axios')
const parser = require('fast-xml-parser')

module.exports = {
  fetchXml
}

async function fetchXml (url) {
  const start = +new Date()
  const resp = await axios.get(url)

  const { data } = resp
  // check for status and throw?
  const xmlData = data

  // validate XML
  const xmlOK = parser.validate(xmlData)
  if (xmlOK !== true) { // optional (it'll return an object in case it's not valid)
    console.error(xmlOK)
    throw new Error(`failed to parse xml: ${url}`)
  }
  console.log(`${new Date().toISOString()} fetched: ${url} elapsed:${+new Date() - start}ms`)
  return data
}
