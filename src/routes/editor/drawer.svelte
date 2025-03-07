<script lang="ts">
    import * as Blocks from "../../blocks";
    import * as Tabs from "@/tabs";
    import * as Card from "@/card";
    import { Input } from "@/input";
    import * as Dialog from "@/dialog";
    import { Button } from "@/button";
    import {onMount} from "svelte";
    import {Label} from "@/label";
    import type {VariableStore} from "../../blocks/executer/variable";

    let {
        variableData = $bindable(),
        variableDrawerOpen = $bindable(),
        variableStore,
    } : {
        variableStore: VariableStore,
        variableData: {
            segment: Blocks.Types.SegmentDefinition,
            block: Blocks.Block,
            input: Blocks.Types.CreatedInput,
        } | null,
        variableDrawerOpen: boolean
    } = $props();

    let constantInput: string = $state("");
    let referenceInput: string = $state("");

    function saveConstant() {
        console.log("Saving constant", constantInput);
        variableDrawerOpen = false;
        if (variableData === null) return;

        if (
            constantInput.trim() === "" ||
            constantInput.length < 3
        ) return reset();

        const id = variableData.block.id + variableData.segment.id + variableData.input.id;
        variableData.block.updateInput(variableData.input, {
            isConstant: true,
            occupied: true,
            displayText: constantInput,
            key: id,
        });

        variableStore.set(id, constantInput);
    }

    function saveReference() {
        console.log("Saving reference", referenceInput);
        variableDrawerOpen = false;
        if (variableData === null) return;

        if (
            referenceInput.trim() === "" ||
            referenceInput.length < 3
        ) return reset();

        referenceInput = referenceInput.trim();
        const id = referenceInput.trim().toLowerCase();
        variableData.block.updateInput(variableData.input, {
            isConstant: false,
            occupied: true,
            displayText: referenceInput,
            key: id,
        });

        variableStore.set(id, referenceInput);
    }

    function reset() {
        constantInput = "";
        referenceInput = "";
        variableDrawerOpen = false;
        if (variableData === null) return;
        variableData.block.resetInput(variableData.input);
    }

</script>

<div></div>

{#if variableData !== null}
    <Dialog.Root bind:open={variableDrawerOpen} >
        <Dialog.Content>

            <Tabs.Root value="account" class="w-full">
                <Tabs.List class="grid w-full grid-cols-2">
                    <Tabs.Trigger value="account">Constant</Tabs.Trigger>
                    <Tabs.Trigger value="password">Reference</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="account" class="border-none p-0 m-0">
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

                <Tabs.Content value="password">
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