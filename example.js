#!/usr/bin/env node

const http = require('http')
const ProgressImg = require('.')

var progress = new ProgressImg({ textTop: 'Downloading file...', frameThrottle: '500ms' })

var req = http.request({
  host: 'ipv4.download.thinkbroadband.com',
  path: '/50MB.zip', // Available options: 1GB, 512MB, 200MB, 100MB, 50MB, 20MB, 10MB, 5MB
  port: 80
})

req.on('response', res => {
  var total = parseInt(res.headers['content-length'], 10)
  var loaded = 0

  res.on('data', chunk => {
    loaded += chunk.length
    var percent = Math.round((loaded / total) * 100) + '%'

    progress.set(percent, { textBottom: percent + ' downloaded so far' })
  })

  res.on('end', () => {
    progress.clear().done()
    console.log('Download complete :)')
  })
})

req.end()
