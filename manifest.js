
const axios = require('axios')
const parser = require('fast-xml-parser')

module.exports = {
  rewriteSegment,
  transform,
  showJSON,
  shiftInPlace,
  scaleInPlace,
  toXML,
  toJSON
}

// Should be derived from SegmentTemplate@media
// /livesim-dev/segtimeline_1/testpic_2s/A48/t74061814368256.m4s
const regex = /^(.*)\/(.*)\/t(\d+)\.m4s$/

function rewriteSegment (url, factor = 1) {
  // /livesim-dev/segtimeline_1/testpic_2s/A48/t74061814368256.m4s
  const match = regex.exec(url)
  if (match && match.length === 4) {
    const base = match[1]
    const repId = match[2]
    const time = Number(match[3])
    if (repId === 'V300') {
      console.log(`${new Date().toISOString()} rewrite (${repId}) ${time} -> ${time * factor}`)
    }
    return `${base}/${repId}/t${time * factor}.m4s`
  }
  return url
}

async function transform (url, factor = 1) {
  // console.log(`${new Date().toISOString()} transforming: ${url}`)
  const start = +new Date()
  const resp = await axios.get(url)
  const { data } = resp // {status, statusText, headers, config}
  // check for status
  const xmlData = data

  // to  JSON
  const xmlOK = parser.validate(xmlData)
  if (xmlOK !== true) { // optional (it'll return an object in case it's not valid)
    console.error(xmlOK)
    console.log('failed to parse xml, returning as is')
    return xmlData
  }
  const jsonObj = toJSON(xmlData)

  // showJSON(jsonObj)
  // shiftInPlace(jsonObj)
  scaleInPlace(jsonObj, factor)
  // showJSON(jsonObj)

  //  Back to xml
  const xml = toXML(jsonObj)

  // transform BaseURL
  const xmlRebased = xml.replace('<BaseURL>http://vm2.dashif.org/', '<BaseURL>http://localhost:8000/')

  console.log(`${new Date().toISOString()} transformed: ${url} elapsed:${+new Date() - start}ms`)
  return xmlRebased
}

function showJSON (mpd) {
  const availabilityStartTime = mpd.MPD['@'].availabilityStartTime
  const availabilityStartTimeMillis = +new Date(availabilityStartTime)
  console.log({
    availabilityStartTime,
    'as': mpd.MPD.Period.AdaptationSet.map(as => {
      const contentType = as['@'].contentType
      const timescale = as.SegmentTemplate['@'].timescale
      const S = as.SegmentTemplate.SegmentTimeline.S
      const S0 = S.length ? S[0] : S
      const t0 = S0['@'].t
      const stamp = new Date(availabilityStartTimeMillis + t0 / timescale * 1000).toISOString()
      return {
        contentType,
        timescale,
        t0,
        stamp
      }
    })
  })
}

function shiftInPlace (mpd, newEpoch = '1970-01-01T00:00:00Z') {
  const oldEpoch = mpd.MPD['@'].availabilityStartTime
  mpd.MPD['@'].availabilityStartTime = newEpoch
  const oldEpochMillis = +new Date(oldEpoch)
  const newEpochMillis = +new Date(newEpoch)
  const deltaMillis = newEpochMillis - oldEpochMillis

  mpd.MPD.Period.AdaptationSet.forEach((as, i) => {
    const timescale = as.SegmentTemplate['@'].timescale
    const S = as.SegmentTemplate.SegmentTimeline.S
    const S0 = S.length ? S[0] : S
    const t0 = S0['@'].t
    const stamp0 = new Date(oldEpochMillis + t0 / timescale * 1000).toISOString()
    const t1 = t0 - (deltaMillis / 1000 * timescale)
    const stamp1 = new Date(newEpochMillis + t1 / timescale * 1000).toISOString()
    console.log(`${new Date().toISOString()} shift: as[${i}] ${JSON.stringify({ deltaMillis, stamp0, stamp1 })}`)
    S0['@'].t = t1
  })

  return mpd
}

const roundingMethod = Math.round // Math.floor

function scaleInPlace (mpd, factor = 1) {
  mpd.MPD.Period.AdaptationSet.forEach(as => {
    const timescale = as.SegmentTemplate['@'].timescale
    as.SegmentTemplate['@'].timescale = timescale / factor
    const S = as.SegmentTemplate.SegmentTimeline.S
    // make Ss an array S might be an array or an Object (instead of an array of length1)
    const Ss = S.length ? S : [S]
    Ss.forEach(S => {
      const { t, d } = S['@']
      if (t) {
        const t1 = roundingMethod(t / factor)
        console.log(`${new Date().toISOString()} scale::t ${t} -> ${t1}`)
        S['@'].t = t1
      }
      if (d) {
        const d1 = roundingMethod(d / factor)
        S['@'].d = d1
      }
    })
  })

  return mpd
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
    console.log('failed to parse xml')
    process.exit(1)
  }
  const jsonObj = parser.parse(xmlData, options)
  return jsonObj
}
