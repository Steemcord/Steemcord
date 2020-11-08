const path = require('path');
const { VueLoaderPlugin } = require('vue-loader');
const srcDir = 'src/view/';

module.exports = {
  entry: {
    'app.js': path.join(__dirname, srcDir + 'index.ts'),
    'guard/app.js': path.join(__dirname, srcDir + 'guard/index.ts')
  },
  /*
  watchOptions: {
    ignored: /^(?!src\/view)/
  },
  */
  output: {
    path: path.join(__dirname, 'dist/app/view'),
    filename: '[name]',
    library: 'stmcrd'
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          chunks: 'all',
          name: 'vendor.js',
          test(module) {
            var context = module.context;

            if (typeof context !== 'string') {
              return false;
            }

            return context.indexOf('node_modules') !== -1;
          }
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader'
      },
			{
				test: /\.(woff|woff2|ttf|png|jpe?g|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 100000,
            },
          },
        ],
			},
      {
        test: /\.svg$/,
        loader: 'vue-svg-loader',
      },
      {
        test: /\.styl(us|)$/,
        use: [
          'style-loader',
          'css-loader',
          'stylus-loader'
        ]
      },
      {
        test: /\.ts?$/,
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: { appendTsSuffixTo: [/\.vue$/] }
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js', '.vue']
  },
  plugins: [
    new VueLoaderPlugin()
  ]
};