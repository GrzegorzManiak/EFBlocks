<script lang="ts">
    import { onMount } from 'svelte';
    import * as Blocks from "../../blocks";
    import Konva from "konva";

    import VariableDrawer from './drawer.svelte';
    import {VariableStore} from "../../blocks/executer/variable";

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

<div class="absolute top-0 left-0 z-10">
    <VariableDrawer
            {variableStore}
            bind:variableRest
            bind:variableData
            bind:variableDrawerOpen />
</div>

<div
        id="container"
        class="w-screen h-screen bg-white"
        bind:this={editorElement}>
</div>