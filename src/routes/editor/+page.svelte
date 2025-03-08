<script lang="ts">
    import {onMount} from 'svelte';
    import * as Blocks from "../../blocks";
    import Konva from "konva";

    import VariableDrawer from './drawer.svelte';
    import {VariableStore} from "../../blocks/executer/variable";
    import {Button} from "@/button";

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

    function downloadDefaultBlocks() {

        for (let i = 0; i < Blocks.DefaultBlocks.length; i++) {
            const block = new Blocks.Block(Blocks.DefaultBlocks[i], layer, callbacks);
            block.group.x(0);
            block.group.y(0);

            console.log(`Rendering block ${block.name}`);

            // export to png
            block.group.toImage({
                callback: function(img) {
                    // download image
                    const a = document.createElement('a');
                    a.href = img.src;
                    a.download = `block-${block.name}.png`;
                    document.body.appendChild(a);
                    a.click();
                }
            });

            // remove it
            block.group.destroy();
        }

        Blocks.clear();
    }

    let blockImages: Array<[string, string]> = $state([]);
    let imagesVisible = $state(false);
    async function renderDefaultBlocks() {
        const images = Array<[string, string]> ();
        const promises: Promise<void>[] = [];
        for (let i = 0; i < Blocks.DefaultBlocks.length; i++) {
            const block = new Blocks.Block(Blocks.DefaultBlocks[i], layer, callbacks);
            block.group.x(0);
            block.group.y(0);

            console.log(`Rendering block ${block.name}`);

            const promise: Promise<void> = new Promise((resolve, reject) => {
                block.group.toImage({
                    callback: function(img) {
                         const url = img.src;
                         images.push([block.name, url]);
                         block.group.destroy();
                         resolve();
                    }
                });
            });

            promises.push(promise);
        }

        await Promise.all(promises);
        Blocks.clear();
        return images;
    }

    function setupDraggableImages() {
        const images = document.querySelectorAll('.flex-wrap img');
        images.forEach((img, index) => {
            img.setAttribute('draggable', 'true');
            img.addEventListener('dragstart', (event) => onDragStart(event, index));
        });
    }

    // Store the dragged block info
    function onDragStart(event: DragEvent, index: number) {
        if (!event.dataTransfer) return;

        const target = event.target as HTMLImageElement;
        const blockName = target.alt;

        // Set data to be transferred
        event.dataTransfer.setData('application/json', JSON.stringify({
            blockType: blockName,
            index: index
        }));

        // Set a drag image (optional)
        event.dataTransfer.setDragImage(target, 0, 0);
        event.dataTransfer.effectAllowed = 'copy';
    }

    function onDrop(event: DragEvent) {
        event.preventDefault();

        // Get the data that was transferred
        const jsonData = event.dataTransfer?.getData('application/json');
        if (!jsonData) return;

        try {
            const data = JSON.parse(jsonData);

            // Calculate position relative to the stage
            const stage = Konva.stages[0]; // Assuming there's only one stage
            const stagePos = stage.container().getBoundingClientRect();

            const x = event.clientX - stagePos.left;
            const y = event.clientY - stagePos.top;

            // Create a new block at the drop position
            console.log(`Dropped block ${data.blockType} at ${x}, ${y}`);
            createBlockFromDrop(data.blockType, x, y);
        } catch (error) {
            console.error("Error processing drop data:", error);
        }
    }

    let lastDrop: number = 0;
    function createBlockFromDrop(blockType: string, x: number, y: number) {
        // Prevent accidental double drops
        const now = Date.now();
        if (now - lastDrop < 100) return;
        lastDrop = now;

        // Find the block definition that matches the dropped type
        const blockDef = Blocks.DefaultBlocks.find(block => block.name === blockType);
        if (!blockDef) return;

        // Create a new block
        const block = new Blocks.Block(blockDef, layer, callbacks);

        // Position the block at the drop point
        const stage = Konva.stages[0]; // Assuming there's only one stage
        const offset = stage.position();
        const scale = stage.scaleX();

        // Adjust for stage's scale and offset to get the actual position in the stage's coordinate system
        const stageX = (x - offset.x) / scale;
        const stageY = (y - offset.y) / scale;

        block.group.x(stageX);
        block.group.y(stageY);

        // Make it draggable within the Konva canvas
        block.group.draggable(true);

        // Add to your blocks collection
        allBlocks.push(block);

        // Refresh the layer
        layer.batchDraw();
    }

    function setupDropZone() {
        const container = document.getElementById('container');
        if (!container) return;

        container.addEventListener('dragover', onDragOver);
        container.addEventListener('drop', onDrop);
    }

    // Prevent default to allow drop
    function onDragOver(event: DragEvent) {
        event.preventDefault();
        event.dataTransfer!.dropEffect = 'copy';
    }

    let editorElement: HTMLDivElement;
    let layer: Konva.Layer;
    onMount(async() => {
        const stage = new Konva.Stage({
            container: editorElement,
            width: window.innerWidth,
            height: window.innerHeight,
            draggable: true,
        });

        const { layer: stageLayer, gridLayer } = Blocks.createStage(stage);
        layer = stageLayer;
        blockImages = await renderDefaultBlocks();
        imagesVisible = true;

        // let y = 0;
        // const width = 200;
        // for (let i = 0; i < Blocks.DefaultBlocks.length; i++) {
        //     const block = new Blocks.Block(Blocks.DefaultBlocks[i], layer, callbacks);
        //     block.group.x((width - block.block.width()) / 2);
        //     block.group.y(y + block.group.height());
        //     y += block.height + 50;
        //     block.group.draggable(true);
        //     allBlocks.push(block);
        // }

        layer.add(Blocks.IndicatorLine);

        setTimeout(() => {
            setupDraggableImages();
            setupDropZone();
        }, 100);
    });
</script>

<div class="absolute top-0 right-[15rem] z-10">
    <VariableDrawer
            {variableStore}
            bind:variableRest
            bind:variableData
            bind:variableDrawerOpen />

    {#if debug}
        <div class="absolute top-0 right-0 z-10 flex gap-2 flex-wrap w-full">
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
            <Button on:click={() => downloadDefaultBlocks()}>Render Default Blocks</Button>
        </div>
    {/if}
</div>

<div class="flex h-screen">
    <div class="border-r">
        <div class="p-4">
            <h1 class="text-xl font-bold">Blocks</h1>
        </div>

        <div class="p-4">
            {#if imagesVisible}
                <div class="flex flex-wrap gap-4 w-[15rem]">
                    {#each blockImages as [name, url]}
                        <div>
                            <img src={url} alt={name} />
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <div
            id="container"
            class="flex-1 bg-white"
            on:drop={onDrop}
            bind:this={editorElement}>
    </div>
</div>