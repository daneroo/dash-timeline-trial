const axios = require('axios')
const parser = require('fast-xml-parser')

module.exports = {
  fetchXml
}

async function fetchXml (url) {
  const resp = await axios.get(url)
  const { data } = resp
  // check for status and throw?
  const xmlData = data

  // to  JSON
  const xmlOK = parser.validate(xmlData)
  if (xmlOK !== true) { // optional (it'll return an object in case it's not valid)
    throw new Error(`failed to parse xml: ${url}`)
  }
  return data
}
