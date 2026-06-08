const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: ['@babel/polyfill', './src/client/index'],
  output: {
    path: path.resolve('dist'),
    publicPath: '/dist/',
    filename: 'bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        include: path.resolve('src'),
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
      },
    ],
  },
};
