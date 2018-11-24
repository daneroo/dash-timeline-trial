
const fs = require('fs')
const path = require('path')
const { fetchXml } = require('./io')
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

const factor = 1000
const newEpoch = '2018-11-23T00:00:00Z'
// const newEpoch = '1970-01-01T00:00:00Z'

async function main () {
  try {
    const xmlData = await fetchXml(segmentTimelineURL)
    writeFile('manifest.mpd', xmlData)

    const jsonObj = toJSON(xmlData)
    writeFile('manifest.json', JSON.stringify(jsonObj, null, 2))

    showJSON(jsonObj)
    shiftInPlace(jsonObj, newEpoch)
    scaleInPlace(jsonObj, factor)
    showJSON(jsonObj)

    //  Back to xml
    const xml = toXML(jsonObj)
    // console.log(xml)
    writeFile('manifest-back.mpd', xml)

    console.log('Done converting')
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

function writeFile (fileName, data) {
  const dataDirectory = './data'
  fs.writeFileSync(path.join(dataDirectory, fileName), data)
}
