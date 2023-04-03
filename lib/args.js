// yargs command module code, see https://github.com/yargs/yargs/blob/main/docs/advanced.md#example-command-hierarchy-using-commanddir
const yargs = require('yargs')
const { hideBin } = require('yargs/helpers')

const args = yargs(hideBin(process.argv))
.option('de-bug', {
  alias: 'd',
  description: 'Output debug information to stdout',
  type: 'boolean',
  default: false
})
.option('display', {
  description: 'Display ID to opne window on',
  default: 0,
  type: 'int'
})
.option('frame', {
  description: 'Frameless window?',
  default: true,
  type: 'boolean',
})
.option('fullscreen', {
  alias: 'f',
  description: 'Fullscreen?',
  default: true,
  type: 'boolean',
})
.option('kiosk', {
  alias: 'k',
  description: 'Kiosk mode?',
  default: true,
  type: 'boolean'
})
.option('ontop', {
  alias: 't',
  description: 'Start window on top of others',
  default: true,
  type: 'boolean'
})
.option('width', {
  description: 'Window width in pixels',
  type: 'int'
})
.option('height', {
  description: 'Window height in pixels',
  type: 'int'
})
.option('verbose', {
  alias: 'v',
  description: 'Verbose output',
  default: false,
  type: 'boolean'
})
.option('x', {
  description: 'Window Position x',
  type: 'int'
})
.option('y', {
  description: 'Window Position y',
  type: 'int'
})
.wrap(null)
.help()
.argv;

module.exports = args;