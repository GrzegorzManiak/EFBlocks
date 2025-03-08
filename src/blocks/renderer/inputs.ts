import * as Types from "./types";
import Konva from "konva";
import {font, headerMinimumHeight} from "./segments";
import {type Input, InputMode, InputType} from "./types";

const variableMinimumHeight = headerMinimumHeight * 0.85;
const yPos = (headerMinimumHeight - variableMinimumHeight) / 2;
const variableMinimumWidth = 120;
const evalMinimumWidth = 60;
const variableSpacing = 5;
const initialVariableSpacing = 40;
const fontSize = 14;

function clearAllEventListeners(group: Konva.Group) {
	group.off('mouseenter');
	group.off('mouseleave');
	group.off('mousedown');
	group.off('mouseup');
}

function createVariableInput(rendererContext: Types.RendererContext, input: Types.Input, index: number, currentWidth: number): [Konva.Group, number, Konva.Text, Konva.Shape]  {
	const height = variableMinimumHeight;
    const rectWidth = variableMinimumWidth + (input.extraWidth || 0);

	const group = new Konva.Group();
	const rect = new Konva.Rect({
		x: 0,
		y: 0,
		width: rectWidth,
		height,
		fill: rendererContext.fillColor,
		stroke: rendererContext.outlineColor,
		strokeWidth: 1
	});

	const text = new Konva.Text({
		text: input.name,
		fontSize,
		fill: 'rgba(0,0,0,0.3)',
		fontFamily: font,
		ellipsis: true,
		wrap: 'none',
		width: rectWidth * 0.95
	});

	// make it so that the text can spill


	const textX = (rectWidth / 2) - (text.width() / 2);
	const textY = (height - fontSize) / 2;

	text.x(textX);
	text.y(textY);

	group.x(currentWidth);
	group.y(yPos);

	group.add(rect);
	group.add(text);

	clearAllEventListeners(group);
	return [group, rectWidth + variableSpacing, text, rect];
}

function createEvalInput(rendererContext: Types.RendererContext, input: Types.Input, index: number, currentWidth: number): [Konva.Group, number, Konva.Text, Konva.Shape]  {
	const height = variableMinimumHeight;
	const rectWidth = evalMinimumWidth + (input.extraWidth || 0);

	const group = new Konva.Group();
	const diamond = new Konva.RegularPolygon({
		x: 0,
		y: 0,
		sides: 4,
		radius: evalMinimumWidth / 2,
		fill: rendererContext.fillColor,
		stroke: rendererContext.outlineColor,
		strokeWidth: 1
	});


	const text = new Konva.Text({
		text: input.name,
		fontSize,
		fill: 'rgba(0,0,0,0.3)',
		fontFamily: font,
		ellipsis: true,
		wrap: 'none',
		width: evalMinimumWidth * 0.95
	});

	const textX = (evalMinimumWidth / 2) - (text.width() / 2);
	const textY = (height - fontSize) / 2;

	text.x(textX);
	text.y(textY);

	diamond.x(evalMinimumWidth / 2);
	diamond.y(height / 2);

	diamond.scale({ x: 1.15, y: height / evalMinimumWidth });

	group.x(currentWidth + variableSpacing);
	group.y(yPos);

	group.add(diamond);
	group.add(text);

	clearAllEventListeners(group);
	return [group, rectWidth + variableSpacing + variableSpacing + variableSpacing, text, diamond];
}

function createInput(rendererContext: Types.RendererContext, input: Types.Input, index: number, currentWidth: number): [Konva.Group, number, Konva.Text, Konva.Shape] {
	switch (input.type) {
		case Types.InputType.Variable:
			return createVariableInput(rendererContext, input, index, currentWidth);

		case Types.InputType.EvalOperator:
			return createEvalInput(rendererContext, input, index, currentWidth);
	}
}

class CreatedInput {
	group: Konva.Group;
	mainBody: Konva.Shape;
	text: Konva.Text;
	occupied: boolean;
	originalColor: string;
	isConstant: boolean;
	id: string;
	internalName: string;
	type: InputType;
	name: string;
	extraWidth?: number;
	mode: InputMode;
	key?: string;

	constructor(input: Input, group: Konva.Group, mainBody: Konva.Shape, text: Konva.Text, occupied: boolean, originalColor: string, isConstant: boolean) {
		this.id = input.id;
		this.internalName = input.internalName;
		this.type = input.type;
		this.name = input.name;
		this.extraWidth = input.extraWidth;
		this.mode = input.mode;
		this.key = input.key;

		this.group = group;
		this.mainBody = mainBody;
		this.text = text;
		this.occupied = occupied;
		this.originalColor = originalColor;
		this.isConstant = isConstant;
	}
}


export {
	initialVariableSpacing,
	variableSpacing,
	createInput,
	CreatedInput
}