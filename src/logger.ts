interface ILogger {
	context?: string;
	log(message: string): void;
	debug(message: string): void;
}

class Logger implements ILogger {
	context?: string;

	constructor( context?: string ) {
		this.context = context;
	}

	log(message: string): void {
		console.log( `Log[${this.context}]: ${message}` );
	}
	debug(message: string): void {
		console.debug( `Debug[${this.context}]: ${message}` );
	}
}

export { ILogger, Logger };