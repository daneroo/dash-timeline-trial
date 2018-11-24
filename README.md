# Timeline-to-timeline experiments

## Notes

```bash
MPD:
  <AdaptationSet contentType="video" maxFrameRate="60/2" maxHeight="360" maxWidth="640" mimeType="video/mp4" minHeight="360" minWidth="640" par="16:9" segmentAlignment="true" startWithSAP="1">
    <Role schemeIdUri="urn:mpeg:dash:role:2011" value="main"></Role>
    <SegmentTemplate initialization="$RepresentationID$/init.mp4" media="$RepresentationID$/t$Time$.m4s" timescale="90000">
      <SegmentTimeline>
        <S d="180000" r="150" t="138866317200000"></S>
      </SegmentTimeline>
    </SegmentTemplate>
    <Representation bandwidth="300000" codecs="avc1.64001e" frameRate="60/2" height="360" id="V300" sar="1:1" width="640"></Representation>
  </AdaptationSet>

Init: http://localhost:8000/livesim-dev/segtimeline_1/testpic_2s/V300/init.mp4
1- http://localhost:8000/livesim-dev/segtimeline_1/testpic_2s/V300/t138866343120000.m4s
2- http://localhost:8000/livesim-dev/segtimeline_1/testpic_2s/V300/t138866343300000.m4s
3- http://localhost:8000/livesim-dev/segtimeline_1/testpic_2s/V300/t138866343480000.m4s

Observed deltas: 25920000, 25920000, 26100000, 26100000, 25920000

26100000-25920000 = 180000 = <S d/> = 2*timescale
```

## Operating

```bash
while true; do time node index.js ; sleep 1; done

http-server --cors

curl http://vm2.dashif.org/livesim-dev/segtimeline_1/testpic_2s/Manifest.mpd
curl http://localhost:8080/manifest.mpd
curl http://localhost:8080/manifest-back.mpd

# with one of the above
open http://reference.dashif.org/dash.js/nightly/samples/dash-if-reference-player/index.html
```

## Parsing/Serializing XML

Using [`fast-xml-parser`](https://www.npmjs.com/package/fast-xml-parser) go go from xml-json-xml

## References

- [Samaneh Timeline-Timeline Wiki](https://irdeto.atlassian.net/wiki/spaces/HEL/pages/1138787235/DASH+Timeline+Manifest+Individualization#DASHTimelineManifestIndividualization-Algorithm%232)
- [Stop Numbering (Blog USP)](https://www.unified-streaming.com/blog/stop-numbering-underappreciated-power-dashs-segmenttimeline)
- Players and streams
  - [Dash.js Reference Client (src)](https://github.com/Dash-Industry-Forum/dash.js)
  - [Dash.js Reference Vectors](https://github.com/Dash-Industry-Forum/dash.js/wiki/Minimum-Test-Vectors-each-PR-should-not-break)
  - [Reference client Dashif.org](http://reference.dashif.org/dash.js/v2.9.2/samples/dash-if-reference-player/index.html)
  - [GPAC Sequences](https://gpac.wp.imt.fr/2012/02/23/dash-sequences/)
  - [Node-gpac-dash](https://github.com/gpac/node-gpac-dash)
  - [GPAC mo4box-service-worker](https://github.com/gpac/mp4box-sw)
