import Block, {
    Divots,
    DumpNotchesMap,
    IndicatorLine,
    Notches,
    type NotchToDivotMap,
    type SerializedBlock, type SerializedNotch
} from "./block/block";
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

    layer.removeChildren();
    Notches.clear();
    Divots.clear();

    const blocks = JSON.parse(data.blocks);
    const notches = JSON.parse(data.notches)

    const blockMap: Map<string, Block> = new Map();
    const deserializedBlocks: Array<Block> = [];
    for (const blockId in blocks) {
        const config = JSON.parse(blocks[blockId]) as SerializedBlock;
        config.id = blockId;

        const block = Block.deserialize(
            config,
            layer,
            callback
        );

        deserializedBlocks.push(block);
        block.group.draggable(true);
        blockMap.set(block.id, block);
    }

    const connections = Object.values(notches) as Array<SerializedNotch>;
    for (const connection of connections) {
        const notchBlock = blockMap.get(connection.notchBlockId);
        const divotBlock = blockMap.get(connection.divotBlockId);
        if (!notchBlock || !divotBlock) {
            console.error("Invalid notch/divot block ID");
            continue;
        }

        const notch = notchBlock.snapPoints.get(connection.notchId);
        const divot = divotBlock.snapPoints.get(connection.divotId);
        if (!notch || !divot) {
            console.error("Invalid notch/divot ID");
            continue;
        }

        notchBlock.onDragEndConnect({
            notch,
            divot,
        });
    }

    return deserializedBlocks;
}

export {
    serialize,
    deserialize
}