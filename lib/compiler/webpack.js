const { removeSync } = require('fs-extra')
const webpack = require('webpack')
const WebpackDevServer = require('webpack-dev-server')
const getConfig = require('./config')
const checker = require('./checker')

module.exports = async (config) => {
  const { widthPolyfillEntrys, contentBase } = config
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

        widthPolyfillEntrys.forEach((path) => {
          removeSync(path)
        })

        resolve({ assets, mode })
      })
    } else {
      try {
        compiler.hooks.done.tapAsync('done', checker.bind(config))

        const devServer = new WebpackDevServer(compiler, {
          disableHostCheck: true,
          contentBase,
          port,
          host: '0.0.0.0',
          stats: 'minimal',
          hot: true,
          inline: true,
        })
        devServer.listen(port)

        resolve({ server: devServer, mode })
      } catch (e) {
        reject(e)
      }
    }
  })
}
