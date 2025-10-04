const path = require('path');

module.exports = {
  entry: './src/electron/main.ts',
  target: 'electron-main',
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader'
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist/electron'),
    filename: 'main.js'
  },
  node: {
    __dirname: false,
    __filename: false
  }
};