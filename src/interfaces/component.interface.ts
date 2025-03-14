/**
 * Interface representing a component port.
 */
export interface ComponentPort {
	/**
	 * Initializes the component in a container.
	 */

	/**
	 * Initializes the component in a container.
	 * @param container - The container element or its selector where the component will be mounted.
	 */
	mount(container: HTMLElement | string): void;

	/**
	 * Renders the HTML inside the container.
	 */
	render(): void;

	/**
	 * Attaches events to the component.
	 */
	attachEvents(): void;

	/**
	 * Updates any property of the component.
	 * @param props - An object containing the properties to update.
	 */
	updateProps(props: Record<string, any>): void;

	/**
	 * Cleans the component from the DOM and removes events.
	 */
	destroy(): void;
}