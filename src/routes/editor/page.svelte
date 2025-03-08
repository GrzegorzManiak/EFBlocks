<script lang="ts">
    import Check from "lucide-svelte/icons/check";
    import ChevronsUpDown from "lucide-svelte/icons/chevrons-up-down";
    import * as Command from "@/command";
    import * as Popover from "@/popover";
    import { Button } from "@/button";
    import { cn } from "$lib/utils.js";
    import { tick } from "svelte";

    let {
        disabled = $bindable(false),
        allPages = $bindable(),
        currentPage = $bindable(),
        pageChange
    } : {
        disabled: boolean,
        allPages: string[],
        currentPage: string,
        pageChange: (from: string, to: string) => void
    } = $props();

    let open = $state(false);
    let value = $state("");
    let input = $state("");

    function createPage() {
        console.log("Creating a new page...", input);
        const from = currentPage;
        allPages = [...allPages, input];
        currentPage = input;
        input = "";
        open = false;
        pageChange(from, currentPage);
    }
</script>

<Popover.Root bind:open let:ids>
    <Popover.Trigger asChild let:builder>
        <Button
                builders={[builder]}
                variant="outline"
                role="combobox"
                aria-expanded={open}
                class="w-[15rem] justify-between"
                disabled={disabled}
        >
            {currentPage}
            <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
    </Popover.Trigger>
    <Popover.Content class="w-[15rem] p-0">
        <Command.Root>
            <Command.Input placeholder="Search pages..." bind:value={input} disabled={disabled} />
            <Command.Empty class="p-2 ">
                <Button
                        on:click={createPage}
                        variant="outline" class="w-full">
                    Create a new page
                </Button>
            </Command.Empty>
            <Command.Group>
                {#each allPages as page}
                    <Command.Item
                            disabled={disabled}
                            value={page}
                            onSelect={(currentValue) => {
                                const from = currentPage;
                                value = currentValue;
                                currentPage = currentValue;
                                open = false;
                                pageChange(from, currentValue);
                            }}
                    >
                        <Check
                            class={cn(
                                    "mr-2 h-4 w-4",
                                    currentPage !== page && "text-transparent"
                            )}
                        />
                        {page}
                    </Command.Item>
                {/each}
            </Command.Group>
        </Command.Root>
    </Popover.Content>
</Popover.Root>