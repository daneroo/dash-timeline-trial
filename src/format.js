
const parser = require('fast-xml-parser')

// TODO: remove in-place oprations
// const deepCopy = require('deep-copy')
// const copy = deepCopy({ a: { b: [{ c: 5 }] } })

module.exports = {
  toXML,
  toJSON
}

function toXML (json) {
  var Parser = require('fast-xml-parser').j2xParser
  // default options need not to set
  var defaultOptions = {
    // attributeNamePrefix: '@_',
    attrNodeName: '@', // default is false
    textNodeName: '#text',
    ignoreAttributes: false,
    // cdataTagName: '__cdata', // default is false
    cdataPositionChar: '\\c',
    format: true,
    indentBy: '  '
    // supressEmptyNode: false
    // tagValueProcessor: a => he.encode(a, { useNamedReferences: true }), // default is a=>a
    // attrValueProcessor: a => he.encode(a, { isAttributeValue: isAttribute, useNamedReferences: true })// default is a=>a
  }
  const parser = new Parser(defaultOptions)
  const xml = parser.parse(json)
  const xmldecl = '<?xml version="1.0" encoding="utf-8"?>\n'
  return xmldecl + xml
}

function toJSON (xmlData) {
  var options = {
    attributeNamePrefix: '', // '@_',
    ignoreAttributes: false,
    parseAttributeValue: true,
    ignoreNameSpace: false,
    attrNodeName: '@', // default is 'false'
    textNodeName: '#text',
    // allowBooleanAttributes : false,
    // parseNodeValue : true,
    // parseAttributeValue : false,
    // trimValues: true,
    // cdataTagName: "__cdata", //default is 'false'
    cdataPositionChar: '\\c'
    // localeRange: "", //To support non english character in tag/attribute values.
    // parseTrueNumberOnly: false,
    // attrValueProcessor: a => he.decode(a, {isAttributeValue: true}),//default is a=>a
    // tagValueProcessor : a => he.decode(a) //default is a=>a
  }

  const xmlOK = parser.validate(xmlData, options)
  if (xmlOK !== true) { // optional (it'll return an object in case it's not valid)
    console.error(xmlOK)
    throw new Error('failed to validate xml')
  }
  const jsonObj = parser.parse(xmlData, options)
  return jsonObj
}
