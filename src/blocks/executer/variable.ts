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

	serialize(): Array<[string, string]> {
		return Array.from(this.store.entries())
	}

	static deserialize(serialized: Array<[string, string]>): VariableStore {
		try {
			const store = new VariableStore();
			for (const [key, value] of serialized) {
				store.set(key, value);
			}
			return store;
		} catch (e) {
			return new VariableStore();
		}
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