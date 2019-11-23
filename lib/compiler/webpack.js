const { dirname, extname, join } = require('path')
const { removeSync } = require('fs-extra')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const getConfig = require('./config')
const checker = require('./checker')
const { TEMP_INDEX } = require('../config')

module.exports = async (config) => {
  global.console.info('Webpack building...')

  const webpackConfig = await getConfig(config)
  const { mode } = webpackConfig
  const { port } = config
  const compiler = webpack(webpackConfig)

  return new Promise((resolve, reject) => {
    if (mode === 'production') {
      compiler.run((err, stats) => {
        // err is `config` error, ignore

        const info = stats.toJson('minimal')

        if (stats.hasErrors()) {
          global.console.error(...info.errors)
          reject(new Error('Webpack build error'))
          return
        }

        if (stats.hasWarnings()) {
          global.console.warn(...info.warnings)
        }

        const { assets } = stats.toJson('normal')

        webpackConfig.entry.forEach((p, i) => {
          const currentPath = dirname(p)
          const ext = extname(p)
          const targetPath = join(currentPath, TEMP_INDEX + i + ext)
          removeSync(targetPath)
        })

        resolve({ assets, mode })
      })
    } else {
      try {
        compiler.hooks.done.tapAsync('done', checker.bind(config))

        const devServer = new WebpackDevServer(compiler, {
          disableHostCheck: true,
          contentBase: config.tmpDir,
          port,
          host: '0.0.0.0',
          stats: 'minimal',
          hot: true,
          inline: true,
        })
        devServer.listen(port)
        global.console.info(`Server running: http://127.0.0.1:${port}`)

        resolve({ server: devServer, mode })
      } catch (e) {
        reject(e)
      }
    }
  })
}
