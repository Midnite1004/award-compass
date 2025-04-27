const path = require('path');

module.exports = {
  // ... existing config ...
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }

      // Add your custom middleware here
      return middlewares;
    },
    // Other devServer options
    port: 3001,
    hot: true,
    historyApiFallback: true,
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
  },
}; 