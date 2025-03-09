<script>
    import { onDestroy } from 'svelte';
    import RecordRTC from 'recordrtc';

    // Configuration
    const SAMPLE_RATE = 48000 * 0.7;

    // Component state
    let inputDevices = [];
    let selectedDeviceId = '';
    let isRecording = false;
    let isConnecting = false;
    let statusMessage = '';
    let errorMessage = '';
    let sessionId = null;
    let transcriptText = ''; // Add this to store transcript

    // Resources that need cleanup
    let mediaStream;
    let recorder;
    let socket;
    let pollingInterval; // Add this for transcript polling

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

    // Stop the recording process
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

    // Clean up on component destruction
    onDestroy(() => {
        stopRecording();
    });
</script>

<div class="gladia-container">
    <form on:submit|preventDefault={startRecording}>
        <div class="form-group">
            <label for="input_device">Audio input device</label>
            <select
                    id="input_device"
                    bind:value={selectedDeviceId}
                    disabled={isRecording || isConnecting || inputDevices.length === 0}
            >
                {#each inputDevices as device}
                    <option value={device.deviceId}>{device.label || 'Default'}</option>
                {/each}
            </select>
        </div>

        {#if errorMessage}
            <div class="error-message">
                {errorMessage}
            </div>
        {/if}

        <div class="status-message">
            {statusMessage}
        </div>

        <div class="button-group">
            {#if !isRecording}
                <button
                        type="submit"
                        disabled={isConnecting || isRecording}
                >
                    {isConnecting ? 'Connecting...' : 'Start Recording'}
                </button>
            {:else}
                <button
                        type="button"
                        class="stop-button"
                        on:click={stopRecording}
                >
                    Stop Recording
                </button>
            {/if}
        </div>
    </form>

    {#if transcriptText}
        <div class="transcript-container">
            <h3>Transcript</h3>
            <div class="transcript">
                {transcriptText}
            </div>
        </div>
    {/if}
</div>

<style>
    .gladia-container {
        max-width: 500px;
        margin: 0 auto;
        padding: 1rem;
    }

    .form-group {
        margin-bottom: 1rem;
        display: flex;
        flex-direction: column;
    }

    .form-group label {
        margin-bottom: 0.5rem;
        font-weight: bold;
    }

    .form-group select {
        padding: 0.5rem;
        border: 1px solid #ccc;
        border-radius: 4px;
    }

    .button-group {
        margin: 1rem 0;
    }

    button {
        padding: 0.5rem 1rem;
        background-color: #4a90e2;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-weight: bold;
    }

    button:disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }

    .stop-button {
        background-color: #d94242;
    }

    .error-message {
        color: #d94242;
        margin-bottom: 1rem;
    }

    .status-message {
        margin: 0.5rem 0;
        font-style: italic;
    }

    .transcript-container {
        margin-top: 2rem;
        border-top: 1px solid #eee;
        padding-top: 1rem;
    }

    .transcript {
        background-color: #f9f9f9;
        padding: 1rem;
        border-radius: 4px;
        white-space: pre-wrap;
        min-height: 100px;
    }
</style>