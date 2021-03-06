#!/usr/bin/env node

const { join } = require('path')
const { outputFileSync, removeSync } = require('fs-extra')
const minimist = require('minimist')
const { TMP_DIR, CWD } = require('../lib/config')
const falco = require('../lib/compiler')
const exportEslint = require('../lib/helper/eslint')
const { version } = require('../package.json')

const {
  eslint,
  clean,
  v,
  p,
  d,
  c,
  o = 'dist',
  m = 'index.js',
  t = 'index.html',
} = minimist(process.argv.slice(2))

if (v) {
  global.console.log(version)
  process.exit(0)
}

if (clean) {
  removeSync(TMP_DIR)
  process.exit(0)
}

const port = Number(p) || undefined
const config = {
  entry: join(CWD, m),
  template: join(CWD, t),
  port,
  mode: d ? 'development' : 'production',
}

let localConfig = {}

if (c) {
  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    localConfig = require(join(CWD, 'falco.config.js'))
  } catch ({ message }) {
    global.console.error(message)
  }
}

(async () => {
  try {
    if (eslint) {
      await exportEslint()
      process.exit(0)
    }

    const options = { output: {}, ...config, ...localConfig }
    const { mode, codes, template } = await falco(options)
    const dist = join(CWD, o)

    if (mode === 'development') {
      return
    }

    if (options.output.libraryTarget === undefined) {
      outputFileSync(join(dist, 'index.html'), template)
    }

    codes.forEach(({ name, content }) => {
      outputFileSync(join(dist, name), content)
    })
  } catch ({ message }) {
    global.console.error(message)
  }
})()
