// craco.config.js
const path = require("path");
require("dotenv").config();

// Environment variable overrides
const config = {
  disableHotReload: process.env.DISABLE_HOT_RELOAD === "true",
  enableVisualEdits: process.env.REACT_APP_ENABLE_VISUAL_EDITS === "true",
  enableHealthCheck: process.env.ENABLE_HEALTH_CHECK === "true",
  // WebSocket configuration from environment (with defaults)
  wsHost: process.env.WDS_SOCKET_HOST || 'localhost',
  wsPort: parseInt(process.env.WDS_SOCKET_PORT || '3000', 10),
  wsPath: process.env.WDS_SOCKET_PATH || '/ws',
  // Option to disable WebSocket entirely if it causes issues
  disableWebSocket: process.env.DISABLE_WEBSOCKET === "true",
};

// Conditionally load visual editing modules only if enabled
let babelMetadataPlugin;
let setupDevServer;

if (config.enableVisualEdits) {
  babelMetadataPlugin = require("./plugins/visual-edits/babel-metadata-plugin");
  setupDevServer = require("./plugins/visual-edits/dev-server-setup");
}

// Conditionally load health check modules only if enabled
let WebpackHealthPlugin;
let setupHealthEndpoints;
let healthPluginInstance;

if (config.enableHealthCheck) {
  WebpackHealthPlugin = require("./plugins/health-check/webpack-health-plugin");
  setupHealthEndpoints = require("./plugins/health-check/health-endpoints");
  healthPluginInstance = new WebpackHealthPlugin();
}

const webpackConfig = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      // Force all imports of 'cookie' to use shim that provides named exports
      'cookie': path.resolve(__dirname, 'src/shims/cookie.js'),
    },
    configure: (webpackConfig) => {
      // Fix for Node 24 compatibility with react-scripts 5
      // Use webpack's loader options API to modify babel-loader options globally
      if (!webpackConfig.module) webpackConfig.module = {};
      if (!webpackConfig.module.rules) webpackConfig.module.rules = [];
      
      // Deep traversal to fix all babel-loader instances
      // This must run BEFORE react-refresh-webpack-plugin processes the loaders
      const fixBabelLoaderOptions = (rules) => {
        if (!rules || !Array.isArray(rules)) return;
        
        for (const rule of rules) {
          // Handle oneOf rules (react-scripts uses this pattern)
          if (rule.oneOf && Array.isArray(rule.oneOf)) {
            fixBabelLoaderOptions(rule.oneOf);
          }
          
          // Handle use array
          if (rule.use) {
            const uses = Array.isArray(rule.use) ? rule.use : [rule.use];
            for (let i = 0; i < uses.length; i++) {
              const use = uses[i];
              if (!use) continue;
              
              // Check if this is babel-loader (direct or wrapped)
              let loaderPath = '';
              if (typeof use.loader === 'string') {
                loaderPath = use.loader;
              } else if (use.loader && typeof use.loader === 'object') {
                loaderPath = use.loader.loader || '';
              } else if (typeof use === 'string') {
                loaderPath = use;
              }
              
              // Fix babel-loader options
              if (loaderPath && loaderPath.includes('babel-loader')) {
                if (!use.options) use.options = {};
                if (typeof use.options === 'object') {
                  // CRITICAL: Force parser options - this is essential for Node 24
                  // Set parserOpts at the root level
                  use.options.parserOpts = {
                    sourceType: 'module',
                    ...(use.options.parserOpts || {}),
                  };
                  
                  // Also set sourceType at root level
                  use.options.sourceType = 'module';
                  
                  // Ensure babelrc is enabled so .babelrc is read (react-scripts may disable it)
                  use.options.babelrc = true;
                  
                  // Disable configFile to force use of .babelrc
                  if (use.options.configFile !== undefined) {
                    use.options.configFile = false;
                  }
                  
                  // Ensure .babelrc is explicitly enabled
                  use.options.babelrcRoots = [path.resolve(__dirname)];
                }
              }
              
              // Also check for react-refresh-webpack-plugin and ensure it passes options through
              if (loaderPath && loaderPath.includes('react-refresh-webpack-plugin')) {
                // The plugin wraps babel-loader, so we need to ensure options are passed
                if (!use.options) use.options = {};
                if (typeof use.options === 'object') {
                  use.options.parserOpts = {
                    ...(use.options.parserOpts || {}),
                    sourceType: 'module',
                  };
                }
              }
            }
          }
          
          // Handle direct loader property
          if (rule.loader) {
            const loaderPath = typeof rule.loader === 'string' ? rule.loader : '';
            if (loaderPath.includes('babel-loader')) {
              if (!rule.options) rule.options = {};
              if (typeof rule.options === 'object') {
                rule.options.parserOpts = {
                  ...(rule.options.parserOpts || {}),
                  sourceType: 'module',
                };
                rule.options.sourceType = 'module';
                if (rule.options.babelrc === false) {
                  rule.options.babelrc = true;
                }
              }
            }
          }
        }
      };
      
      // Fix babel-loader options in all rules
      fixBabelLoaderOptions(webpackConfig.module.rules);

      // Disable hot reload completely if environment variable is set
      if (config.disableHotReload) {
        // Remove hot reload related plugins
        webpackConfig.plugins = webpackConfig.plugins.filter(plugin => {
          return !(plugin.constructor.name === 'HotModuleReplacementPlugin');
        });

        // Disable watch mode
        webpackConfig.watch = false;
        webpackConfig.watchOptions = {
          ignored: /.*/, // Ignore all files
        };
      } else {
        // Add ignored patterns to reduce watched directories
        webpackConfig.watchOptions = {
          ...webpackConfig.watchOptions,
          ignored: [
            '**/node_modules/**',
            '**/.git/**',
            '**/build/**',
            '**/dist/**',
            '**/coverage/**',
            '**/public/**',
          ],
        };
      }

      // Add health check plugin to webpack if enabled
      if (config.enableHealthCheck && healthPluginInstance) {
        webpackConfig.plugins.push(healthPluginInstance);
      }

      // Add plugin to intercept and fix babel-loader options at the earliest possible stage
      class FixBabelParserPlugin {
        apply(compiler) {
          // Access normalModuleFactory from compiler, not compilation
          compiler.hooks.normalModuleFactory.tap('FixBabelParserPlugin', (nmf) => {
            // Intercept when creating the module - this is where loader options are finalized
            nmf.hooks.beforeResolve.tap('FixBabelParserPlugin', (data) => {
              if (data && data.request) {
                // Check if this request involves babel-loader
                if (typeof data.request === 'string' && data.request.includes('babel-loader')) {
                  if (!data.options) data.options = {};
                  if (typeof data.options === 'object') {
                    if (!data.options.parserOpts) data.options.parserOpts = {};
                    data.options.parserOpts.sourceType = 'module';
                    data.options.sourceType = 'module';
                  }
                }
              }
            });
            
            // Intercept after resolve - modify loader options
            nmf.hooks.afterResolve.tap('FixBabelParserPlugin', (data) => {
              if (!data) return;
              
              // Fix loader options in the loaders array
              if (data.loaders && Array.isArray(data.loaders)) {
                data.loaders.forEach((loader) => {
                  if (loader && loader.loader) {
                    const loaderPath = typeof loader.loader === 'string' 
                      ? loader.loader 
                      : (typeof loader.loader === 'object' && loader.loader.loader 
                        ? loader.loader.loader 
                        : '');
                    
                    if (loaderPath && loaderPath.includes('babel-loader')) {
                      if (!loader.options) loader.options = {};
                      if (typeof loader.options === 'object') {
                        loader.options.parserOpts = {
                          ...(loader.options.parserOpts || {}),
                          sourceType: 'module',
                        };
                        loader.options.sourceType = 'module';
                        // Force babelrc to be true so .babelrc is read
                        loader.options.babelrc = true;
                      }
                    }
                  }
                });
              }
            });
          });
        }
      }
      
      if (!webpackConfig.plugins) webpackConfig.plugins = [];
      webpackConfig.plugins.push(new FixBabelParserPlugin());

      return webpackConfig;
    },
  },
};

// Configure babel with parser options for Node 24 compatibility
// CRACO will merge this with react-scripts' babel config
// Note: .babelrc file also sets parserOpts as a fallback
const babelConfig = {
  parserOpts: {
    sourceType: 'module',
  },
  // Ensure babel processes files as modules
  sourceType: 'module',
};

// Add visual edits plugin if enabled
if (config.enableVisualEdits && babelMetadataPlugin) {
  babelConfig.plugins = [babelMetadataPlugin];
}

webpackConfig.babel = babelConfig;

// PERMANENT FIX: Setup dev server configuration - always apply to fix WebSocket issues
// This configuration is applied at multiple levels to ensure it cannot be overridden
webpackConfig.devServer = (devServerConfig) => {
  // Use environment variables or defaults
  const wsHost = config.wsHost;
  const wsPort = config.wsPort;
  const wsPath = config.wsPath;
  
  // Force correct port and host configuration - override any existing values
  // This MUST happen first, before any other config is applied
  const baseConfig = {
    port: wsPort,
    host: wsHost,
    allowedHosts: 'all',
  };
  
  // Configure WebSocket based on disableWebSocket flag
  if (config.disableWebSocket) {
    // Disable WebSocket entirely - no hot reload, but no errors either
    Object.assign(devServerConfig, {
      ...baseConfig,
      hot: false,
      liveReload: false,
      webSocketServer: false,
      client: {
        overlay: {
          errors: true,
          warnings: false,
        },
        logging: 'none',
      },
    });
  } else {
    // Configure WebSocket properly
    Object.assign(devServerConfig, {
      ...baseConfig,
      // CRITICAL: Set client WebSocket URL - this is what the client-side code uses
      // This is the most important setting - it controls what URL the browser connects to
      client: {
        webSocketURL: {
          hostname: wsHost,
          port: wsPort,
          protocol: 'ws',
          pathname: wsPath,
        },
        overlay: {
          errors: true,
          warnings: false,
        },
        logging: 'none',
        // Disable automatic WebSocket URL detection
        webSocketTransport: 'ws',
      },
      // Explicitly set WebSocket server options
      webSocketServer: {
        type: 'ws',
        options: {
          host: wsHost,
          port: wsPort,
          path: wsPath,
        },
      },
      // Ensure hot module replacement is properly configured
      hot: true,
      liveReload: true,
    });
  }
  
  // Apply visual edits dev server setup if enabled
  if (config.enableVisualEdits && setupDevServer) {
    devServerConfig = setupDevServer(devServerConfig);
    // CRITICAL: Force re-apply WebSocket config after visual edits setup
    // Use Object.assign to completely replace, not merge
    if (config.disableWebSocket) {
      Object.assign(devServerConfig, {
        hot: false,
        liveReload: false,
        webSocketServer: false,
        client: {
          overlay: {
            errors: true,
            warnings: false,
          },
          logging: 'none',
        },
      });
    } else {
      Object.assign(devServerConfig, {
        client: {
          webSocketURL: {
            hostname: wsHost,
            port: wsPort,
            protocol: 'ws',
            pathname: wsPath,
          },
          overlay: {
            errors: true,
            warnings: false,
          },
          logging: 'none',
          webSocketTransport: 'ws',
        },
        webSocketServer: {
          type: 'ws',
          options: {
            host: wsHost,
            port: wsPort,
            path: wsPath,
          },
        },
        hot: true,
        liveReload: true,
      });
    }
  }

  // Add health check endpoints if enabled
  if (config.enableHealthCheck && setupHealthEndpoints && healthPluginInstance) {
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;

    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      // Call original setup if exists
      if (originalSetupMiddlewares) {
        middlewares = originalSetupMiddlewares(middlewares, devServer);
      }

      // Setup health endpoints
      setupHealthEndpoints(devServer, healthPluginInstance);

      return middlewares;
    };
  }

  // FINAL OVERRIDE: Ensure WebSocket config is absolutely correct before returning
  // This is the last chance to fix it before webpack-dev-server uses it
  if (config.disableWebSocket) {
    // Disable WebSocket completely
    devServerConfig.hot = false;
    devServerConfig.liveReload = false;
    devServerConfig.webSocketServer = false;
    if (!devServerConfig.client) {
      devServerConfig.client = {};
    }
    Object.assign(devServerConfig.client, {
      overlay: {
        errors: true,
        warnings: false,
      },
      logging: 'none',
    });
  } else {
    // Ensure WebSocket is properly configured
    if (!devServerConfig.client) {
      devServerConfig.client = {};
    }
    Object.assign(devServerConfig.client, {
      webSocketURL: {
        hostname: wsHost,
        port: wsPort,
        protocol: 'ws',
        pathname: wsPath,
      },
    });
  }

  return devServerConfig;
};

module.exports = webpackConfig;
