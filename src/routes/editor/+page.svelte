<script lang="ts">
    import { onMount } from 'svelte';
    import * as Blocks from "../../blocks";
    import Konva from "konva";

    import VariableDrawer from './drawer.svelte';
    import {VariableStore} from "../../blocks/executer/variable";
    import {Button} from "@/button";
    import blocks from "../../blocks/blocks";

    const variableStore = new VariableStore();
    const debug = true;

    let variableDrawerOpen = $state(false);
    let variableRest = $state((constantText: string, referenceText: string) => {});
    let variableData: {
        segment: Blocks.Types.SegmentDefinition,
        block: Blocks.Block,
        input: Blocks.Renderer.Inputs.CreatedInput,
    } | null = $state(null);


    const callbacks: Blocks.CallbackDict = {
        variableClick(block, segment, input) {
            console.log("Variable clicked", block, segment, input);
            variableData = { block, segment, input };
            variableDrawerOpen = true;

            if (input.isConstant) {
                variableRest(input.text.text(), "");
            } else {
                variableRest("", input.key || "");
            }
        },
    }

    let allBlocks: Blocks.Block[] = [];
    function findRootBlocks(blocks: Blocks.Block[]): Blocks.Block[] {
        const rootBlocks = [];
        for (const b of blocks) {
            if (!b.primaryDivot || !b.primaryDivot?.previous) {
                rootBlocks.push(b);
            }
        }
        return rootBlocks;
    }

    function findInputBlocks(blocks: Blocks.Block[]): Blocks.Block[] {
        const rootBlocks = [];
        for (const b of blocks) {
            if (!b.primaryDivot) {
                rootBlocks.push(b);
            }
        }
        return rootBlocks;
    }

    function generateInputBlockCode(blocks: Blocks.Block[]) {
        const rootBlocks = findInputBlocks(blocks);
        const code = [];
        for (const b of rootBlocks) {
            code.push(Blocks.generateJs(b));
        }
        return code
    }

    function serializeBlocks(blocks: Blocks.Block[]): string {
        return Blocks.serialize(blocks);
    }

    function deserializeBlocks(data: string): Blocks.Block[] {
        allBlocks.forEach(b => b.group.destroy());
        const newBlocks = Blocks.deserialize(data, layer, callbacks);
        allBlocks = newBlocks;
        return newBlocks;
    }

    function dumpSortedBlockIds(blocks: Blocks.Block[]) {
        const ids = []
        for (const b of blocks) {
            ids.push(b.id);
        }
        console.log(ids.sort());
    }

    let editorElement: HTMLDivElement;
    let layer: Konva.Layer;
    onMount(() => {
        const stage = new Konva.Stage({
            container: editorElement,
            width: window.innerWidth,
            height: window.innerHeight,
            draggable: true,
        });

        const { layer: stageLayer, gridLayer } = Blocks.createStage(stage);

        layer = stageLayer;
        let y = 0;
        const width = 200;

        for (let i = 0; i < Blocks.DefaultBlocks.length; i++) {
            const block = new Blocks.Block(Blocks.DefaultBlocks[i], layer, callbacks);
            block.group.x((width - block.block.width()) / 2);
            block.group.y(y + block.group.height());
            y += block.height + 50;
            block.group.draggable(true);
            allBlocks.push(block);
        }

        layer.add(Blocks.IndicatorLine);
    });
</script>

<div class="absolute top-0 left-0 z-10">
    <VariableDrawer
            {variableStore}
            bind:variableRest
            bind:variableData
            bind:variableDrawerOpen />

    {#if debug}
        <div class="absolute top-0 left-0 z-10 flex gap-2 flex-wrap w-full">
            <Button on:click={() => console.log(findRootBlocks(allBlocks))}>Dump Root Blocks</Button>
            <Button on:click={() => console.log(serializeBlocks(allBlocks))}>Serialize Blocks</Button>
            <Button on:click={() => console.log(deserializeBlocks(serializeBlocks(allBlocks)))}>Deserialize Blocks</Button>
            <Button on:click={() => dumpSortedBlockIds(allBlocks)}>Dump Sorted Block Ids</Button>
            <Button on:click={() => console.log(findRootBlocks(allBlocks))}>Dump Root Blocks</Button>
            <Button on:click={() => console.log(findInputBlocks(allBlocks))}>Dump Input Blocks</Button>
            <Button on:click={() => {
                const code = generateInputBlockCode(allBlocks);
                code.forEach(c => console.log(c));
            }}>Generate Input Block Code</Button>
        </div>
    {/if}
</div>

<div
        id="container"
        class="w-screen h-screen bg-white"
        bind:this={editorElement}>
</div>