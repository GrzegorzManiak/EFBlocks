class VariableStore {
	private store: Map<string, string>;

	constructor() {
		this.store = new Map<string, string>();
	}

	set(key: string, value: string): void {
		if (typeof key !== 'string' || typeof value !== 'string') {
			throw new Error('Both key and value must be strings');
		}
		this.store.set(key, value);
	}

	get(key: string | undefined | null): string | undefined {
		if (key === undefined || key === null) return undefined;
		return this.store.get(key);
	}
}

const GlobalVariableStore = new VariableStore();

export {
	VariableStore,
	GlobalVariableStore
}