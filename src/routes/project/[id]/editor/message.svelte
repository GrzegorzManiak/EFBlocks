<!-- MessageComponent.svelte -->
<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {Input} from "@/input";

    // Define interfaces for the data structures
    interface Message {
        id: string;
        content: string;
        sender: 'user' | 'system' | 'info';
        timestamp: number;
        duration?: number;
        read: boolean;
        isVoice?: boolean;
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
            // Scroll to the bottom of the messages
            if (msgElement) {
                msgElement.scrollTop = msgElement.scrollHeight;
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

                        // Scroll to the bottom of the messages
                        if (msgElement) {
                            msgElement.scrollTop = msgElement.scrollHeight;
                        }
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
        Object.values(audioElements).forEach(audio => {
            audio.pause();
            audio.src = '';
        });
        audioElements = {};
    });

    // Format timestamp to readable time
    function formatTime(timestamp: number): string {
        return new Date(timestamp).toLocaleTimeString();
    }
    let msgElement: HTMLElement | null = $state(null);

    function formatDuration(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = Math.floor(seconds % 60);
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    // Handle audio playback
    function toggleAudio(messageId) {
        const message = messages.find(m => m.id === messageId);
        if (!message || !message.isVoice) return;

        // Create audio element if it doesn't exist
        if (!audioElements[messageId]) {
            const audio = new Audio(message.content);

            audio.addEventListener('timeupdate', () => {
                audioProgress[messageId] = (audio.currentTime / audio.duration) * 100;
            });

            audio.addEventListener('ended', () => {
                playingAudio = null;
                audioProgress[messageId] = 0;
            });

            audioElements[messageId] = audio;
        }

        // If this audio is already playing, pause it
        if (playingAudio === messageId) {
            audioElements[messageId].pause();
            playingAudio = null;
        } else {
            // Stop any currently playing audio
            if (playingAudio && audioElements[playingAudio]) {
                audioElements[playingAudio].pause();
                audioElements[playingAudio].currentTime = 0;
                audioProgress[playingAudio] = 0;
            }

            // Play the new audio
            audioElements[messageId].play();
            playingAudio = messageId;
        }
    }
</script>

<script context="module" lang="ts">
    // Define types for messages
    type MessageId = string;

    // Audio player state to manage across components
    let audioElements: Record<MessageId, HTMLAudioElement> = {};
    let playingAudio: MessageId | null = null;
    let audioProgress: Record<MessageId, number> = {};
</script>

<div class="flex flex-col h-full w-full max-w-md mx-auto overflow-hidden">
    <div class="p-4 text-primary-foreground flex justify-between items-center border-b">
        <h2 class="text-xl text-black font-bold">Messenger</h2>
        <div class="flex items-center space-x-2">
            <div class="flex items-center">
                <span class="text-xs mr-1 text-muted-foreground">Status:</span>
                <span class={`h-2 w-2 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`}></span>
            </div>
            <div class="text-xs text-muted-foreground">
                {projectStatus.totalResolved}/{projectStatus.totalPromises} tasks
            </div>
        </div>
    </div>

    <div class="flex-1 overflow-y-auto p-4 space-y-4" bind:this={msgElement}>
        {#each messages as message (message.id)}
            {#if message.sender === 'info'}
                <div class="text-center text-muted-foreground py-8">
                    {message.content}
                </div>
            {:else}
                <div class={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div class={`max-w-xs px-4 py-2 rounded-lg ${
                    message.sender === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}>
                        {#if message.isVoice}
                            <div class="flex items-center space-x-2 w-[15rem]">
                                <button
                                        class="flex items-center justify-center w-8 h-8 rounded-full bg-opacity-20 hover:bg-opacity-30 transition-colors"
                                        class:bg-white={message.sender === 'user'}
                                        class:bg-gray-500={message.sender !== 'user'}
                                        on:click={() => toggleAudio(message.id)}
                                >
                                    {#if playingAudio === message.id}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect x="6" y="4" width="4" height="16"></rect>
                                            <rect x="14" y="4" width="4" height="16"></rect>
                                        </svg>
                                    {:else}
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polygon points="5 3 19 12 5 21 5 3"></polygon>
                                        </svg>
                                    {/if}
                                </button>
                                <div class="flex-1">
                                    <div class="h-1 w-full rounded-full overflow-hidden"
                                         class:bg-white={message.sender === 'user'}
                                         class:bg-opacity-20={message.sender === 'user'}
                                         class:bg-gray-300={message.sender !== 'user'}
                                    >
                                        <div
                                                class="h-full rounded-full"
                                                class:bg-white={message.sender === 'user'}
                                                class:bg-gray-500={message.sender !== 'user'}
                                                style="width: {audioProgress[message.id] || 0}%"
                                        ></div>
                                    </div>
                                </div>
                            </div>
                            <span class="text-xs opacity-70 mt-1 block">
                            {formatTime(message.timestamp)} · {formatDuration(message.duration || 0)}
                        </span>
                        {:else}
                            <p>{message.content}</p>
                            <span class="text-xs opacity-70">
                            {formatTime(message.timestamp)}
                        </span>
                        {/if}
                    </div>
                </div>
            {/if}
        {:else}
            <div class="text-center text-muted-foreground py-8">
                No messages yet
            </div>
        {/each}
    </div>

    <div class="border-t p-4 mb-[5rem]">
        <form on:submit|preventDefault={sendMessage} class="flex space-x-2">
            <Input
                    type="text"
                    bind:value={newMessage}
                    placeholder="Type your message..."
                    class="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={!running}
            />
            <button
                    type="submit"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    disabled={!newMessage.trim() || !running}
            >
                {isLoading ? 'Sending...' : 'Send'}
            </button>
        </form>
    </div>
</div>