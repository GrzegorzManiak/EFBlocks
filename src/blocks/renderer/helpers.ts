import {type Path, type SegmentDefinition} from "./types";
import Konva from "konva";
import * as Types from "./types";
import {
	circleRadius,
	font,
	fontSize,
	headerMinimumHeight,
	notchLeftOffset,
	notchWidth,
	slotMinimumHeight,
	wallThickness
} from "./segments";

function pathToString(path: Path): string {
	return path.map(([x, y]) => `${x},${y}`).join(' ');
}

function darkenColor(color: string, factor: number = 0.9): string {
	if (color[0] === '#') color = color.slice(1);
	const num = parseInt(color, 16);
	const r = (num >> 16) * factor;
	const b = ((num >> 8) & 0x00FF) * factor;
	const g = (num & 0x0000FF) * factor;
	return `#${Math.round(r).toString(16)}${Math.round(b).toString(16)}${Math.round(g).toString(16)}`;
}

function createText(text: string): Konva.Text {
	return new Konva.Text({
		text,
		fontSize,
		fill: 'black',
		fontFamily: font,
	});
}

function createCircle(rendererContext: Types.RendererContext) {
	const x = wallThickness + notchWidth / 2;
	const y = headerMinimumHeight / 2;
	return new Konva.Circle({
		x, y,
		radius: circleRadius,
		fill: rendererContext.fillColor,
		stroke: rendererContext.outlineColor,
		strokeWidth: 1
	});
}

function createRightWall(segment: SegmentDefinition, y: number): Types.SegmentReturnable {
	const height = slotMinimumHeight + (segment.extraHeight || 0);
	const width = wallThickness;

	return {
		path: pathToString([
			[width, y],
			[width, y + height],
		]),
		newY: y + height
	}
}

function createLeftWall(y: number): Types.SegmentReturnable {
	const height = y;
	const width = wallThickness;

	return {
		path: pathToString([
			[0, height],
			[0, 0],
			[width, 0],
		]),
		newY: y
	}
}

export {
	createText,
	createCircle,
	createRightWall,
	createLeftWall,
	pathToString,
	darkenColor
}