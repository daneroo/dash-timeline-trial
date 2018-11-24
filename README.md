# Timeline-to-timeline experiments

## TODO

- Replace logging, and turn off in tests

## Operating

```bash
npm start

npm test
npm test -- --watch

npm run coverage
npm run coverage -- --watch


# Open this reference client
open http://reference.dashif.org/dash.js/nightly/samples/dash-if-reference-player/index.html
# and use one of these:
curl http://vm2.dashif.org/livesim-dev/segtimeline_1/testpic_2s/Manifest.mpd
curl http://localhost:8000/livesim-dev/segtimeline_1/testpic_2s/Manifest.mpd
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
