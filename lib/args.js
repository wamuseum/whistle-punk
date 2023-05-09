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
  description: 'Display ID to open window on',
  default: 0,
  type: 'int'
})
.option('fullscreen', {
  alias: 'f',
  description: 'Fullscreen?',
  default: true,
  type: 'boolean',
})
.option('height', {
  alias: 'h',
  description: 'Height of the window in pixels'
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
.option('ssl', {
  type: 'string'
})
.option('verbose', {
  alias: 'v',
  description: 'Verbose output',
  default: false,
  type: 'boolean'
})
.option('width', {
  alias: 'w',
  description: 'Width of the window in pixels'
})
.option('x', {
  description: 'Window Position x',
  type: 'int'
})
.option('y', {
  description: 'Window Position y',
  type: 'int'
})
.usage("whistle-punk [options] URI")
.example([
  ['whistle-punk --kiosk=false --width=1920 --height=1080 https://visit.museum.wa.gov.au/'],
  ['whistle-punk config.yml']
])
.check((argv, options) => {
  // console.log(argv._);
  const filePaths = argv._
  if (filePaths.length === 0) {
    throw new Error("No config/script or URL given.")
  } else {
    return true // tell Yargs that the arguments passed the check
  }
})
.wrap(null)
.help()
  .argv;

module.exports = args;