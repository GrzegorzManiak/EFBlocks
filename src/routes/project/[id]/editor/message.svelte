<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import {Input} from "@/input";
    import { Button } from "@/button";
    import CallSelector from './callSelector.svelte';

    // Define interfaces for the data structures
    interface Message {
        id: string;
        content: string;
        sender: 'user' | 'system' | 'info' | 'autoplay';
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
        debug = $bindable(false),
        running = $bindable(false),
    }: {
        projectId: string;
        running: boolean;
        debug: boolean;
    } = $props();

    // Component state
    let messages: Message[] = $state([]);
    let newMessage: string = $state('');
    let lastPollTime: number = $state(Date.now());
    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    let isLoading: boolean = $state(false);
    let projectStatus: ProjectStatus = $state({ isRunning: false, totalPromises: 0, totalResolved: 0 })

    // Voice recording state
    let mediaRecorder: MediaRecorder | null = $state(null);
    let isRecording: boolean = $state(false);
    let recordedChunks: BlobPart[] = [];
    let recordingStartTime: number = 0;
    let recordingDuration: number = $state(0);
    let recordingTimer: ReturnType<typeof setInterval> | null = null;

    // Function to send a message
    async function sendMessage(): Promise<void> {
        if (!newMessage.trim()) return;

        isLoading = true;
        try {
            const response = await fetch('http://ef.serros.ml:3000/api/messages/send', {
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

    // Function to start voice recording
    async function startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);

            recordedChunks = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    recordedChunks.push(e.data);
                }
            };

            mediaRecorder.start();
            isRecording = true;
            recordingStartTime = Date.now();

            // Start a timer to update recording duration
            recordingTimer = setInterval(() => {
                recordingDuration = (Date.now() - recordingStartTime) / 1000;
            }, 100);

        } catch (error) {
            console.error('Error starting recording:', error);
        }
    }

    // Function to stop voice recording and send
    async function stopRecording() {
        if (!mediaRecorder) return;

        return new Promise<void>((resolve) => {
            mediaRecorder.onstop = async () => {
                try {
                    const audioBlob = new Blob(recordedChunks, { type: 'audio/webm' });
                    const duration = (Date.now() - recordingStartTime) / 1000;

                    // Create FormData to send the audio file
                    const formData = new FormData();
                    formData.append('audio', audioBlob, 'recording.webm');
                    formData.append('duration', duration.toString());

                    messages.push({
                        id: `temp-${Date.now()}`,
                        content: URL.createObjectURL(audioBlob),
                        sender: 'user',
                        timestamp: Date.now(),
                        duration,
                        read: true,
                        isVoice: true
                    });

                    isLoading = true;
                    const response = await fetch('http://ef.serros.ml:3000/api/messages/send-voice', {
                        method: 'POST',
                        body: formData
                    });

                    const data = await response.json();
                    if (data.success) {
                        await pollMessages();
                    }

                    // Clean up recording state
                    if (mediaRecorder && mediaRecorder.stream) {
                        mediaRecorder.stream.getTracks().forEach(track => track.stop());
                    }

                    // Scroll to the bottom of the messages
                    if (msgElement) {
                        msgElement.scrollTop = msgElement.scrollHeight;
                    }

                } catch (error) {
                    console.error('Error sending voice message:', error);
                } finally {
                    isLoading = false;
                    resolve();
                }
            };

            mediaRecorder.stop();
            isRecording = false;

            // Clear the recording duration timer
            if (recordingTimer) {
                clearInterval(recordingTimer);
                recordingTimer = null;
            }

            // Reset the recording duration
            recordingDuration = 0;
        });
    }

    // Handle voice button press and release
    function handleVoiceButtonDown() {
        if (!running) return;
        startRecording();
    }

    function handleVoiceButtonUp() {
        if (isRecording) {
            stopRecording();
        }
    }

    // Handle voice button touch events for mobile
    function handleVoiceButtonTouchStart(e) {
        e.preventDefault(); // Prevent default touch behavior
        if (!running) return;
        startRecording();
    }

    function handleVoiceButtonTouchEnd(e) {
        e.preventDefault();
        if (isRecording) {
            stopRecording();
        }
    }

    function muteMicrophone() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getAudioTracks().forEach(track => track.enabled = false);
            });
    }

    function unmuteMicrophone() {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                stream.getAudioTracks().forEach(track => track.enabled = true);
            });
    }

    // Function to poll for new messages
    async function pollMessages(): Promise<void> {
        try {
            const response = await fetch(`http://ef.serros.ml:3000/api/messages/poll?since=${lastPollTime}`);
            const data: PollResponse = await response.json();

            if (data.success) {
                if (data.messages.length > 0) {
                    // Add new messages and update last poll time
                    messages = [...messages, ...data.messages];
                    data.messages.forEach(m => {
                        if (m.sender === 'autoplay' && !m.read) {
                            muteMicrophone();
                            const audio = new Audio(m.content);
                            audio.load();
                            audio.play();
                            audio.onended = () => {
                                unmuteMicrophone();
                            };
                        }
                    });

                    // Get the most recent timestamp
                    const timestamps = data.messages.map(m => m.timestamp);
                    if (timestamps.length > 0) {
                        lastPollTime = Math.max(...timestamps);
                    }

                    // Mark messages as read
                    const unreadIds = data.messages.map(m => m.id);
                    if (unreadIds.length > 0) {
                        await fetch('http://ef.serros.ml:3000/api/messages/read', {
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
        if (recordingTimer) clearInterval(recordingTimer);

        // Stop any ongoing recording
        if (mediaRecorder && mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
            if (mediaRecorder.stream) {
                mediaRecorder.stream.getTracks().forEach(track => track.stop());
            }
        }

        // Clean up audio elements
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
    <CallSelector bind:running />

    <div class="flex-1 overflow-y-auto p-4 space-y-4" bind:this={msgElement}>
        {#each messages as message (message.id)}
            {#if message.sender === 'info'}
                <div class="text-center text-muted-foreground py-8">
                    {message.content}
                </div>
            {:else if message.sender === 'user' || message.sender === 'system'}
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

    <div class="border-t p-4 mb-[3rem]">
        <form on:submit|preventDefault={sendMessage} class="flex space-x-2">
            <Input
                    type="text"
                    bind:value={newMessage}
                    placeholder="Type your message..."
                    class="flex-1 px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={!running || isRecording}
            />
            <button
                    type="submit"
                    class="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50"
                    disabled={!newMessage.trim() || !running || isRecording}
            >
                {isLoading ? 'Sending...' : 'Send'}
            </button>

            <!-- Voice recording button -->
            <button
                    type="button"
                    class={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary flex items-center justify-center ${isRecording ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                    disabled={!running || isLoading}
                    on:mousedown={handleVoiceButtonDown}
                    on:mouseup={handleVoiceButtonUp}
            >
                {#if isRecording}
                    <div class="flex items-center">
                        <span class="animate-pulse mr-1">●</span>
                        <span>{formatDuration(recordingDuration)}</span>
                    </div>
                {:else}
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                        <line x1="12" y1="19" x2="12" y2="23"></line>
                        <line x1="8" y1="23" x2="16" y2="23"></line>
                    </svg>
                {/if}
            </button>

<!--            debug trigger -->
        </form>

        <Button variant="ghost" class="mt-[1rem] w-full" on:click={() => debug = !debug}>Debug</Button>

    </div>
</div>