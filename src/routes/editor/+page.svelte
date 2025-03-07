<script lang="ts">
    import { onMount } from 'svelte';
    import * as Blocks from "../../blocks";
    import Konva from "konva";


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
            const block = new Blocks.Block(Blocks.DefaultBlocks[i], layer);
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