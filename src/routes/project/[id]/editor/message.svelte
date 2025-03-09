<!-- MessageComponent.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';

    // Define interfaces for the data structures
    interface Message {
        id: string;
        content: string;
        sender: 'user' | 'system';
        timestamp: number;
        read: boolean;
    }

    interface ProjectStatus {
        isRunning: boolean;
        totalPromises: number;
        totalResolved: number;
    }

    interface MessageResponse {
        success: boolean;
        message: Message;
    }

    interface PollResponse {
        success: boolean;
        messages: Message[];
        meta?: {
            unreadCount: number;
            totalCount: number;
        };
        projectStatus?: ProjectStatus;
    }

    // Props
    let {
        projectId = $bindable(),
        running = $bindable(false),
    }: {
        projectId: string;
        running: boolean;
    } = $props();

    // Component state
    let messages: Message[] = $state([]);
    let newMessage: string = $state('');
    let lastPollTime: number = $state(Date.now());
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let isLoading: boolean = $state(false);
    let projectStatus: ProjectStatus = $state({ isRunning: false, totalPromises: 0, totalResolved: 0 })

    // Function to send a message
    async function sendMessage(): Promise<void> {
        if (!newMessage.trim()) return;

        isLoading = true;
        try {
            const response = await fetch('http://localhost:3000/api/messages/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newMessage })
            });

            const data: MessageResponse = await response.json();
            if (data.success) {
                newMessage = '';
                await pollMessages(); // Poll immediately for updates
            }
        } catch (error) {
            console.error('Error sending message:', error);
        } finally {
            isLoading = false;
        }
    }

    // Function to poll for new messages
    async function pollMessages(): Promise<void> {
        try {
            const response = await fetch(`http://localhost:3000/api/messages/poll?since=${lastPollTime}`);
            const data: PollResponse = await response.json();

            if (data.success) {
                if (data.messages.length > 0) {
                    // Add new messages and update last poll time
                    messages = [...messages, ...data.messages];

                    // Get the most recent timestamp
                    const timestamps = data.messages.map(m => m.timestamp);
                    if (timestamps.length > 0) {
                        lastPollTime = Math.max(...timestamps);
                    }

                    // Mark messages as read
                    const unreadIds = data.messages.map(m => m.id);
                    if (unreadIds.length > 0) {
                        await fetch('http://localhost:3000/api/messages/read', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ messageIds: unreadIds })
                        });
                    }
                }

                // Update project status if available in the response
                if (data.projectStatus) {
                    projectStatus = data.projectStatus;
                }
            }
        } catch (error) {
            console.error('Error polling messages:', error);
        }
    }

    onMount(() => {
        // Initial poll
        pollMessages();

        // Set up polling interval (every 2 seconds)
        pollingInterval = setInterval(pollMessages, 2000);
    });

    onDestroy(() => {
        // Clean up interval when component is destroyed
        if (pollingInterval) clearInterval(pollingInterval);
    });

    // Format timestamp to readable time
    function formatTime(timestamp: number): string {
        return new Date(timestamp).toLocaleTimeString();
    }
</script>

<div class="flex flex-col h-full w-full max-w-md mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
    <div class="bg-primary p-4 text-primary-foreground flex justify-between items-center">
        <h2 class="text-xl font-bold">Messages</h2>
        <div class="flex items-center space-x-2">
            <div class="flex items-center">
                <span class="text-xs mr-1">Status:</span>
                <span class={`h-2 w-2 rounded-full ${projectStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
            <div class="text-xs">
                {projectStatus.totalResolved}/{projectStatus.totalPromises} tasks
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4" style="max-height: 60vh;">
        {#each messages as message (message.id)}
            <div class={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div class={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}>
                    <p>{message.content}</p>
                    <span class="text-xs opacity-70">
                        {formatTime(message.timestamp)}
                    </span>
                </div>
            </div>
        {:else}
            <div class="text-center text-muted-foreground py-8">
                No messages yet
            </div>
        {/each}
    </div>

    <div class="border-t p-4">
        <form on:submit|preventDefault={sendMessage} class="flex space-x-2">
            <input
                    type="text"
                    bind:value={newMessage}
                    placeholder="Type your message..."
                    class="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={running}
            />
            <button
                    type="submit"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    disabled={!newMessage.trim() || running}
            >
                {isLoading ? 'Sending...' : 'Send'}
            </button>
        </form>
    </div>
</div>