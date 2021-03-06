const http = require('http')
const httpProxy = require('http-proxy')
const express = require('express')
const cors = require('cors')

const { log } = require('./lib')
const { fetchXml } = require('./io')
const { transformXML, rewriteSegment } = require('./manifest')

const PORT = Number(process.env.PORT) || 8000
const TARGET = process.env.TARGET || 'http://vm2.dashif.org'

module.exports = {
  start
}

const factor = 1000
// const ago = 24 * 60 * 60 * 1000 // milliseconds ago
// const newEpoch = new Date(+new Date() - ago).toISOString().substring(0, 19) + 'Z'
const newEpoch = '2018-11-23T00:00:00Z'
// const newEpoch = '1970-01-01T00:00:00Z'

if (require.main === module) {
  start() // node.express
}

// keepAlive:true got us a 10x in throughput
function makeProxy () {
  var keepAliveAgent = new http.Agent({ keepAlive: true })
  return httpProxy.createProxyServer({ agent: keepAliveAgent })
}

function start () {
  const app = express()
  app.use(cors())
  // app.use(logger.requestLogger)

  app.get(/.*\.mpd$/, async function (req, res, next) {
    try {
      const mpdIn = await fetchXml(`${TARGET}${req.url}`)
      const mpdOut = transformXML(mpdIn, factor, newEpoch)
      res.set('Content-Type', 'application/dash+xml')
      res.send(mpdOut)
    } catch (error) {
      log.error('GET manifest', error)
      // don't leak the $TARGET in error message to client
      res.status(500).send(`Unable to fetch manifest: ${req.url}`)
    }
  })

  const proxy = makeProxy()

  // Examine (passive) response from target
  proxy.on('proxyRes', function (proxyRes, req, res) {
    // log.debug('Response headers from the target', JSON.stringify(proxyRes.headers, true, 2))
    const { statusCode } = proxyRes
    const { url } = req
    if (statusCode !== 200) {
      // log.debug('Response keys from the target', Object.keys(proxyRes))
      log.error('Response status!=200 from the target', { statusCode, url })
    } else if (url.includes('V300') && !url.includes('V300/init.mp4')) {
      // const last2 = url.split('/').slice(-2).join('/')
      // log.debug('Response status OK from the target', { url: last2 })
    }
  })

  app.use(bindHandler(proxy))
  app.listen(PORT, () => console.log(`DashTimeline Proxy server running on port: ${PORT} target:${TARGET}`))
}

function bindHandler (proxy) {
  const reportEveryN = 1
  let counter = 0
  return function (req, res) {
    if (counter % reportEveryN === 0) {
      // log.info(`${new Date().toISOString()} proxy: ${req.url} count: ${counter}`)
    }
    // Can be scaled here, or in proxy.on('proxyReq'), by setting proxyReq.path
    req.url = rewriteSegment(req.url)
    proxy.web(req, res, { target: TARGET })
    counter++
  }
}
