import Block, {Divots, DumpNotchesMap, Notches, type SerializedBlock} from "./block/block";
import type {CallbackDict} from "./block/helpers";
import Konva from "konva";

function serialize(blocks: Array<Block>) {
    const dumpedMap = DumpNotchesMap();
    const serializedMap: Record<string, any> = {};
    for (const block of dumpedMap) serializedMap[block[0]] = block[1];
    const serializedMapString = JSON.stringify(serializedMap);

    const serializedBlocks: Record<string, string> = {};
    for (const block of blocks) serializedBlocks[block.id] = JSON.stringify(block.serialize());
    const serializedBlocksString = JSON.stringify(serializedBlocks);

    return JSON.stringify({
        blocks: serializedBlocksString,
        notches: serializedMapString
    });
}

function deserialize(serialized: string, layer: Konva.Layer, callback: CallbackDict) {
    const data = JSON.parse(serialized);

    Notches.clear();
    Divots.clear();

    const blocks = JSON.parse(data.blocks);
    const notches = JSON.parse(data.notches);

    const deserializedBlocks: Array<Block> = [];
    for (const blockId in blocks) {
        console.log(typeof blocks[blockId])
        const config = JSON.parse(blocks[blockId]) as SerializedBlock;
        const block = Block.deserialize(
            config,
            layer,
            callback
        );
        deserializedBlocks.push(block);
        block.group.draggable(true);
    }

    return deserializedBlocks;
}

export {
    serialize,
    deserialize
}