'use strict'

const ansiEscapes = require('ansi-escapes')
const asciify = require('asciify-image')
const Buffer = require('safe-buffer').Buffer
const deasync = require('deasync')
const fs = require('fs')
const gifFrames = require('gif-frames')
const imageType = require('image-type')
const isEqual = require('lodash.isequal')
const iterm2Version = require('iterm2-version')
const logUpdate = require('log-update')
const parseDataUri = require('parse-data-uri')
const path = require('path')
const toArray = require('stream-to-array')
const request = require('request')

const asciifySync = deasync(asciify)
const gifFramesSync = deasync(gifFrames)
const toArraySync = deasync(toArray)
const requestSync = deasync(request)

const defaults = {
  image: path.join(__dirname, 'media', 'loader.gif'),
  width: 'auto',
  height: 'auto',
  preserveAspectRatio: true,
  expandGifs: true,
  useFallback: null,
  textTop: null,
  textBottom: null,
  saveOptions: false,
  set: null,
  frameThrottle: 0,
  output: process.stdout
}

var ProgressImg = function (img, opts) {
  if (!opts && typeof img === 'object' && !Array.isArray(img)) {
    opts = img
  }

  this.cleared = false
  this.current = null
  this.fallback = false
  this.frames = []
  this.fallbackFrames = []
  this.lastSet = null
  this.log = null
  this.options = Object.assign({}, defaults, opts)
  this.prevOptions = {}

  if (!img) {
    img = this.options.image
  }

  if (!(img && img.length > 0)) {
    img = defaults.image
  }

  if (!Array.isArray(img)) {
    img = [img]
  }

  if (this.options.useFallback !== false) {
    if (this.options.useFallback || process.env.TERM_PROGRAM !== 'iTerm.app') {
      this.fallback = true
    } else {
      const iTermVersion = iterm2Version()

      if (Number(iTermVersion[0]) < 3) {
        this.fallback = true
      }
    }
  }

  if (this.fallback) {
    var fallbackFit = this.options.preserveAspectRatio ? 'box' : 'original'

    if (this.options.height === 'auto' && this.options.width === 'auto') {
      fallbackFit = 'box'
    } else if (this.options.height === 'auto') {
      fallbackFit = 'width'
    } else if (this.options.width === 'auto') {
      fallbackFit = 'height'
    }

    var fallbackOptions = {
      fit: fallbackFit,
      height: this.options.height === 'auto' ? '100%' : this.options.height.replace('px', ''),
      width: this.options.width === 'auto' ? '100%' : this.options.width.replace('px', ''),
    }
  }

  this.log = logUpdate.create(this.options.output)

  img.forEach(i => {
    var buffer

    if (Buffer.isBuffer(i)) {
      buffer = i
    } else if (i.indexOf('data:') === 0) {
      var parsed = parseDataUri(i)

      if (parsed) {
        buffer = parsed.data
      }
    } else if (i.indexOf('http://') === 0 || i.indexOf('https://') === 0) {
      var response = requestSync({ url: i, encoding: null })

      if (response) {
        buffer = response.body
      }
    } else {
      var contents = fs.readFileSync(i)

      if (contents) {
        buffer = Buffer.from(contents)
      }
    }

    var type = imageType(buffer)

    if (!type || !type.ext) {
      return
    }

    if (type.ext === 'gif' && this.options.extractGifs !== false) {
      try {
        var frames = gifFramesSync({ url: buffer, frames: 'all', outputType: 'png' })

        frames.forEach(frame => {
          var parts = toArraySync(frame.getImage())
          var frameBuffers = parts.map(part => Buffer.from(part))
          var frameBuffer = Buffer.concat(frameBuffers)

          this.frames.push(frameBuffer)

          if (this.fallback) {
            this.fallbackFrames.push(asciifySync(frameBuffer, fallbackOptions))
          }
        })
      } catch (err) {
        throw err
      }
    } else {
      this.frames.push(buffer)

      if (this.fallback) {
        this.fallbackFrames.push(asciifySync(buffer, fallbackOptions))
      }
    }
  })

  if (!this.frames.length) {
    delete this.options.image
    return new ProgressImg(null, opts)
  }

  if (this.options.set) {
    this.set(this.options.set)
  }

  return this
}

ProgressImg.prototype.set = function (set, opts) {
  if (!opts && typeof set === 'object') {
    opts = set
    set = null
  }

  if (!set && !(opts && opts.set)) {
    set = 0
  } else if (!set) {
    set = opts.set
  }

  opts = Object.assign({}, this.options, opts)

  var frameNumber = set
  var frameLimit = ((this.fallback ? this.fallbackFrames.length : this.frames.length) - 1)

  if (opts.saveOptions) {
    opts.saveOptions = false
    this.options = opts
  }

  if (String(set).slice(-1) === '%') {
    frameNumber = Math.round((set.slice(0, -1) / 100) * frameLimit)
  }

  if (frameNumber > frameLimit) {
    frameNumber = frameLimit
  }

  if (frameNumber < 0) {
    frameNumber = 0
  }

  if (!this.cleared) {
    if (frameNumber === this.current && isEqual(this.prevOptions, opts)) {
      return this
    }

    if (opts.frameThrottle && set !== 0) {
      var frameThrottle = opts.frameThrottle

      if (String(frameThrottle).slice(-2) === 'ms') {
        frameThrottle = frameThrottle.slice(0, -2)

        if (!((Date.now() - this.lastSet) > frameThrottle)) {
          return this
        }
      } else {
        if (String(frameThrottle).slice(-1) === '%') {
          frameThrottle = Math.round((frameThrottle.slice(0, -1) / 100) * frameLimit)
        }

        if (!((frameNumber - this.current) > frameThrottle)) {
          return this
        }
      }
    }
  }

  this.cleared = false
  this.current = frameNumber
  this.lastSet = Date.now()
  this.prevOptions = opts

  var content

  if (this.fallback) {
    content = this.fallbackFrames[frameNumber]
  } else {
    content = ansiEscapes.image(this.frames[frameNumber], opts)
  }

  if (opts.textTop) {
    content = opts.textTop + '\n' + content
  }

  if (opts.textBottom) {
    content += '\n' + opts.textBottom
  }

  this.log(content)

  return this
}

ProgressImg.prototype.clear = function () {
  this.log.clear()
  this.cleared = true
  return this
}

ProgressImg.prototype.done = function () {
  this.log.done()
  return this
}

module.exports = ProgressImg
