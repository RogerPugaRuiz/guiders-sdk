const path = require('path');
const webpack = require('webpack');
const Dotenv = require('dotenv-webpack');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const packageJson = require('./package.json');

module.exports = (env, argv) => {
const isDev = argv?.mode === 'development';

return {
	plugins: [
		new Dotenv(),
		// Inyectar versión del SDK y modo de producción en tiempo de compilación
		new webpack.DefinePlugin({
			__SDK_VERSION__: JSON.stringify(packageJson.version),
			__PRODUCTION__: !isDev,
		}),
		// In development, automatically copy the built bundle to both test
		// environments after every compilation (mirrors the manual `cp` step).
		...(isDev ? [
			new CopyPlugin({
				patterns: [
					{
						from: path.resolve(__dirname, 'dist/index.js'),
						to: path.resolve(__dirname, 'wordpress-plugin/guiders-wp-plugin/assets/js/guiders-sdk.min.js'),
					},
					{
						from: path.resolve(__dirname, 'dist/index.js'),
						to: path.resolve(__dirname, 'demo/app/guiders-sdk.js'),
					},
				],
			}),
		] : []),
	],
	entry: './src/index.ts', // Archivo principal del SDK
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'index.js', // Nombre del archivo de salida
		library: 'GuidersPixel', // Nombre de la librería
		libraryTarget: 'umd', // Compatible con CommonJS, AMD y global en navegador
		globalObject: 'this', // Para que funcione en navegadores y Node.js
		libraryExport: 'default'
	},
	resolve: {
		extensions: ['.tsx', '.ts', '.js'], // Extensiones de archivos a resolver
		alias: {
			'react': 'preact/compat',
			'react-dom': 'preact/compat',
			'react/jsx-runtime': 'preact/jsx-runtime',
		},
	},
	module: {
		rules: [{
			test: /\.(ts|tsx)$/,
			use: 'ts-loader',
			exclude: /node_modules/
		}]
	},
	mode: 'production',
	// Bundle size budget — only enforce in production to avoid noisy warnings
	// from the unminified development build (which is intentionally larger).
	performance: isDev ? { hints: false } : {
		hints: 'warning',
		maxEntrypointSize: 460800, // 450 KiB
		maxAssetSize: 460800,
	},
	// Webpack-dev-server config consumed by `npm start`.
	devServer: {
		static: path.resolve(__dirname, 'demo/app'),
		port: 8081,
		host: '127.0.0.1',
		hot: true,
		allowedHosts: 'all',
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
		// Write bundle to disk so CopyPlugin can pick it up and copy it to
		// WordPress and demo environments on every recompile.
		devMiddleware: {
			writeToDisk: true,
		},
	},
	// Optimizaciones de producción
	optimization: {
		usedExports: true,     // Tree-shaking: marca exports no usados
		minimize: true,
		minimizer: [
			new TerserPlugin({
				terserOptions: {
					compress: {
						drop_console: false,  // Mantener console para debug-logger
						drop_debugger: true,
						passes: 2,            // Múltiples pasadas de compresión
						// Eliminar todas las llamadas a debug-logger en bundles de producción.
						// debugLog/debugWarn/debugError son los tres helpers en utils/debug-logger.ts
						pure_funcs: ['debugLog', 'debugWarn', 'debugError'],
					},
					mangle: {
						safari10: true,       // Compatibilidad Safari 10
					},
					format: {
						comments: false,      // Eliminar comentarios
					},
				},
			extractComments: false,
		}),
	],
},
};
};
