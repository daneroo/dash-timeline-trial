
const { log } = require('./lib')
const { toXML, toJSON } = require('./format')
const { shiftInPlace, scaleInPlace } = require('./mpd')
// TODO: remove in-place oprations
// const deepCopy = require('deep-copy')
// const copy = deepCopy({ a: { b: [{ c: 5 }] } })

module.exports = {
  rewriteSegment,
  transformXML,
  transform,
  // remove below from exports
  shiftInPlace,
  scaleInPlace,
  toXML,
  toJSON
}

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
    log.debug('stateStore:', state)
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

// Should be derived from SegmentTemplate@media
// /livesim-dev/segtimeline_1/testpic_2s/A48/t74061814368256.m4s
const regex = /^(.*)\/(.*)\/t(\d+)\.m4s$/
function rewriteSegment (url) {
  const match = regex.exec(url)
  if (match && match.length === 4) {
    const base = match[1]
    const repId = match[2]
    const time = Number(match[3])

    const { delta, timescale, factor } = getState(repId) || {} // to allow destructuring
    if (!(delta >= 0 && timescale >= 0 && factor >= 0)) {
      log.error(`${new Date().toISOString()} error: cannot decode`, { url, delta, timescale, factor })
      return url
    }

    // inverse order as in transform shift,scale -> inverse scale,shift
    const time1 = (time * factor) + delta * timescale
    if (repId === 'V300') {
      log.info(`rewrite ${time} -> ${time1}`, { bits: bitsGained(time1, time), repId, factor, delta })
      // log.info(`rewrite +${bitsGained(time1, time)}bits (${repId}) ${time} -> ${time1} delta:${delta}s`)
    }
    return `${base}/${repId}/t${time1}.m4s`
  }
  return url
}

function transformXML (mpd, factor = 1, newEpoch = '1970-01-01T00:00:00Z') {
  const start = +new Date()

  const jsonObj = toJSON(mpd)

  // inplace
  transform(jsonObj, factor, newEpoch)

  //  Back to xml
  const xml = toXML(jsonObj)

  // Move this to JSON
  // transform BaseURL
  const xmlRebased = xml.replace('<BaseURL>http://vm2.dashif.org/', '<BaseURL>http://localhost:8000/')

  log.debug('transformedXML', { elapsed: +new Date() - start })
  return xmlRebased
}

function transform (jsonObj, factor = 1, newEpoch = '1970-01-01T00:00:00Z') {
  const start = +new Date()

  shiftInPlace(jsonObj, newEpoch, storeState)
  scaleInPlace(jsonObj, factor, storeState)

  log.debug('transformed', { elapsed: +new Date() - start })
  return jsonObj
}
