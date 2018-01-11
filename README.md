# progress-img
[![npm package version](https://img.shields.io/npm/v/progress-img.svg?style=flat-square)](https://www.npmjs.com/package/progress-img)
[![Travis build status](https://img.shields.io/travis/kodie/progress-img.svg?style=flat-square)](https://travis-ci.org/kodie/progress-img)
[![npm package downloads](https://img.shields.io/npm/dt/progress-img.svg?style=flat-square)](https://www.npmjs.com/package/progress-img)
[![index.js file size](https://img.shields.io/github/size/kodie/progress-img/index.js.svg?style=flat-square)](index.js)
[![code style](https://img.shields.io/badge/code_style-standard-yellow.svg?style=flat-square)](https://github.com/standard/standard)
[![license](https://img.shields.io/github/license/kodie/progress-img.svg?style=flat-square)](LICENSE.md)

![](https://raw.githubusercontent.com/kodie/progress-img/master/media/preview.gif?raw=true)

Use images as progress bars in the terminal!

## Requirements
* [Node.js](https://nodejs.org) v4.0 or higher

*[iTerm2](https://iterm2.com) v2.9 or higher is required to display actual images. Otherwise an [ASCII](https://en.wikipedia.org/wiki/ASCII_art) version of the images will be displayed.*

## Installation
```shell
npm install --save progress-img
```

## Usage
```javascript
const ProgressImg = require('progress-img')

var progress = new ProgressImg('awesome.gif', {
  frameThrottle: '500ms',
  textTop: 'Downloading file...',
  width: '100%'
})

// Set progress to a specific frame
progress.set(3)

// Set progress to a percentage
progress.set('26%')

// Display some text below the image
progress.set('52%', { textBottom: 'Please wait...' })

// Clear the progress
progress.clear()

// Finish
progress.done()
```

*Note: The `clear()` function is optional, however the `done()` function should always be ran when you are finished with the progress image.*

## Images
The first parameter of the initial `ProgressImg` setup function is where you set the image(s) that you would like to use. If one is not supplied, a default one will be used.

This parameter accepts a string or an array filled with strings that contain either a file path, URL, or image buffer.

## Options
These options can be passed as the second parameter to either the initial `ProgressImg` setup, or to the `progress.set` function.

```javascript
var options = {
  image: 'awesome.gif',

  width: 'auto',

  height: 'auto',

  preserveAspectRatio: true,

  expandGifs: false,

  useFallback: true,

  textTop: 'Downloading file...',

  textBottom: 'Please wait...',

  saveOptions: true,

  set: '20%',

  frameThrottle: '500ms',

  output: process.stdout
}
```

### image
The image(s) to use. Can be used instead of the `image` parameter. (Defaults to `./loader.gif`)

*Note: This option can only be used in the initial `ProgressImg` setup.*

### width
### height
The width and height of the image. Can be one of the following: (Defaults to `auto`)

* `N`: N character cells.
* `Npx`: N pixels.
* `N%`: N percent of the session's width or height.
* `auto`: The image's inherent size will be used to determine an appropriate dimension.

*Note: This option can only be used in the initial `ProgressImg` setup when using the ASCII fallback.*

### preserveAspectRatio
Whether to preserve the aspect ratio of the image or not. (Defaults to `true`)

### expandGifs
Whether or not to expand GIFs into separate frames. (Defaults to `true`)

*Note: This option can only be used in the initial `ProgressImg` setup.*

### useFallback
Whether to use the fallback progress bar regardless if the user is using a supported terminal or not. Great for testing how the fallback progress bar looks or bypassing the terminal check. (Defaults to `null`)

*Note: This option can only be used in the initial `ProgressImg` setup.*

### textTop
### textBottom
Text to display above or below the image. (Defaults to `null`)

### saveOptions
Whether to overwrite the options set in the initial `ProgressImg` setup. (Defaults to `false`)

*Note: This option can only be used in the `progress.set` function.*

### set
The frame number or percentage to set the progress to. Can be used instead of `set` parameter. Can also be used in the initial `ProgressImg` setup. (Defaults to `null`)

### frameThrottle
Throttle the frame changes by: (Defaults to `0`)

* `N`: Actual frame count.
* `N%`: Frame count percentage.
* `Nms`: Milliseconds since the last frame change.

*Note: `500ms` is recommended for a smoother animation.*

### output
The stream to output to. (Defaults to `process.stdout`)

## License
MIT. See the [License file](LICENSE.md) for more info.
