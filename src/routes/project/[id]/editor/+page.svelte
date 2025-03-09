<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import * as Blocks from "../../../../blocks";
    import {IndicatorLine} from "../../../../blocks";
    import Konva from "konva";

    import VariableDrawer from './drawer.svelte';
    import PageSelector from './page.svelte';
    import Call from './call.svelte';

    import {VariableStore} from "../../../../blocks/executer/variable";
    import {Button} from "@/button";
    import * as AlertDialog from "@/alert-dialog";
    import {LoaderCircle, Save, Trash, Trash2} from "lucide-svelte";
    import {toast} from "svelte-sonner";

    const api = 'http://127.0.0.1:3000/';

    let variableStore = $state(new VariableStore());
    const debug = true;

    function getProjectIdFromUrl(url: string): string | null {
        const match = url.match(/\/project\/([^\/]+)\/editor/);
        return match ? match[1] : null;
    }

    let projectId = '';

    let variableDrawerOpen = $state(false);
    let variableRest = $state((constantText: string, referenceText: string) => {});
    let variableData: {
        segment: Blocks.Types.SegmentDefinition,
        block: Blocks.Block,
        input: Blocks.Renderer.Inputs.CreatedInput,
    } | null = $state(null);

    let currentPage: string = $state("Main");
    let allPages: string[] = $state(["Main"]);

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
            // @ts-ignore
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

    function randomNumber(min: number, max: number) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    async function sleep(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    let agentRunning = $state(false);
    let agentButtonText = $state("Run Agent");
    let loading = $state(false);
    async function checkServer() {
        while (agentRunning) {
            await sleep(500);
            try {
                const request = await fetch(`${api}highlight?projectId=${projectId}`);
                const data = await request.json();
                if (!data.running) {
                    agentRunning = false;
                    loading = false;
                    agentButtonText = "Run Agent";
                    toast.success("Agent stopped");
                }

                console.log("Agent status:", data);
            }

            catch (error) {
                console.error("Failed to check agent status:", error);
                toast.error("Failed to check agent status");
            }
        }
    }

    async function runAgent() {
        loading = true;

        if (agentRunning) {
            agentButtonText = "Stopping...";
            await sleep(randomNumber(200, 700));

            const request = await fetch(`${api}stop?projectId=${projectId}`, {
                method: 'POST',
            });

            agentButtonText = "Run Agent";
            agentRunning = false;
            loading = false;
            return;
        }

        const fool = async () => {
            agentButtonText = "Saving...";
            agentButtonText = "Running...";
            await sleep(randomNumber(200, 700));
            agentButtonText = "Generating Code...";
            await sleep(randomNumber(200, 700));
            agentButtonText = "Uploading Code...";
            await sleep(randomNumber(200, 700));
            agentButtonText = "Running Code...";
            await sleep(randomNumber(200, 700));
            agentButtonText = "Stop Agent";
        }

        const foolAsync = fool();
        await saveProject();
        try {
            const request = await fetch(`${api}run?projectId=${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: window.localStorage.getItem(`project-${projectId}`) ?? ""
            });
        } catch (error) {
            console.error("Failed to run agent:", error);
            toast.error("Failed to run agent");
            agentRunning = false;
            loading = false;
            agentButtonText = "Run Agent";
            return;
        }

        await foolAsync;
        agentRunning = true;
        checkServer();
        loading = false;
    }

    let pageData: Map<string, string> = new Map();
    let pageCode: Map<string, Array<string>> = new Map();
    let pageChangeLock = false;

    function pageChange(from: string, to: string, skifFrom = false) {
        if (!layer) return console.warn("Layer not initialized");

        if (!skifFrom) {
            if (pageChangeLock) return;
            pageChangeLock = true;

            console.log("Changing page from", from, "to", to);
            pageData.set(from, serializeBlocks(allBlocks));
            pageCode.set(from, generateInputBlockCode(allBlocks));
        }

        layer.destroyChildren();
        allBlocks = [];
        Blocks.clear();

        if (pageData.has(to)) {
            console.log("Loading page data for", to);
            const data = pageData.get(to);
            if (!data) {
                pageChangeLock = false;
                layer.add(IndicatorLine);
                return console.warn("No data found for page", to);
            }
            deserializeBlocks(data);
        }

        layer.add(IndicatorLine);
        layer.batchDraw();
        pageChangeLock = false;
    }

    function marshalProject(name: string): Blocks.Project {
        // -- save the current page
        pageData.set(currentPage, serializeBlocks(allBlocks));
        pageCode.set(currentPage, generateInputBlockCode(allBlocks));
        if (allPages.indexOf(currentPage) === -1) allPages.push(currentPage);

        const pages: Array<Blocks.Page> = [];
        for (const [name, data] of pageData) {
            const code = pageCode.get(name) ?? [];
            pages.push({
                name,
                serialised: data,
                code
            });
        }

        const lastModified = new Date().toISOString();
        return {
            id: projectId,
            name: name,
            lastModified: lastModified,
            pages,
            currentPage,
            variableStore
        };
    }

    function serializeProject(project: Blocks.Project): string {
        const serialised = Blocks.SerializeProject(project);
        window.localStorage.setItem(`project-${projectId}`, serialised);
        return serialised;
    }

    function deserializeProject(data: string): Blocks.Project {
        return Blocks.DeserializeProject(data);
    }

    function attemptLoadProject() {

        const data = window.localStorage.getItem(`project-${projectId}`);
        if (!data) return console.warn("No project data found for", projectId);

        const project = deserializeProject(data);
        if (!project) return console.warn("Failed to deserialize project data");

        layer.destroyChildren();
        allBlocks = [];
        Blocks.clear();
        layer.add(IndicatorLine);

        currentPage = project.currentPage;
        allPages = project.pages.map(p => p.name);
        pageData = new Map(project.pages.map(p => [p.name, p.serialised]));
        pageCode = new Map(project.pages.map(p => [p.name, p.code]));

        variableStore.clear();
        variableStore = project.variableStore;

        pageChangeLock = false;
        projectName = project.name;
        pageChange("", currentPage, true);
    }

    function deletePage(page: string) {
        if (allPages.length === 1) return toast.error("Cannot delete the last page");
        allPages = allPages.filter(p => p !== page);
        pageData.delete(page);
        pageCode.delete(page);
        if (currentPage === page) currentPage = "Main";
        pageChange("", currentPage, true);
        toast.success(`Deleted page ${page}`);
    }

    let saving = $state(false);
    async function saveProject() {
        if (saving) return;
        saving = true;
        await sleep(randomNumber(200, 700));
        const project = marshalProject(projectName);
        serializeProject(project);
        toast.success("Project saved");
        saving = false;
    }

    let projectName: string = $state("");
    let editorElement: HTMLDivElement;
    let layer: Konva.Layer;
    let save_proj: number;
    onMount(async() => {
        projectId = getProjectIdFromUrl(window.location.href) ?? "";
        if (!projectId) throw new Error(`Could not find project ID in URL: ${window.location.href}`);
        console.log("Project ID:", projectId);

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
        attemptLoadProject();

        setTimeout(() => {
            setupDraggableImages();
            setupDropZone();
        }, 100);

        save_proj = setInterval(() => {
            saveProject();
        }, 30_000);

        console.log("Editor mounted");
    });

    onDestroy(() => {
        clearInterval(save_proj);
        console.log("Editor unmounted and interval cleared");
    });
</script>

<div class="absolute top-0 z-10">
    <VariableDrawer
            bind:variableStore
            bind:variableRest
            bind:variableData
            bind:variableDrawerOpen />
</div>

{#if debug}
    <div class="absolute top-0 right-0 z-10 ">
        <div class="flex flex-col gap-2 p-2 bg-white border rounded-md m-2">
            <Call />
            <div class="pb-2 border-b">
                <h1 class="text-xl font-bold">Debug Tools</h1>
            </div>
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
            <Button on:click={() => console.log(variableStore.serialize())}>Dump Variable Store</Button>
            <Button on:click={() => console.log(marshalProject(projectName))}>Dump Project</Button>
            <Button on:click={() => console.log(serializeProject(marshalProject(projectName)))}>Serialize Project</Button>
            <Button on:click={() => console.log(deserializeProject(serializeProject(marshalProject(projectName))))}>Deserialize Project</Button>
            <Button on:click={() => attemptLoadProject()}>(Re) Load Project</Button>
        </div>
    </div>
{/if}

<div class="flex h-screen">
    <div class="w-screen absolute top-0 left-0 z-20">
        <div class="flex justify-center gap-4 p-2">
            <div class="p-2 border w-min flex flex-row justify-between align-center bg-white rounded-md gap-2">

                <PageSelector
                        {pageChange}
                        bind:currentPage
                        bind:allPages
                        bind:disabled={loading} />

                <Button
                        class="w-[10rem]"
                        bind:disabled={loading}
                        variant={agentRunning ? "destructive" : "default"}
                        on:click={runAgent}>{agentButtonText}</Button>

                <Button
                        class="bg-green-500 hover:bg-green-600"
                        variant="default"
                        on:click={saveProject}
                        disabled={loading}>
                    {#if saving}
                        <LoaderCircle class="h-6 w-6 text-white animate-spin" />
                    {:else}
                        <Save class="h-6 w-6 text-white" />
                    {/if}
                </Button>

                <AlertDialog.Root>
                    <AlertDialog.Trigger asChild let:builder>
                        <Button builders={[builder]} variant="destructive" disabled={loading}>
                            <Trash2 class="h-6 w-6 text-white" />
                        </Button>
                    </AlertDialog.Trigger>
                    <AlertDialog.Content>
                        <AlertDialog.Header>
                            <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
                            <AlertDialog.Description>
                                This action cannot be undone. This will permanently delete this page.
                            </AlertDialog.Description>
                        </AlertDialog.Header>
                        <AlertDialog.Footer>
                            <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                            <AlertDialog.Action on:click={() => deletePage(currentPage)}>Delete</AlertDialog.Action>
                        </AlertDialog.Footer>
                    </AlertDialog.Content>
                </AlertDialog.Root>
            </div>
        </div>
    </div>

    <!-- Sidebar with blocks -->
    <div class="border-flex border-r flex-col overflow-auto w-[18rem] absolute top-0 left-0 h-full bg-white z-10">
        <!-- Header -->
        <div class="p-4 border-b">
            <h1 class="text-xl font-bold">Blocks</h1>
        </div>

        <!-- Scrollable block container -->
        <div class="p-4 overflow-auto flex-1">
            {#if imagesVisible}
                <div class="flex flex-wrap gap-4">
                    {#each blockImages as [name, url]}
                        <div>
                            <img src={url} alt={name} />
                        </div>
                    {/each}
                </div>
            {/if}
        </div>
    </div>

    <!-- Main editor area -->
    <div
            id="container"
            class="flex-1 bg-white"
            on:drop={onDrop}
            bind:this={editorElement}>
    </div>
</div>
