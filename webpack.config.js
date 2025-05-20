const path = require('path');
const {
	BundleAnalyzerPlugin
} = require("webpack-bundle-analyzer");
const Dotenv = require('dotenv-webpack');

module.exports = {
	plugins: [
		new Dotenv(),
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
		extensions: ['.ts', '.js'], // Extensiones de archivos a resolver
	},
	module: {
		rules: [{
			test: /\.ts$/,
			use: 'ts-loader',
			exclude: /node_modules/
		}]
	},
	mode: 'production',
	externals: {
	}
};
