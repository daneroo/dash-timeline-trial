const fs = require('fs')
const path = require('path')
const { shiftInPlace, scaleInPlace, summary, deltaFromEpochs } = require('./mpd')
const { toJSON } = require('./format')

// function shiftInPlace (mpd, newEpoch = '1970-01-01T00:00:00Z', storeState = (dict) => {}) {
// function scaleInPlace (mpd, factor = 1, storeState = (dict) => {}) {

describe('mpd', () => {
// TODO(daneroo): Add immutability test by moving input assertion after shift invocation
  test('Can shift a timeline with default args', async () => {
    const expectedEpoch = '1970-01-01T00:00:00Z'
    const mpd = getTimeline()

    // confirm input values
    const oldEpoch = mpd.MPD['@'].availabilityStartTime
    expect(oldEpoch).toEqual('1970-01-01T00:00:00Z')

    // orig audio <S />
    const origAudioS = expect.arrayContaining([{ '@': { 'd': 96256, 't': 74065118400512 } }])
    expect(mpd.MPD.Period.AdaptationSet[0].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origAudioS)

    // orig video <S />
    const origVideoS = { '@': { 'd': 180000, 'r': 150, 't': 138872097000000 } }
    expect(mpd.MPD.Period.AdaptationSet[1].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origVideoS)

    const shifted = shiftInPlace(mpd)

    expect(shifted.MPD['@'].availabilityStartTime).toEqual(expectedEpoch)

    // shifted audio <S />
    expect(shifted.MPD.Period.AdaptationSet[0].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origAudioS)

    // shifted video <S />
    expect(shifted.MPD.Period.AdaptationSet[1].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origVideoS)
  })
  test('Can shift a timeline', async () => {
    const newEpoch = '2018-11-23T00:00:00Z'
    const mpd = getTimeline()

    // confirm input values
    const oldEpoch = mpd.MPD['@'].availabilityStartTime
    expect(oldEpoch).toEqual('1970-01-01T00:00:00Z')

    // orig audio <S />
    const origAudioS = expect.arrayContaining([{ '@': { 'd': 96256, 't': 74065118400512 } }])
    expect(mpd.MPD.Period.AdaptationSet[0].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origAudioS)

    // orig video <S />
    const origVideoS = { '@': { 'd': 180000, 'r': 150, 't': 138872097000000 } }
    expect(mpd.MPD.Period.AdaptationSet[1].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origVideoS)

    const shifted = shiftInPlace(mpd, newEpoch, (dict) => {})

    expect(shifted.MPD['@'].availabilityStartTime).toEqual(newEpoch)

    // shifted audio <S />
    const shiftedAudioS = expect.arrayContaining([{ '@': { 'd': 96256, 't': 4420800512 } }])
    expect(shifted.MPD.Period.AdaptationSet[0].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(shiftedAudioS)

    // shifted video <S />
    const shiftedVideoS = { '@': { 'd': 180000, 'r': 150, 't': 8289000000 } }
    expect(shifted.MPD.Period.AdaptationSet[1].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(shiftedVideoS)
  })

  test('Can scale a timeline with default args', async () => {
    const mpd = getTimeline()

    // confirm input values
    const oldEpoch = mpd.MPD['@'].availabilityStartTime
    expect(oldEpoch).toEqual('1970-01-01T00:00:00Z')

    // orig audio <S />
    const origAudioS = expect.arrayContaining([{ '@': { 'd': 96256, 't': 74065118400512 } }])
    expect(mpd.MPD.Period.AdaptationSet[0].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origAudioS)

    // orig video <S />
    const origVideoS = { '@': { 'd': 180000, 'r': 150, 't': 138872097000000 } }
    expect(mpd.MPD.Period.AdaptationSet[1].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origVideoS)

    const scaled = scaleInPlace(mpd)

    // scaled audio <S />
    expect(scaled.MPD.Period.AdaptationSet[0].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origAudioS)

    // scaled video <S />
    expect(scaled.MPD.Period.AdaptationSet[1].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origVideoS)
  })

  test('Can scale a timeline', async () => {
    const mpd = getTimeline()

    // confirm input values
    const oldEpoch = mpd.MPD['@'].availabilityStartTime
    expect(oldEpoch).toEqual('1970-01-01T00:00:00Z')

    // orig audio <S />
    const origAudioS = expect.arrayContaining([{ '@': { 'd': 96256, 't': 74065118400512 } }])
    expect(mpd.MPD.Period.AdaptationSet[0].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origAudioS)

    // orig video <S />
    const origVideoS = { '@': { 'd': 180000, 'r': 150, 't': 138872097000000 } }
    expect(mpd.MPD.Period.AdaptationSet[1].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(origVideoS)

    const scaled = scaleInPlace(mpd, 1000, (dict) => {})

    // scaled audio <S />
    const scaledAudioS = expect.arrayContaining([{ '@': { 'd': 96, 't': 74065118401 } }])
    expect(scaled.MPD.Period.AdaptationSet[0].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(scaledAudioS)

    // scaled video <S />
    const scaledVideoS = { '@': { 'd': 180, 'r': 150, 't': 138872097000 } }
    expect(scaled.MPD.Period.AdaptationSet[1].SegmentTemplate.SegmentTimeline.S)
      .toMatchObject(scaledVideoS)
  })

  test('Can summarize a manifest', async () => {
    expect(summary(getMPD())).toEqual({
      availabilityStartTime: '1970-01-01T00:00:00Z',
      AdaptationSet: [ {
        SegmentTemplateSegmentTimeline: {
          contentType: 'audio',
          stamp: '2018-11-24T01:35:00.010Z',
          t0: 74065118400512,
          timescale: 48000
        }
      }, {
        SegmentTemplateSegmentTimeline: {
          contentType: 'video',
          stamp: '2018-11-24T01:35:00.000Z',
          t0: 138872097000000,
          timescale: 90000
        }
      } ]
    })
  })

  // Cancalculate delta from epochs
  test.each([
    ['1970-01-01T00:00:00Z', '1970-01-01T00:00:00Z', 0],
    ['2018-11-23T00:00:00Z', '2018-11-23T00:00:00Z', 0],
    ['2018-11-22T00:00:00Z', '2018-11-23T00:00:00Z', 86400],
    ['1970-01-01T00:00:00Z', '2018-11-23T00:00:00Z', 1542931200],
    ['2018-11-23T00:00:00Z', '1970-01-01T00:00:00Z', -1542931200]
  ])('Calculate delta from epochs (%s, %s)',
    (oldEpoch, newEpoch, expected) => {
      expect(deltaFromEpochs(oldEpoch, newEpoch)).toBe(expected)
    }
  )
})

// Helpers Below

function getMPD () {
  const xml = readFile('manifest.mpd')
  return toJSON(xml)
}
function getTimeline () {
  return toJSON(`<?xml version="1.0" encoding="utf-8"?>
<MPD availabilityStartTime="1970-01-01T00:00:00Z" >
  <BaseURL>http://vm2.dashif.org/livesim-dev/segtimeline_1/testpic_2s/</BaseURL>
  <Period id="p0" start="PT0S">
    <AdaptationSet contentType="audio" lang="eng" mimeType="audio/mp4" segmentAlignment="true" startWithSAP="1">
      <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main"></Role>
      <SegmentTemplate initialization="$RepresentationID$/init.mp4" media="$RepresentationID$/t$Time$.m4s" timescale="48000">
        <SegmentTimeline>
          <S d="96256" t="74065118400512"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
          <S d="96256" r="2"></S>
          <S d="95232"></S>
        </SegmentTimeline>
      </SegmentTemplate>
      <Representation audioSamplingRate="48000" bandwidth="48000" codecs="mp4a.40.2" id="A48">
        <AudioChannelConfiguration schemeIdUri="urn:mpeg:dash:23003:3:audio_channel_configuration:2011" value="2"></AudioChannelConfiguration>
      </Representation>
    </AdaptationSet>
    <AdaptationSet contentType="video" maxFrameRate="60/2" maxHeight="360" maxWidth="640" mimeType="video/mp4" minHeight="360" minWidth="640" par="16:9" segmentAlignment="true" startWithSAP="1">
      <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main"></Role>
      <SegmentTemplate initialization="$RepresentationID$/init.mp4" media="$RepresentationID$/t$Time$.m4s" timescale="90000">
        <SegmentTimeline>
          <S d="180000" r="150" t="138872097000000"></S>
        </SegmentTimeline>
      </SegmentTemplate>
      <Representation bandwidth="300000" codecs="avc1.64001e" frameRate="60/2" height="360" id="V300" sar="1:1" width="640"></Representation>
    </AdaptationSet>
  </Period>
</MPD>`)
}
function readFile (fileName) {
  const dataDirectory = './data'
  return fs.readFileSync(path.join(dataDirectory, fileName), 'utf8')
}
