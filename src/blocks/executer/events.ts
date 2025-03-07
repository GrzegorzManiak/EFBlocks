class EventEmitter {
	private eventsStore: Map<string, Array<Function>> = new Map();

	// Logs when an event handler is registered.
	on(event: string, func: Function): void {
		if (!this.eventsStore.has(event)) {
			this.eventsStore.set(event, []);
		}
		this.eventsStore.get(event)!.push(func);
	}

	// Emits the event and passes any provided arguments to the listeners.
	emit(event: string, ...args: any[]): void {
		if (!this.eventsStore.has(event)) return;
		const listeners = this.eventsStore.get(event)!;
		for (const handler of listeners) {
			handler(...args);
		}
	}
}

let GlobalEventEmitter: EventEmitter = new EventEmitter();

export {
	GlobalEventEmitter,
	EventEmitter
}