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

	serialize(): string {
		return JSON.stringify(Array.from(this.store.entries()));
	}

	static deserialize(serialized: string): VariableStore {
		const entries = JSON.parse(serialized) as Array<[string, string]>;
		const store = new VariableStore();
		for (const [key, value] of entries) {
			store.set(key, value);
		}
		return store;
	}

	clear(): void {
		this.store.clear();
	}
}

const GlobalVariableStore = new VariableStore();

export {
	VariableStore,
	GlobalVariableStore
}