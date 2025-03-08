<script lang="ts">
    import * as Blocks from "../../../../blocks";
    import * as Tabs from "@/tabs";
    import * as Card from "@/card";
    import { Input } from "@/input";
    import * as Dialog from "@/dialog";
    import { Button } from "@/button";
    import {onMount} from "svelte";
    import {Label} from "@/label";
    import type {VariableStore} from "../../../../blocks/executer/variable";

    let {
        variableRest = $bindable(),
        variableData = $bindable(),
        variableDrawerOpen = $bindable(),
        variableStore,
    } : {
        variableRest: (constantText: string, referenceText: string) => void,
        variableStore: VariableStore,
        variableData: {
            segment: Blocks.Types.SegmentDefinition,
            block: Blocks.Block,
            input: Blocks.Renderer.Inputs.CreatedInput,
        } | null,
        variableDrawerOpen: boolean
    } = $props();

    let constantInput: string = $state("");
    let referenceInput: string = $state("");

    function closeDrawer() {
        variableDrawerOpen = false;
        constantInput = "";
        referenceInput = "";
    }

    function saveConstant(bypass = false) {
        console.log("Saving constant", constantInput);
        if (variableData === null) return closeDrawer();

        if (
            (constantInput.trim() === "" ||
            constantInput.length < 3) && !bypass
        ) return reset();

        const id = variableData.block.id + variableData.segment.id + variableData.input.id;
        variableData.block.updateInput(variableData.input, {
            isConstant: true,
            occupied: true,
            displayText: constantInput,
            key: id,
        });

        variableStore.set(id, constantInput);
        closeDrawer();
    }

    function saveReference() {
        console.log("Saving reference", referenceInput);
        if (variableData === null) return closeDrawer();

        if (
            referenceInput.trim() === "" ||
            referenceInput.length < 3
        ) return reset();

        const input = referenceInput.trim();
        const id = referenceInput.trim().toLowerCase();
        variableData.block.updateInput(variableData.input, {
            isConstant: false,
            occupied: true,
            displayText: input,
            key: id,
        });

        variableStore.set(id, input);
        closeDrawer();
    }

    function setConstant(value: string) {
        constantInput = value;
        saveConstant(true);
    }

    function reset() {
        closeDrawer();
        if (variableData === null) return;
        variableData.block.resetInput(variableData.input);
    }

    function variableResetFunc(constantText: string, referenceText: string) {
        constantInput = constantText;
        referenceInput = referenceText;
    }

    variableRest = variableResetFunc;
</script>

<div></div>

{#if variableData !== null}
    <Dialog.Root bind:open={variableDrawerOpen} >
        <Dialog.Content>

            <Tabs.Root class="w-full" value={variableData.input.internalName === 'eval' ? "Eval" : (variableData.input.mode === Blocks.Renderer.Types.InputMode.Read ? (variableData.input.isConstant ? "Constant" : "Reference") : "Reference")}>
                <Tabs.List class="grid w-full grid-cols-2">
                    {#if variableData.input.internalName === 'eval'}
                        <Tabs.Trigger value="Eval">Eval</Tabs.Trigger>
                    {:else}
                        {#if variableData.input.mode === Blocks.Renderer.Types.InputMode.Read}
                            <Tabs.Trigger value="Constant">Constant</Tabs.Trigger>
                            <Tabs.Trigger value="Reference">Reference</Tabs.Trigger>
                        {:else}
                            <Tabs.Trigger value="Reference" class="col-span-2">Reference</Tabs.Trigger>
                        {/if}
                    {/if}
                </Tabs.List>

                <Tabs.Content value="Eval" class="border-none p-0 m-0">
                    <Card.Root class="border-none shadow-none p-0 m-0">
                        <Card.Header class="p-0 mt-4">
                            <Card.Title>Evaluation Operator</Card.Title>
                            <Card.Description>
                                These are used when you want to compare a value with another value.
                            </Card.Description>
                        </Card.Header>
                        <Card.Content class="space-y-2 p-0 mt-4">
                            <div class="flex flex-row gap-2 flex-wrap">
                                <Button
                                        variant={constantInput === "==" ? "default" : "outline"}
                                        class="flex-grow" on:click={() => setConstant("==")}>Equal</Button>

                                <Button
                                        variant={constantInput === "!=" ? "default" : "outline"}
                                        class="flex-grow" on:click={() => setConstant("!=")}>Not Equal</Button>

                                <Button
                                        variant={constantInput === ">" ? "default" : "outline"}
                                        class="flex-grow" on:click={() => setConstant(">")}>Greater Than</Button>

                                <Button
                                        variant={constantInput === "<" ? "default" : "outline"}
                                        class="flex-grow" on:click={() => setConstant("<")}>Less Than</Button>

                                <Button
                                        variant={constantInput === ">=" ? "default" : "outline"}
                                        class="flex-grow" on:click={() => setConstant(">=")}>Greater Than or Equal</Button>

                                <Button
                                        variant={constantInput === "<=" ? "default" : "outline"}
                                        class="flex-grow" on:click={() => setConstant("<=")}>Less Than or Equal</Button>
                            </div>
                        </Card.Content>
                        <Card.Footer class="p-0 mt-4 flex flex-row gap-2">
                            <Button variant='destructive' class="bg-red-400 w-full" on:click={reset}> Reset</Button>
                        </Card.Footer>
                    </Card.Root>
                </Tabs.Content>

                <Tabs.Content value="Constant" class="border-none p-0 m-0">
                    <Card.Root class="border-none shadow-none p-0 m-0">
                        <Card.Header class="p-0 mt-4">
                            <Card.Title>Constant Variable</Card.Title>
                            <Card.Description>
                                You can manually assign a value to this variable, it
                                stay a constant value.
                            </Card.Description>
                        </Card.Header>
                        <Card.Content class="space-y-2 p-0 mt-4">
                            <div class="space-y-1">
                                <Label for="name">{variableData.input.name} Data</Label>
                                <Input id="name" placeholder="Constant value" bind:value={constantInput} />
                            </div>
                        </Card.Content>
                        <Card.Footer class="p-0 mt-4 flex flex-row gap-2">
                            <Button class="w-full" on:click={saveConstant}>Save variable</Button>
                            <Button variant='destructive' class="bg-red-400" on:click={reset}> Reset</Button>
                        </Card.Footer>
                    </Card.Root>
                </Tabs.Content>

                <Tabs.Content value="Reference">
                    <Card.Root class="border-none shadow-none p-0 m-0">
                        <Card.Header class="p-0 mt-4">
                            <Card.Title>Reference Variable</Card.Title>
                            <Card.Description>
                                You can assign a reference to this variable, it will
                                be updated when the reference changes.
                            </Card.Description>
                        </Card.Header>
                        <Card.Content class="space-y-2 p-0 mt-4">
                            <div class="space-y-1">
                                <Label for="name">{variableData.input.name} Reference</Label>
                                <Input id="name" placeholder="Reference key" bind:value={referenceInput} />
                            </div>
                        </Card.Content>
                        <Card.Footer class="p-0 mt-4 flex flex-row gap-2">
                            <Button class="w-full" on:click={saveReference}>Save variable</Button>
                            <Button variant='destructive' class="bg-red-400" on:click={reset}> Reset</Button>
                        </Card.Footer>
                    </Card.Root>
                </Tabs.Content>
            </Tabs.Root>
        </Dialog.Content>
    </Dialog.Root>
{/if}