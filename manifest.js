
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

const stateStore = {
  // repId : {timescale, delta, factor}
  // e.g.
  //   "A48":{"delta":1542931200,"factor":1000,"timescale":48000},
  //   "V300":{"delta":1542931200,"factor":1000,"timescale":90000}
}
let lastShown = +new Date()
function storeState (dict) {
  const prevState = JSON.stringify(stateStore)
  for (const k in dict) {
    // console.log(`${new Date().toISOString()} storing ${k}:${JSON.stringify(dict[k])}`)
    if (!stateStore[k]) { stateStore[k] = {} }
    stateStore[k] = { ...stateStore[k], ...dict[k] }
  }
  const state = JSON.stringify(stateStore)
  const elapesdSinceShown = +new Date() - lastShown
  if (state !== prevState || elapesdSinceShown > 5000) {
    console.log(`${new Date().toISOString()} stateStore: ${state}`)
    lastShown = +new Date()
  }
}
function getState (repId) {
  return stateStore[repId]
}

// bits needed for t0 - bits needed for t1
function bitsGained (tOrig, tScaled) {
  return (Math.log(tOrig / tScaled) / Math.log(2)).toFixed(1)
  // return (Math.log(tOrig) / Math.log(2) - Math.log(tScaled) / Math.log(2)).toFixed(1)
}

function rewriteSegment (url) { // , factor = 1, newEpoch = '1970-01-01T00:00:00Z'
  // /livesim-dev/segtimeline_1/testpic_2s/A48/t74061814368256.m4s
  const match = regex.exec(url)
  if (match && match.length === 4) {
    const base = match[1]
    const repId = match[2]
    const time = Number(match[3])

    // should get these from stateStore
    // const oldEpoch = '1970-01-01T00:00:00Z'
    // const delta = deltaFromEpochs(oldEpoch, newEpoch)
    const { delta, timescale, factor } = getState(repId) || {} // to allow destructuring
    if (!(delta && timescale && factor)) {
      console.log(`${new Date().toISOString()} error: cannot decode`, { url, delta, timescale, factor })
      return url
    }

    // inverse order as in transform shift,scale -> inverse scale,shift
    const time1 = (time * factor) + delta * timescale
    console.log(`${new Date().toISOString()} rewrite +${bitsGained(time1, time)}bits (${repId}) ${time} -> ${time1} delta:${delta}s`)
    if (repId === 'V300') {
    }
    return `${base}/${repId}/t${time1}.m4s`
  }
  return url
}

async function transform (url, factor = 1, newEpoch = '1970-01-01T00:00:00Z') {
  // console.log(`${new Date().toISOString()} transforming: ${url}`)
  const start = +new Date()
  const resp = await axios.get(url)
  console.log(`${new Date().toISOString()} fetched: ${url} elapsed:${+new Date() - start}ms`)

  const { data } = resp // {status, statusText, headers, config}

  // TODO check for status: !data || try/catch ?
  const xmlData = data

  // to  JSON
  const xmlOK = parser.validate(xmlData)
  if (xmlOK !== true) { // optional (it'll return an object in case it's not valid)
    console.error(xmlOK)
    console.log('failed to parse xml, returning as is')
    return xmlData
  }
  const jsonObj = toJSON(xmlData)

  shiftInPlace(jsonObj, newEpoch)
  scaleInPlace(jsonObj, factor)

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

// roundingMethod used for shifInPlace and scaleInPlace
const roundingMethod = Math.round // Math.floor

// this should be deduced from the manifest itself...
// oldEpoch, newEpoch are isoFormated strings: e.g. 1970-01-01T00:00:00Z
// returns delta in seconds
function deltaFromEpochs (oldEpoch, newEpoch) {
  const oldEpochMillis = +new Date(oldEpoch)
  const newEpochMillis = +new Date(newEpoch)
  const delta = roundingMethod((newEpochMillis - oldEpochMillis) / 1000)
  return delta
}

// Modifies MPD in place
// - should deduce newEpoch from MPD
// - should set publishTime as well as availabilityTime?
// - should verify that delta never makes any $Time$ negative
// shifting time origin to newEpoch (iso formated timestamp)
// delta is calculated per representation,
//   although the SegmentTemplate may be in the AdaptationSet, (or Period?)
// returns the operations map (per representation)
// Notes for implementation:
function shiftInPlace (mpd, newEpoch = '1970-01-01T00:00:00Z') {
  const oldEpoch = mpd.MPD['@'].availabilityStartTime
  const delta = deltaFromEpochs(oldEpoch, newEpoch)

  mpd.MPD['@'].availabilityStartTime = newEpoch

  //  - assumes SegmentTemplate is in AdaptationSet
  //  - assumes Representaion (only 1) is in AdpatationSet
  mpd.MPD.Period.AdaptationSet.forEach((as, i) => {
    const timescale = as.SegmentTemplate['@'].timescale
    const S = as.SegmentTemplate.SegmentTimeline.S
    // make Ss an array S might be an array or an Object (instead of an array of length 1)
    const Ss = S.length ? S : [S]
    Ss.forEach(S => {
      const t0 = S['@'].t
      if (t0) {
        const t1 = t0 - (delta * timescale)
        // console.log(`${new Date().toISOString()} shift: as[${i}].t ${t0} -> ${t1} delta: ${delta}`)
        S['@'].t = t1
      }
    })
    const repId = as.Representation['@'].id
    storeState({ [repId]: { delta } })
  })

  return mpd
}

function scaleInPlace (mpd, factor = 1) {
  //  - assumes SegmentTemplate is in AdaptationSet
  //  - assumes Representaion (only 1) is in AdpatationSet
  mpd.MPD.Period.AdaptationSet.forEach(as => {
    const timescale = as.SegmentTemplate['@'].timescale
    as.SegmentTemplate['@'].timescale = timescale / factor
    const S = as.SegmentTemplate.SegmentTimeline.S
    // make Ss an array S might be an array or an Object (instead of an array of length 1)
    const Ss = S.length ? S : [S]
    Ss.forEach(S => {
      const { t, d } = S['@']
      if (t) {
        const t1 = roundingMethod(t / factor)
        // console.log(`${new Date().toISOString()} scale::t ${t} -> ${t1}`)
        S['@'].t = t1
      }
      if (d) {
        const d1 = roundingMethod(d / factor)
        S['@'].d = d1
      }
    })
    const repId = as.Representation['@'].id
    storeState({ [repId]: { factor, timescale } })
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
