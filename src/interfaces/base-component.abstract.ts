import { ComponentPort } from "./component.interface";

export abstract class BaseComponent implements ComponentPort {
	protected container: HTMLElement | string;

	constructor(props: {
		container: HTMLElement | string;
	}) {
		this.container = props.container;
		this.mount(this.container);
	}

	mount(container: HTMLElement | string): void {
		if (typeof container === "string") {
			const element = document.querySelector(container);
			if (!element) {
				throw new Error(`Element with selector ${container} not found.`);
			}
			this.container = element as HTMLElement;
		} else {
			this.container = container;
		}
	}

	abstract render(): void;
	abstract attachEvents(): void;
	abstract updateProps(props: Record<string, any>): void;
	abstract destroy(): void;
}