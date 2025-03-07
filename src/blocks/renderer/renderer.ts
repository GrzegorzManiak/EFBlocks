import Konva from "konva";
import * as Types from "./types";
import * as Helpers from "./helpers";
import * as Segments from "./segments";
import {createInput, initialVariableSpacing, variableSpacing} from "./inputs";
import {blockMinimumWidth} from "./segments";

function renderBlock(id: string, data: Types.BlockDefinition, modifier: Types.RendererModifier): [Konva.Group, Konva.Path, Map<string, Types.SnapPoint>, number, Array<Konva.Text>, Types.SegmentAuxMap] {
	const blockGroup = modifier.group || new Konva.Group();
	const snapPointMap: Map<string, Types.SnapPoint> = new Map();
	const totalSegments = data.segments.length;
	const texts: Array<Konva.Text> = [];
	const segmentAuxMap: Types.SegmentAuxMap = new Map();

	let path: string = 'M';
	let currentHeight: number = 0;

	const color = data.configuration.color;
	const outlineColor = Helpers.darkenColor(data.configuration.color, 0.8);
	const fillColor = Helpers.darkenColor(data.configuration.color, 0.96);

	const renderContext: Types.RendererContext = {
		fillColor,
		outlineColor,
		snapPointMap,
		totalSegments,
		color,
		currentHeight,
		modifier,
		id,
		textWidth: 0
	};

	for (let i = 0; i < data.segments.length; i++) {
		const auxSegment = data.segments[i];
		renderContext.currentHeight = currentHeight;
		let textWidth = 0;
		let text: Konva.Text | undefined = undefined;

		if (auxSegment.text !== undefined) {
			text = Helpers.createText(auxSegment.text);

			if (
				auxSegment.type === Types.BlockSegment.Header ||
				(auxSegment.type === Types.BlockSegment.Footer && data.segments.length === 1)
			) text.x(currentHeight + Segments.wallThickness * 2 + Segments.circleTextOffset);
			else text.x(Segments.wallThickness + Segments.circleTextOffset);
			if (modifier.addTextToGroup) blockGroup.add(text);

			texts.push(text);
			textWidth = text.width();
		}

		const segment = data.segments[i];
		const inputGroup = new Konva.Group();
		const inputs: Array<Types.CreatedInput> = [];
		let currentWidth = 0;
		for (let j = 0; j < (segment.inputs ?? []).length; j++) {
			const input = segment.inputs![j];
			const [group, width, inputText, inputShape] = createInput(renderContext, input, j, currentWidth);
			if (!group) continue;
			inputGroup.add(group);
			currentWidth += width;
			inputs.push({
				...input,
				group,
				text: inputText,
				mainBody: inputShape,
				occupied: false,
				isConstant: false,
				originalColor: inputShape.fill().toString()
			})
		}

		if (modifier.addToGroup) blockGroup.add(inputGroup);

		let x = 0;
		if (segment.type === Types.BlockSegment.Header || (segment.type === Types.BlockSegment.Footer && data.segments.length === 1))
			x = Segments.wallThickness + Segments.circleRadius * 2 + Segments.circleTextOffset + textWidth + initialVariableSpacing;
		else x = Segments.wallThickness + Segments.circleTextOffset + textWidth + initialVariableSpacing;

		segmentAuxMap.set(segment.id, {
			text: text,
			inputs: inputGroup !== undefined ? {
				inputs,
				inputWidth: currentWidth,
				group: inputGroup,
				segmentName: segment.name
			} : undefined
		})

		const textAndInputWidth = currentWidth + x;
		if (textAndInputWidth > blockMinimumWidth && textAndInputWidth - blockMinimumWidth > modifier.extraWidth )
			modifier.extraWidth = textAndInputWidth - blockMinimumWidth;
	}

	const width = blockMinimumWidth + modifier.extraWidth;

	for (let i = 0; i < data.segments.length; i++) {
		const segment = data.segments[i];
		renderContext.currentHeight = currentHeight;

		const segmentData = Segments.createSegment(segment, renderContext, i);
		const auxSegment = segmentAuxMap.get(segment.id);
		if (auxSegment?.text) auxSegment.text.y(currentHeight + Segments.headerMinimumHeight / 2 - Segments.fontSize / 2 + Segments.textTopOffset);
		if (auxSegment?.inputs) {
			auxSegment.inputs.group.y(currentHeight);
			auxSegment.inputs.group.x(width - auxSegment.inputs.inputWidth);
		}

		currentHeight = segmentData.newY;
		path += ' ' + segmentData.path;

		if (data.segments.length !== 1 && i !== data.segments.length - 1) {
			const wallData = Helpers.createRightWall(segment, currentHeight);
			currentHeight = wallData.newY;
			path += ' ' + wallData.path;
		}
	}

	path += ' ' + Helpers.createLeftWall(currentHeight).path;
	const block = new Konva.Path({
		data: path,
		fill: color,
		stroke: outlineColor,
		strokeWidth: 1,
		closed: false
	});

	if (modifier.addToGroup) {
		if (modifier.generateCircle) blockGroup.add(Helpers.createCircle(renderContext));
		blockGroup.add(block);
		blockGroup.children.map(child => child.moveToBottom());
	}

	return [blockGroup, block, snapPointMap, currentHeight, texts, segmentAuxMap];
}

export {
	renderBlock
}