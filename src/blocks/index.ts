// import Konva from 'konva';
// import * as BlockRenderer from './renderer';
// import Block, {IndicatorLine} from "./block/block";
// import {InputMode, InputType} from "./renderer/types";
// import {randomId} from "./helpers";
// import {layer} from "./stage";
// import Blocks from "./blocks";
//
// const allBlocks = []
//
// let y = 0;Error: Module function declarations have already been instantiated
// const width = 200;
//
// for (let i = 0; i < Blocks.length; i++) {
// 	const block = new Block(Blocks[i], layer);
// 	block.group.x((width - block.block.width()) / 2);
// 	block.group.y(y + block.group.height());
// 	y += block.height + 50;
// 	block.group.draggable(true);
// 	allBlocks.push(block);
// }
//
// layer.add(IndicatorLine);

export * from './renderer';
export * from './blocks';
export * from './block/block';
export * from './stage';
// export * from './executer';