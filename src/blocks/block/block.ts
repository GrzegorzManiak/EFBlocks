import * as Renderer from "../renderer";
import Konva from "konva";
import {type CreatedInput, type Input, type InputData, type SegmentAuxMap, type SegmentDefinition} from "../renderer/types";
import {getDistanceBetween} from "./helpers";
import SnapPointRecord from "./spr";
import type { CallbackDict } from "./helpers";

let activeId: string | undefined = undefined;

type SnapPointGroup = Map<string, SnapPointRecord>;
type SegmentMap = Map<string, SegmentDefinition>;

const Notches: SnapPointGroup = new Map();
const Divots: SnapPointGroup = new Map();

type DragResult = {
	notch: SnapPointRecord;
	divot: SnapPointRecord;
}

const snapRadius = 40;
const IndicatorLine = new Konva.Line({
	points: [],
	stroke: '#00000075',
	strokeWidth: 4,
	dash: [8, 5]
});

IndicatorLine.hide();

class Block {
	public readonly id: string = Math.random().toString(36).substr(2, 9);


	public isDynamic: boolean = false;
	public group: Konva.Group;
	public height: number;
	public texts: Array<Konva.Text>;
	public block: Konva.Path;
	public name: string;

	public variables: SegmentAuxMap;

	public snapPoints: SnapPointGroup;
	public segments: SegmentMap;

	public primaryNotch: SnapPointRecord | undefined;
	public primaryDivot: SnapPointRecord | undefined;

	public deepestChild: Block | undefined;

	public constructor(
		public blockDefinition: Renderer.Types.BlockDefinition,
		private layer: Konva.Layer,
		public callbacks: CallbackDict
	) {
		const [group, block, snapPoints, height, texts, variables] = Renderer.renderBlock(this.id, blockDefinition, {
			extraWidth: 0,
			addToGroup: true,
			generateCircle: true,
			addTextToGroup: true
		});

		this.group = group;
		this.block = block;
		this.height = height;
		this.texts = texts;
		this.variables = variables;
		this.name = blockDefinition.name;

		this.snapPoints = new Map();
		for (const [id, snapPoint] of snapPoints) {
			this.group.add(snapPoint.group);
			const spr = new SnapPointRecord(
				id,
				snapPoint.segmentId,
				this,
				snapPoint.group,
				snapPoint.type
			);

			spr.updateGroupPosition(
				snapPoint.position[0],
				snapPoint.position[1]
			);

			this.snapPoints.set(id, spr);
			switch (snapPoint.type) {
				case Renderer.Types.SnapPointType.SecondaryNotch:
					this.isDynamic = true;
					Notches.set(id, spr);
					break;

				case Renderer.Types.SnapPointType.PrimaryNotch:
					Notches.set(id, spr);
					this.primaryNotch = spr;
					break;

				case Renderer.Types.SnapPointType.PrimaryDivot:
					Divots.set(id, spr);
					this.primaryDivot = spr;
					break;
			}
		}

		for (const [segId, variable] of variables) {
			if (!variable.inputs) continue;
			variable.inputs.inputs.forEach(input => this.addVariableClick(input, segId));
		}

		this.segments = new Map();
		for (const segment of blockDefinition.segments) {
			this.segments.set(segment.id, segment);
		}

		this.deepestChild = this;
		this.addEventListeners();
		this.layer.add(this.group);
	}

	public addVariableClick(variable: CreatedInput, segmentId: string): void {
		variable.group.on('click', () => {
			const segment = this.segments.get(segmentId);
			if (!segment) return;

			this.callbacks.variableClick(this, segment, variable);

			// if (variable.occupied) {
			// 	variable.occupied = false;
			// 	variable.mainBody.fill(variable.originalColor);
			// 	variable.text.text(variable.name);
			// }
			//
			// else {
			// 	variable.occupied = true;
			// 	variable.mainBody.fill('rgba(255,255,255,0.71)');
			// 	variable.text.text('Occupied');
			// }
		});
	}

	public updateInput(input: CreatedInput, data: {
		displayText?: string;
		key?: string;
		occupied?: boolean;
		isConstant?: boolean;
	}) {
		data = {
			displayText: data.displayText ?? input.name,
			key: data.key ?? input.key,
			occupied: data.occupied ?? input.occupied,
			isConstant: data.isConstant ?? input.isConstant
		}

		if (data.isConstant !== input.isConstant && data.isConstant !== undefined) {
			input.isConstant = data.isConstant;
		}

		if (data.displayText !== input.name && data.displayText) {
			input.text.text(data.displayText);
			const textWidth = input.text.width();
			const mainBodyWidth = input.mainBody.width();
			input.text.x((mainBodyWidth - textWidth) / 2);
		}

		if (data.key !== input.key) {
			input.key = data.key;
		}

		data.occupied = data.occupied ?? false;
		if (data.occupied !== input.occupied) {
			input.occupied = data.occupied;
			if (data.occupied) {
				input.mainBody.fill('rgba(255,255,255,0.5)');
			} else {
				input.mainBody.fill(input.originalColor);
			}
		}
	}

	public resetInput(input: CreatedInput) {
		input.occupied = false;
		input.mainBody.fill(input.originalColor);
		input.text.text(input.name);
		const textWidth = input.text.width();
		const mainBodyWidth = input.mainBody.width();
		input.text.x((mainBodyWidth - textWidth) / 2);
		input.key = undefined;
	}

	public addEventListeners() {
		let lastDrag = 0;
		const dragRate = 100;

		let dragResult: DragResult | null = null;
		this.group.on('dragmove', () => {
			if (activeId !== undefined && activeId !== this.id) return;
			if (activeId === undefined) this.group.moveToTop();
			activeId = this.id;

			if (dragResult) {
				IndicatorLine.show();
				const globalA = dragResult.notch.getAbsolutePosition();
				const globalB = dragResult.divot.getAbsolutePosition();
				IndicatorLine.points([globalA[0], globalA[1], globalB[0], globalB[1]]);
			} else IndicatorLine.hide();

			const now = Date.now();
			if (now - lastDrag < dragRate) return;
			lastDrag = now;
			dragResult = this.onDragMove();
		});

		this.group.on('dragend', () => {
			activeId = undefined;
			IndicatorLine.hide();
			this.onDragEndDisconnect();
			if (dragResult) {
				this.onDragEndConnect(dragResult);
				dragResult = null;
			}
		});

		this.group.on('click', () => {
			// console.log('Block clicked', this);
			// const children = [];
			// let next: Block | undefined = this;
			// while (next !== undefined) {
			// 	children.push(next.name);
			// 	next = next.primaryNotch?.next?.block;
			// }
			// console.log('Children', children);
			// console.log('Deepest child', this.deepestChild?.name);
			// console.log('Absolute position', this.getAbsolutePosition());

			// console.log(generateJs(this));
		});
	}

	public onDragEndDisconnect(): void {
		const divot = this.primaryDivot;
		const notch = divot?.previous;
		if (!divot || !notch) return;

		const divotGlobal = divot.getAbsolutePosition();
		const notchGlobal = notch.getAbsolutePosition();

		const x = divotGlobal[0] - notchGlobal[0];
		const y = divotGlobal[1] - notchGlobal[1];

		if (Math.abs(x) > snapRadius || Math.abs(y) > snapRadius) {
			const divotGlobal = divot.block.getAbsolutePosition();
			divot.block.group.remove()
			divot.block.layer.add(divot.block.group);
			divot.block.group.x(divotGlobal[0]);
			divot.block.group.y(divotGlobal[1]);

			notch.setNext(undefined);
			divot.setPrevious(undefined);

			notch.block.calculateDeepestChild();
			divot.block.calculateDeepestChild();

			notch.block.adjustHeight();
			divot.block.adjustHeight();
		}

		else {
			this.group.x(this.group.x() - x);
			this.group.y(this.group.y() - y);
		}
	}

	public onDragEndConnect(dragResult: DragResult): void {
		const { notch, divot } = dragResult;

		notch.setNext(divot);
		divot.setPrevious(notch);
		notch.group.add(divot.block.group);
		IndicatorLine.hide();

		const divotGlobal = divot.getAbsolutePosition();
		const notchGlobal = notch.getAbsolutePosition();
		const x = divotGlobal[0] - notchGlobal[0];
		const y = divotGlobal[1] - notchGlobal[1];
		divot.block.group.x(divot.block.group.x() - x);
		divot.block.group.y(divot.block.group.y() - y);

		notch.block.calculateDeepestChild();
		divot.block.calculateDeepestChild();

		notch.block.adjustHeight();
		divot.block.adjustHeight();
	}

	public onDragMove(): DragResult | null {
		let closestDistance = snapRadius;
		let notch: SnapPointRecord | undefined = undefined;
		let divot: SnapPointRecord | undefined = undefined;

		const deepestNotch = this.deepestChild?.primaryNotch ?? this.deepestChild?.primaryDivot?.previous ?? this.primaryNotch;
		const deepestDivot = this.deepestChild?.primaryDivot ?? this.primaryDivot;

		if (deepestNotch) {
			const globalNotch = deepestNotch.getAbsolutePosition();
			for (const [_, snapPoint] of Divots) {
				const id = snapPoint.id;
				if (
					snapPoint.block.id === this.id ||
					id === deepestDivot?.id
				) continue;
				const distance = getDistanceBetween(globalNotch, snapPoint.getAbsolutePosition());
				if (distance < closestDistance) {
					notch = deepestNotch;
					divot = snapPoint;
					closestDistance = distance;
				}
			}
		}

		if (this.primaryDivot) {
			const globalDivot = this.primaryDivot.getAbsolutePosition();
			for (const [_, snapPoint] of Notches) {
				const distance = getDistanceBetween(globalDivot, snapPoint.getAbsolutePosition());
				if (distance < closestDistance) {
					notch = snapPoint;
					divot = this.primaryDivot;
					closestDistance = distance;
				}
			}
		}

		if (!notch || !divot) return null;
		return { notch, divot }
	}

	public reRender(): void {
		const [group, block, snapPoints, height, texts, variables] = Renderer.renderBlock(this.id, this.blockDefinition, {
			extraWidth: 0,
			addToGroup: false,
			generateCircle: false,
			addTextToGroup: true,
			group: this.group,
		});

		this.block.data(block.data());
		this.texts.forEach(text => text.destroy());
		this.texts = texts;
		this.height = height;

		for (const [id, snapPoint] of snapPoints) {
			const spr = this.snapPoints.get(id);
			if (!spr) continue;
			spr.updateGroupPosition(
				snapPoint.position[0],
				snapPoint.position[1]
			);
		}

		for (const [segId, variable] of variables) {
			const existing = this.variables.get(segId);
			if (!existing || !existing.inputs || !variable.inputs) continue;
			existing.inputs.group.x(variable.inputs.group.x());
			existing.inputs.group.y(variable.inputs.group.y());
		}

	}

	public adjustHeight(): void {
		if (!this.isDynamic) {
			if (this.primaryDivot?.previous) return this.primaryDivot.previous.block.adjustHeight();
			return;
		}

		for (const [_, snapPoint] of this.snapPoints) {
			if (snapPoint.type === Renderer.Types.SnapPointType.PrimaryDivot) continue;
			if (!snapPoint.next) {
				this.segments.get(snapPoint.segmentId)!.extraHeight = 0;
				continue;
			}

			let accumulator = 0;
			let next: SnapPointRecord | undefined = snapPoint.next;
			while (next) {
				accumulator += next.block.height;
				next = next.block.primaryNotch?.next;
			}

			this.segments.get(snapPoint.segmentId)!.extraHeight = accumulator;
		}

		this.reRender();
		if (this.primaryDivot?.previous) return this.primaryDivot.previous.block.adjustHeight();
	}

	public calculateDeepestChild(): void {
		const MAX_ITERATIONS = 100;
		let iterations = 0;
		let next: Block | undefined = this;
		let deepest: Block | undefined = this;
		while (next !== undefined) {
			deepest = next;
			next = next.primaryNotch?.next?.block;
			iterations++;
			if (iterations > MAX_ITERATIONS) {
				throw new Error('Infinite loop detected');
			}
		}
		this.deepestChild = deepest;
		if (this.primaryDivot?.previous)
			return this.primaryDivot.previous.block.calculateDeepestChild();
	}

	public getAbsolutePosition(): Renderer.Types.Point {
		const groupPosition = this.group.getAbsolutePosition(this.layer);
		return [groupPosition.x, groupPosition.y];
	}

	public transformPointToAbsolute(point: Renderer.Types.Point): Renderer.Types.Point {
		const groupPosition = this.getAbsolutePosition();
		return [point[0] + groupPosition[0], point[1] + groupPosition[1]];
	}
}

export default Block;
export {
	IndicatorLine,
	Block
}