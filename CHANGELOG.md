# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]


## [1.1.0] - 2018-01-11
### Changed
- [asciify-image](https://www.npmjs.com/package/asciify-image) is now used as a fallback instead of [progress-bar](https://www.npmjs.com/package/progress-bar).
- [lodash.isequal](https://www.npmjs.com/package/lodash.isequal) is now used for checking if objects are equal rather than loading the entire [lodash](https://www.npmjs.com/package/lodash) library.

### Removed
- `fallback` parameter for all 3 functions.


## [1.0.2] - 2017-09-29
### Added
- Support for node versions 4.0 through 5.12.


## [1.0.1] - 2017-09-18
### Added
- [CHANGELOG.md](CHANGELOG.md).
- Note about iTerm version requirement to [README.md](README.md).

### Changed
- Fixed path to [loader.gif](loader.gif).
- Switched to absolute preview image URL in [README.md](README.md) so that it will show up on NPM.


## 1.0.0 - 2017-09-18
### Added
- Initial release.

[Unreleased]: https://github.com/kodie/progress-img/compare/v1.0.0...HEAD
[1.1.0]: https://github.com/kodie/progress-img/compare/v1.0.2...v1.1.0
[1.0.2]: https://github.com/kodie/progress-img/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/kodie/progress-img/compare/v1.0.0...v1.0.1
