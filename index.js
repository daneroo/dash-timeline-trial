
const fs = require('fs')
const axios = require('axios')
const parser = require('fast-xml-parser')
const { showJSON, shiftInPlace, scaleInPlace, toXML, toJSON } = require('./manifest')

const sources = [
  // from https://github.com/Dash-Industry-Forum/dash.js/wiki/Minimum-Test-Vectors-each-PR-should-not-break
  // LIVE playback
  // 10. SegmentTimeline
  'http://vm2.dashif.org/livesim-dev/segtimeline_1/testpic_2s/Manifest.mpd',
  // 11. Multi-period segmentTemplate ($Number)
  'http://vm2.dashif.org/livesim/periods_30/testpic_2s/Manifest.mpd'
]

const segmentTimelineURL = sources[0]

main()

async function main () {
  const resp = await axios.get(segmentTimelineURL)
  const { data } = resp
  // check for status
  const xmlData = data
  // console.log(xmlData)
  fs.writeFileSync('manifest.mpd', xmlData)

  // to  JSON
  const xmlOK = parser.validate(xmlData)
  if (xmlOK !== true) { // optional (it'll return an object in case it's not valid)
    console.log('failed to parse xml')
    process.exit(1)
  }
  const jsonObj = toJSON(xmlData)
  fs.writeFileSync('manifest.json', JSON.stringify(jsonObj, null, 2))

  showJSON(jsonObj)
  shiftInPlace(jsonObj)
  scaleInPlace(jsonObj)
  showJSON(jsonObj)

  //  Back to xml
  const xml = toXML(jsonObj)
  // console.log(xml)
  fs.writeFileSync('manifest-back.mpd', xml)

  console.log('Done converting')
}
