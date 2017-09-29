'use strict'

const ansiEscapes = require('ansi-escapes')
const bar = require('progress-bar')
const Buffer = require('safe-buffer').Buffer
const deasync = require('deasync')
const fs = require('fs')
const gifFrames = require('gif-frames')
const imageType = require('image-type')
const iterm2Version = require('iterm2-version')
const lodash = require('lodash')
const logUpdate = require('log-update')
const parseDataUri = require('parse-data-uri')
const path = require('path')
const toArray = require('stream-to-array')
const request = require('request')

const gifFramesSync = deasync(gifFrames)
const toArraySync = deasync(toArray)
const requestSync = deasync(request)

const defaults = {
  image: path.join(__dirname, 'media', 'loader.gif'),
  width: 'auto',
  height: 'auto',
  preserveAspectRatio: true,
  expandGifs: true,
  fallbackFormat: null,
  fallbackWidth: 20,
  useFallback: null,
  textTop: null,
  textBottom: null,
  saveOptions: false,
  set: null,
  frameThrottle: 0,
  output: process.stdout
}

var ProgressImg = function (img, opts, fallback) {
  if (!opts && typeof img === 'object' && !Array.isArray(img)) {
    opts = img
  }

  this.cleared = false
  this.current = null
  this.fallback = false
  this.frames = []
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
    this.fallback = bar.create(this.options.output, this.options.fallbackWidth)
  } else {
    this.log = logUpdate.create(this.options.output)
  }

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
          var buffers = parts.map(part => Buffer.from(part))

          this.frames.push(Buffer.concat(buffers))
        })
      } catch (err) {
        throw err
      }
    } else {
      this.frames.push(buffer)
    }
  })

  if (this.fallback && fallback) {
    fallback(this)
  }

  if (!this.frames.length) {
    delete this.options.image
    return new ProgressImg(null, opts)
  }

  if (this.options.set) {
    this.set(this.options.set)
  }

  return this
}

ProgressImg.prototype.set = function (set, opts, fallback) {
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
  var frameLimit = (this.frames.length - 1)

  if (opts.saveOptions) {
    opts.saveOptions = false
    this.options = opts
  }

  if (this.fallback) {
    if (String(set).slice(-1) === '%') {
      frameNumber = (set.slice(0, -1) / 100)
    } else {
      frameNumber = (((set / frameLimit) * 100) / 100).toFixed(2)
    }

    if (frameNumber > 1) {
      frameNumber = 1
    }
  } else {
    if (String(set).slice(-1) === '%') {
      frameNumber = Math.round((set.slice(0, -1) / 100) * frameLimit)
    }

    if (frameNumber > frameLimit) {
      frameNumber = frameLimit
    }
  }

  if (frameNumber < 0) {
    frameNumber = 0
  }

  if (!this.cleared) {
    if (frameNumber === this.current && lodash.isEqual(this.prevOptions, opts)) {
      return this
    }

    if (!this.fallback && opts.frameThrottle && set !== 0) {
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

  if (this.fallback) {
    if (fallback) {
      fallback(set, this)
    } else {
      var format = ''

      if (opts.fallbackFormat) {
        format = opts.fallbackFormat
      } else {
        if (opts.textTop) {
          format = opts.textTop + ' '
        }

        format += '$bar;'

        if (opts.textBottom) {
          format += ' ' + opts.textBottom
        }
      }
    }

    this.fallback.format = format

    if (opts.fallbackWidth) {
      this.fallback.width = opts.fallbackWidth
    }

    this.fallback.update(frameNumber)
  } else {
    var image = ansiEscapes.image(this.frames[frameNumber], opts)
    var content = image

    if (opts.textTop) {
      content = opts.textTop + '\n' + content
    }

    if (opts.textBottom) {
      content += '\n' + opts.textBottom
    }

    this.log(content)
  }

  return this
}

ProgressImg.prototype.clear = function (fallback) {
  if (this.fallback) {
    if (fallback) {
      fallback(this)
    } else {
      this.options.output.write(ansiEscapes.eraseLines(1))
    }
  } else {
    this.log.clear()
  }

  this.cleared = true

  return this
}

ProgressImg.prototype.done = function (fallback) {
  if (this.fallback) {
    if (fallback) {
      fallback(this)
    } else if (!this.cleared) {
      this.options.output.write('\n')
    }
  } else {
    this.log.done()
  }

  return this
}

module.exports = ProgressImg
