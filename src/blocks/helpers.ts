function randomId() {
	return Math.random().toString(36).substr(2, 9);
}

export {
	randomId
}