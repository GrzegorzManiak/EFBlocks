import Konva from "konva";
import * as Renderer from "../renderer";
import Block from "./block";

export class SnapPointRecord {
	public id: string;
	public segmentId: string;
	public block: Block;
	public group: Konva.Group;
	public type: Renderer.Types.SnapPointType;

	public previous: SnapPointRecord | undefined;
	public next: SnapPointRecord | undefined;

	public constructor(id: string, segmentId: string, block: Block, group: Konva.Group, type: Renderer.Types.SnapPointType) {
		this.id = id;
		this.block = block;
		this.group = group;
		this.type = type;
		this.segmentId = segmentId;
	}

	public updateGroupPosition(x: number, y: number): void {
		this.group.x(x);
		this.group.y(y);
	}

	public setPrevious(previous: SnapPointRecord | undefined): void {
		this.previous = previous;
	}

	public setNext(next: SnapPointRecord | undefined): void {
		this.next = next;
	}

	public point(): Renderer.Types.Point {
		return [this.group.x(), this.group.y()];
	}

	public getAbsolutePosition(): Renderer.Types.Point {
		return this.block.transformPointToAbsolute(this.point());
	}
}

export default SnapPointRecord;