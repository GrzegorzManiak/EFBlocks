import * as Renderer from "../renderer";

function getDistanceBetween(a: Renderer.Types.Point, b: Renderer.Types.Point): number {
	return Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
}

export {
	getDistanceBetween
}