<script lang="ts">
    import { Phone, PhoneOff } from "lucide-svelte";
    import {onDestroy, onMount} from "svelte";
    import { tick } from "svelte";
    import { writable } from "svelte/store";
    import {toast} from "svelte-sonner";
    import RecordRTC from 'recordrtc';
    import {Select} from "@/select";

    let {
        running = $bindable(false),
    } : {
        running: boolean
    } = $props();

    let isCalling = $state(false);
    let callOn = $state(false);
    let showCallText = $state(false);
    let agentButtonText = $state("Call Agent");

    // Helper function for random number generation
    function randomNumber(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    // Helper function for sleep
    function sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Function to simulate a call process
    async function handleCallClick() {
        if (callOn) {
            // Reset call state
            await stopRecording();
            callOn = false;
            isCalling = false;
            showCallText = false;
            agentButtonText = "Call Agent";
            return;
        }

        if (!running) return toast.error("Please start the code execution first.");

        console.log("Calling agent... 1");
        if (isCalling) return;
        isCalling = true;
        showCallText = true;
        console.log("Calling agent... 2");

        const promise = startRecording();

        // Simulate various stages of the call
        agentButtonText = "Connecting...";
        await sleep(randomNumber(500, 1000));

        agentButtonText = "Establishing Socket...";
        await sleep(randomNumber(200, 700));

        agentButtonText = "Fetching devices...";
        await sleep(randomNumber(200, 700));

        agentButtonText = "Recording...";
        await sleep(randomNumber(200, 700));

        agentButtonText = "Disconnect";
        await promise;
        isCalling = false;
        callOn = true;
    }

    // Configuration
    const SAMPLE_RATE = 48000 * 0.7;

    // Component state
    let inputDevices = [];
    let selectedDeviceId = $state('');
    let isRecording = $state(false);
    let isConnecting = $state(false);
    let statusMessage = $state('');
    let errorMessage = $state('');
    let sessionId: string | null = $state(null);
    let transcriptText = ''; // Add this to store transcript

    // Resources that need cleanup
    let mediaStream: MediaStream | null;
    let recorder: RecordRTC | null;
    let socket: WebSocket | null;
    let pollingInterval: number | null;

    // Fetch available audio devices on component mount
    async function listAudioDevices() {
        try {
            // Request permissions first
            const media = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Get the list of devices
            const devices = await navigator.mediaDevices.enumerateDevices();
            inputDevices = devices.filter(d => d.kind === 'audioinput' && d.deviceId);

            // Clean up the temporary stream
            media.getTracks().forEach(track => track.stop());

            // Select the first device by default
            if (inputDevices.length > 0) {
                selectedDeviceId = inputDevices[0].deviceId;
            }
        } catch (err) {
            console.error('Error accessing audio devices:', err);
            errorMessage = `Could not access audio devices: ${err.message}`;
        }
    }

    // Initialize component
    listAudioDevices();

    // Poll for transcript updates
    async function pollTranscript() {
        if (!sessionId) return;

        try {
            const response = await fetch(`http://localhost:3000/api/gladia/transcript/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                transcriptText = data.final;
                if (data.partial) {
                    console.log("Partial transcript:", data.partial);
                }
            }
        } catch (err) {
            console.error('Error polling transcript:', err);
        }
    }

    // Start the recording process
    async function startRecording() {
        errorMessage = '';
        isConnecting = true;
        statusMessage = 'Connecting to server...';
        transcriptText = '';

        try {
            // Initialize a session with our backend
            const response = await fetch('http://localhost:3000/api/gladia/session', {
                method: 'POST'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Failed to connect to the server');
            }

            const data = await response.json();
            sessionId = data.sessionId;
            console.log('Session ID:', sessionId);

            // Connect to our WebSocket endpoint
            socket = new WebSocket(`ws://localhost:3000/api/gladia/stream/${sessionId}`);

            // Handle WebSocket events
            socket.onopen = () => {
                statusMessage = 'WebSocket connected. Waiting for server confirmation...';
                console.log("WebSocket connection opened");
            };

            socket.onerror = (event) => {
                console.error('WebSocket error:', event);
                errorMessage = 'WebSocket connection error';
                stopRecording();
            };

            socket.onclose = (event) => {
                console.log('WebSocket connection closed:', event.code, event.reason);
                if (isRecording) {
                    errorMessage = `Connection closed: ${event.reason || 'Unknown reason'}`;
                    stopRecording();
                }
            };

            socket.onmessage = (event) => {
                try {
                    console.log("Received message from server:", event.data);
                    const message = JSON.parse(event.data);

                    if (message.error) {
                        errorMessage = message.error;
                        stopRecording();
                        return;
                    }

                    // Only status updates from the server, not transcripts
                    if (message.type === 'status') {
                        statusMessage = message.message;

                        // Start polling for transcript updates
                        if (message.status === 'connected') {
                            console.log("Server confirmed connection, starting recording");
                            startAudioRecording();

                            // Start polling for transcript updates
                            pollingInterval = setInterval(pollTranscript, 2000);
                        }
                    }
                } catch (error) {
                    console.error('Error parsing message:', error);
                }
            };

        } catch (err) {
            console.error('Error starting recording:', err);
            errorMessage = err.message || 'Error starting recording';
            stopRecording();
        }
    }

    // Start audio recording after WebSocket is connected
    async function startAudioRecording() {
        try {
            // Get audio stream from selected device
            mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : true
            });

            // Initialize the recorder
            // Initialize the recorder
            recorder = new RecordRTC(mediaStream, {
                type: 'audio',
                mimeType: 'audio/wav',
                recorderType: RecordRTC.StereoAudioRecorder,
                timeSlice: 500,
                async ondataavailable(blob) {
                    console.log("RecordRTC data available, blob size:", blob.size);
                    try {
                        const buffer = await blob.arrayBuffer();
                        const modifiedBuffer = buffer.slice(44);
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            socket.send(modifiedBuffer);
                        }

                        else {
                            console.error("WebSocket not open, state:", socket ? socket.readyState : "socket is null");
                        }
                    } catch (err) {
                        console.error("Error processing audio data:", err);
                    }
                },
                sampleRate: SAMPLE_RATE,
                desiredSampRate: SAMPLE_RATE,
                numberOfAudioChannels: 1
            });

            // Start recording
            recorder.startRecording();
            isRecording = true;
            isConnecting = false;
            statusMessage = 'Recording in progress...';

        } catch (err) {
            console.error('Error starting audio recording:', err);
            errorMessage = err.message || 'Error starting audio recording';
            stopRecording();
        }
    }

    function stopRecording() {
        isRecording = false;
        isConnecting = false;

        if (recorder) {
            recorder.stopRecording();
            recorder = null;
        }

        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
            mediaStream = null;
        }

        if (socket) {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
            socket = null;
        }

        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }

        // Provide feedback to the user
        if (!errorMessage) {
            statusMessage = 'Recording stopped. Transcription processing on the server.';
            // Final poll to get the latest transcript
            pollTranscript();
        }
    }

    onDestroy(() => {
        stopRecording();
    });
</script>

<div class="p-4 text-primary-foreground flex justify-between items-center border-b">
    <h2 class="text-xl text-black font-bold">Messenger</h2>
    <div class="flex items-center space-x-2">
        <div class="flex items-center">
            <span class="text-xs mr-1 text-muted-foreground">Status:</span>
            <span class={`h-2 w-2 rounded-full ${running ? 'bg-green-500' : 'bg-red-500'}`}></span>
        </div>
        <button
                class={`flex items-center ${showCallText ? 'w-40' : 'w-10'} transition-all duration-300 h-10 rounded-md ${callOn ? 'bg-red-500' : 'bg-blue-500'} text-white justify-center`}
                on:click={handleCallClick}
        >
            {#if callOn}
                <PhoneOff size={18} />
            {:else}
                <Phone size={18} />
            {/if}

            {#if showCallText}
                <span class="ml-2 text-sm whitespace-nowrap overflow-hidden">{agentButtonText}</span>
            {/if}
        </button>
    </div>

</div>