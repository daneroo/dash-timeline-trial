// This module manipuates the Javascript Object version of
// DASH MPD manifests

module.exports = {
  summary,
  shiftInPlace,
  scaleInPlace,
  // privete exported for testing
  deltaFromEpochs
}

// roundingMethod used for shifInPlace and scaleInPlace
const roundingMethod = Math.round // Math.floor

// Modifies MPD in place
// - should deduce newEpoch from MPD
// - should set publishTime as well as availabilityTime?
// - should verify that delta never makes any $Time$ negative
// shifting time origin to newEpoch (iso formated timestamp)
// delta is calculated per representation,
//   although the SegmentTemplate may be in the AdaptationSet, (or Period?)
// returns the operations map (per representation)
// Notes for implementation:
function shiftInPlace (mpd, newEpoch = '1970-01-01T00:00:00Z', storeState = (dict) => {}) {
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

function scaleInPlace (mpd, factor = 1, storeState = (dict) => {}) {
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

function summary (mpd) {
  const availabilityStartTime = mpd.MPD['@'].availabilityStartTime
  const availabilityStartTimeMillis = +new Date(availabilityStartTime)
  return {
    availabilityStartTime,
    'AdaptationSet': mpd.MPD.Period.AdaptationSet.map(as => {
      const contentType = as['@'].contentType
      const timescale = as.SegmentTemplate['@'].timescale
      const S = as.SegmentTemplate.SegmentTimeline.S
      const S0 = S.length ? S[0] : S
      const t0 = S0['@'].t
      const stamp = new Date(availabilityStartTimeMillis + t0 / timescale * 1000).toISOString()
      return {
        SegmentTemplateSegmentTimeline: {
          contentType,
          timescale,
          t0,
          stamp
        }
      }
    })
  }
}

//  internal methods

// this should be deduced from the manifest itself...
// oldEpoch, newEpoch are isoFormated strings: e.g. 1970-01-01T00:00:00Z
// returns delta in seconds
function deltaFromEpochs (oldEpoch, newEpoch) {
  const oldEpochMillis = +new Date(oldEpoch)
  const newEpochMillis = +new Date(newEpoch)
  const delta = roundingMethod((newEpochMillis - oldEpochMillis) / 1000)
  return delta
}
