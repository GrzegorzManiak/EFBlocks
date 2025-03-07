<script lang="ts">
    import { onMount } from 'svelte';
    import * as Blocks from "../../blocks";
    import Konva from "konva";

    const debug = true;

    let variableDrawerOpen = false;
    let variableData: {
        segment: Blocks.Types.SegmentDefinition,
        block: Blocks.Block,
        input:  Blocks.Types.CreatedInput,
    } | null;


    const callbacks: Blocks.CallbackDict = {
        variableClick(block, segment, input) {
            console.log("Variable clicked", block, segment, input);
            variableData = { block, segment, input };
            variableDrawerOpen = true;
        },
    }

    let editorElement: HTMLDivElement;
    onMount(() => {
        const stage = new Konva.Stage({
            container: editorElement,
            width: window.innerWidth,
            height: window.innerHeight,
            draggable: true,
        });

        const { layer, gridLayer } = Blocks.createStage(stage);

        const allBlocks = []
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

<div id="container" style="height: 100vh; width: 100vw;" bind:this={editorElement}>
</div>