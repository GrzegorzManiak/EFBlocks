<script lang="ts">
    import { onMount } from "svelte";
    import { goto } from "$app/navigation";
    import { Button } from "@/button";
    import { cn } from "$lib/utils";
    import * as Blocks from "../../blocks";
    import {Trash2} from "lucide-svelte";
    import * as AlertDialog from "@/alert-dialog";
    import {Separator} from "@/separator";
    import {Input} from "@/input";
    import {VariableStore} from "../../blocks/executer/variable";
    import {toast} from "svelte-sonner";

    const projects: Blocks.Project[] = $state([]);

    onMount(() => {
        const localstorageKeys = Object.keys(localStorage);
        const projectKeys = localstorageKeys.filter((key) => key.startsWith("project-"));
        console.log(projectKeys);

        projectKeys.forEach((key) => {
            const project = JSON.parse(localStorage.getItem(key) as string) as Blocks.Project;
            projects.push(project);
        });
    });

    let newProjectName = $state("");
    function createProject() {
        if (newProjectName.trim() === "") return toast.error("Please enter a project name.");
        if (projects.find((project) => project.id === newProjectName)) return toast.error("A project with this name already exists.");
        if (newProjectName.length < 3) return toast.error("Project name must be at least 3 characters long.");

        const randomId = Math.random().toString(36).substring(7);
        const project: Blocks.Project = {
            id: randomId,
            name: newProjectName,
            lastModified: new Date().toISOString(),
            variableStore: new VariableStore(),
            currentPage: "Main",
            pages: [],
        };

        projects.push(project);
        localStorage.setItem(`project-${project.id}`, JSON.stringify(project));
        newProjectName = "";
    }

    function deleteProject(project: Blocks.Project) {
        const index = projects.indexOf(project);
        projects.splice(index, 1);
        localStorage.removeItem(`project-${project.id}`);
    }

</script>

<div class="flex flex-col items-center justify-start h-screen w-screen">
    <div class="flex flex-col w-full justify-start items-start h-full p-2 max-w-[55rem]">
        <h1 class="text-4xl font-bold">Projects</h1>
        <p class="text-lg text-muted-foreground mb-6">Manage your projects here.</p>


        <div class="flex flex-row w-full justify-between items-center my-2">
            <h2 class="text-xl font-bold">Create a new project</h2>
        </div>

        <div class="flex flex-row w-full justify-between items-center align-middle gap-2 mb-4">
            <Input placeholder="Project name" class="w-full" bind:value={newProjectName} />
            <Button on:click={createProject}>Create</Button>
        </div>


        <div class="flex flex-col w-full mt-2 gap-2">
            <div class="flex flex-col w-full mt-2">
                <h2 class="text-xl font-bold leading-tight">Load existing projects</h2>
                <p class="text-lg text-muted-foreground leading-tight mb-2">You have {projects.length} project{projects.length > 1 ? "s" : ""}.</p>
            </div>

            {#if projects.length === 0}
                <div class="flex flex-col items-center justify-center w-full p-2">
                    <p class="text-lg">No projects found.</p>
                </div>
            {:else}
                {#each projects as project}
                    <div class="flex flex-row w-full p-2 border rounded-md justify-center items-center">
                        <div class="flex flex-col w-full">
                            <h2 class="text-2xl font-bold m-0 leading-tight">{project.name}</h2>
                            <p class="text-lg text-muted-foreground m-0 leading-tight">
                                Last modified on {new Date(project.lastModified).toLocaleDateString()}
                                at {new Date(project.lastModified).toLocaleTimeString()}
                            </p>
                        </div>

                        <div class="flex flex-row gap-2">
                            <Button variant="ghost" class="ml-auto" on:click={() => goto(`/project/${project.id}/editor`)}>Open</Button>
                            <AlertDialog.Root>
                                <AlertDialog.Trigger asChild let:builder>
                                    <Button builders={[builder]} variant="destructive" class="bg-red-400">
                                        <Trash2 class="h-6 w-6 text-white" />
                                    </Button>
                                </AlertDialog.Trigger>
                                <AlertDialog.Content>
                                    <AlertDialog.Header>
                                        <AlertDialog.Title>Are you absolutely sure?</AlertDialog.Title>
                                        <AlertDialog.Description>
                                            This action cannot be undone. This will permanently delete this project.
                                        </AlertDialog.Description>
                                    </AlertDialog.Header>
                                    <AlertDialog.Footer>
                                        <AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
                                        <AlertDialog.Action on:click={() => deleteProject(project)}>Delete</AlertDialog.Action>
                                    </AlertDialog.Footer>
                                </AlertDialog.Content>
                            </AlertDialog.Root>
                        </div>
                    </div>
                {/each}
            {/if}
        </div>
    </div>
</div>