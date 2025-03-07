import * as Types from "./types";
import * as Helpers from "./helpers";
import Konva from "konva";

const scale = 0.75;

const blockMinimumWidth = 485 * scale;
const wallThickness = 30 * scale;

const headerMinimumHeight = 80 * scale;
const dividerMinimumHeight = 20 * scale;
const footerMinimumHeight = 30 * scale;

const notchDepth = 15 * scale;
const notchWidth = 40 * scale;
const notchLeftOffset = wallThickness;

const slotMinimumHeight = 120 * scale;

const circleRadius = 15 * scale;
const circleTextOffset = 15 * scale;
const textTopOffset = 2 * scale;
const fontSize = 25 * scale;
const font = 'Space Mono';

function createNotch(y: number, wallOffset: number, height: number): Types.Path {
	return [
		[wallOffset + notchWidth, y + height],
		[wallOffset + notchWidth, y + height + notchDepth],
		[wallOffset, y + height + notchDepth],
		[wallOffset, y + height],
	]
}

function createHeader(segment: Types.SegmentDefinition, rendererContext: Types.RendererContext, index: number): Types.SegmentReturnable {
	const height = headerMinimumHeight;
	const width = blockMinimumWidth + (rendererContext.modifier.extraWidth || 0);

	let path: Types.Path = [[wallThickness, rendererContext.currentHeight]];

	if (segment.divot) {
		path = path.concat([
			[wallThickness, rendererContext.currentHeight + notchDepth],
			[wallThickness + notchWidth, rendererContext.currentHeight + notchDepth],
			[wallThickness + notchWidth, rendererContext.currentHeight],
		]);

		const snapPointId = 'header-divot-' + index + '-' + rendererContext.id;
		rendererContext.snapPointMap.set(snapPointId, {
			globalId: snapPointId,
			type: Types.SnapPointType.PrimaryDivot,
			segment: segment.type,
			position: [wallThickness + notchWidth / 2, rendererContext.currentHeight + notchDepth],
			segmentId: segment.id,
			group: new Konva.Group()
		});
	}

	path = path.concat([
		[width, rendererContext.currentHeight],
		[width, rendererContext.currentHeight + height],
	])

	if (segment.notch) {
		const wallOffset = rendererContext.totalSegments === 1 ? wallThickness : wallThickness + notchLeftOffset;
		path = path.concat(createNotch(rendererContext.currentHeight, wallOffset, height));

		const snapPointId = 'header-notch-' + index + '-' + rendererContext.id;
		rendererContext.snapPointMap.set(snapPointId, {
			globalId: snapPointId,
			type: rendererContext.totalSegments === 1 ? Types.SnapPointType.PrimaryNotch : Types.SnapPointType.SecondaryNotch,
			segment: segment.type,
			position: [wallOffset + notchWidth / 2, rendererContext.currentHeight + height + notchDepth],
			segmentId: segment.id,
			group: new Konva.Group()
		});
	}

	path.push([wallThickness, rendererContext.currentHeight + height]);

	return {
		path: Helpers.pathToString(path),
		newY: rendererContext.currentHeight + height
	}
}

function createFooter(segment: Types.SegmentDefinition, rendererContext: Types.RendererContext, index: number): Types.SegmentReturnable {
	const height = segment.text !== undefined ? headerMinimumHeight : footerMinimumHeight;
	const width = blockMinimumWidth + (rendererContext.modifier.extraWidth || 0);

	let path: Types.Path = [
		[wallThickness, rendererContext.currentHeight]
	];

	if (segment.divot) {
		path = path.concat([
			[wallThickness, rendererContext.currentHeight + notchDepth],
			[wallThickness + notchWidth, rendererContext.currentHeight + notchDepth],
			[wallThickness + notchWidth, rendererContext.currentHeight],
		]);

		const snapPointId = 'footer-divot' + index + '-' + rendererContext.id;
		rendererContext.snapPointMap.set(snapPointId, {
			globalId: snapPointId,
			type: Types.SnapPointType.PrimaryDivot,
			segment: segment.type,
			position: [wallThickness + notchWidth / 2, rendererContext.currentHeight + notchDepth],
			segmentId: segment.id,
			group: new Konva.Group()
		});
	}

	path = path.concat([
		[width, rendererContext.currentHeight],
		[width, rendererContext.currentHeight + height],
	])

	if (segment.notch) {
		path = path.concat(createNotch(rendererContext.currentHeight, wallThickness, height));

		const snapPointId = 'footer-notch' + index + '-' + rendererContext.id;
		rendererContext.snapPointMap.set(snapPointId, {
			globalId: snapPointId,
			type: Types.SnapPointType.PrimaryNotch,
			segment: segment.type,
			position: [wallThickness + notchWidth / 2, rendererContext.currentHeight + height + notchDepth],
			segmentId: segment.id,
			group: new Konva.Group()
		});
	}

	return {
		path: Helpers.pathToString(path),
		newY: rendererContext.currentHeight + height
	}
}

function createDivider(segment: Types.SegmentDefinition, rendererContext: Types.RendererContext, index: number): Types.SegmentReturnable {
	const height = segment.text !== undefined ? headerMinimumHeight : dividerMinimumHeight;
	const width = blockMinimumWidth + (rendererContext.modifier.extraWidth || 0);

	if (!segment.notch) return {
		path: Helpers.pathToString([
			[wallThickness, rendererContext.currentHeight],
			[width, rendererContext.currentHeight],
			[width, rendererContext.currentHeight + height],
		]),
		newY: rendererContext.currentHeight + height
	}

	const snapPointId = 'divider-notch-' + index + '-' + rendererContext.id;
	rendererContext.snapPointMap.set(snapPointId, {
		globalId: snapPointId,
		type: Types.SnapPointType.SecondaryNotch,
		segment: segment.type,
		position: [wallThickness + notchLeftOffset + notchWidth / 2, rendererContext.currentHeight + height + notchDepth],
		segmentId: segment.id,
		group: new Konva.Group()
	});

	return {
		path: Helpers.pathToString([
			[wallThickness, rendererContext.currentHeight],
			[width, rendererContext.currentHeight],
			[width, rendererContext.currentHeight + height],
			[wallThickness + notchLeftOffset + notchWidth, rendererContext.currentHeight + height],
			[wallThickness + notchLeftOffset + notchWidth, rendererContext.currentHeight + height + notchDepth],
			[wallThickness + notchLeftOffset, rendererContext.currentHeight + height + notchDepth],
			[wallThickness + notchLeftOffset, rendererContext.currentHeight + height],
		]),
		newY: rendererContext.currentHeight + height
	}
}

function createSegment(segment: Types.SegmentDefinition, rendererContext: Types.RendererContext, index: number): Types.SegmentReturnable {
	switch (segment.type) {
		case Types.BlockSegment.Header:
			return createHeader(segment, rendererContext, index);
		case Types.BlockSegment.Footer:
			return createFooter(segment, rendererContext, index);
		case Types.BlockSegment.Divider:
			return createDivider(segment, rendererContext, index);
	}
}

export {
	blockMinimumWidth,
	circleTextOffset,
	textTopOffset,
	fontSize,
	wallThickness,
	circleRadius,
	headerMinimumHeight,
	dividerMinimumHeight,
	notchLeftOffset,
	slotMinimumHeight,
	notchWidth,
	font,

	createHeader,
	createFooter,
	createDivider,
	createNotch,
	createSegment
}