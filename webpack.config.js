const path = require('path');

module.exports = {
	entry: './src/index.ts', // Archivo principal del SDK
	output: {
		path: path.resolve(__dirname, 'dist'),
		filename: 'guiders-pixel.min.js', // Asegurar que el nombre es el correcto
		library: 'GuidersPixel', // Nombre de la librería
		libraryTarget: 'umd', // Compatible con CommonJS, AMD y global en navegador
		globalObject: 'this', // Para que funcione en navegadores y Node.js
		libraryExport: 'default'
	},
	resolve: {
		extensions: ['.ts', '.js']
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
