document.addEventListener('DOMContentLoaded', () => {
    const audioUpload = document.getElementById('audio-upload');
    const copyBtn = document.getElementById('copy-btn');
    const transcribeBtn = document.getElementById('transcribe-btn');
    const transcription = document.getElementById('transcription');
    const fileInfo = document.querySelector('.file-info');
    const loading = document.querySelector('.loading');
    const errorMessage = document.querySelector('.error-message');
    const resultContainer = document.querySelector('.result-container');

    const API_KEY = '3e2f5ed5c3984275a3bbafaad7d84e4a';
    const UPLOAD_URL = 'https://api.assemblyai.com/v2/upload';
    const TRANSCRIPT_URL = 'https://api.assemblyai.com/v2/transcript';

    let selectedFile = null;

    // Initially hide the loading indicator
    loading.classList.add('hidden');

    // Add animation class after a slight delay for a better effect
    setTimeout(() => {
        document.querySelectorAll('.upload-card, .result-container').forEach(el => {
            el.classList.add('animated');
        });
    }, 100);

    // File upload handling with visual feedback
    audioUpload.addEventListener('change', (e) => {
        selectedFile = e.target.files[0];
        if (selectedFile) {
            fileInfo.textContent = `Selected: ${selectedFile.name}`;
            transcribeBtn.disabled = false;
            errorMessage.classList.add('hidden');
            
            // Add visual feedback animation
            fileInfo.classList.add('file-selected');
            setTimeout(() => fileInfo.classList.remove('file-selected'), 1000);
        } else {
            fileInfo.textContent = 'No file selected';
            transcribeBtn.disabled = true;
        }
    });

    // Transcribe button handling with improved animations
    transcribeBtn.addEventListener('click', async () => {
        if (!selectedFile) {
            errorMessage.classList.remove('hidden');
            errorMessage.classList.add('shake');
            setTimeout(() => errorMessage.classList.remove('shake'), 500);
            return;
        }

        // Show loading and scroll to result area
        loading.classList.remove('hidden');
        errorMessage.classList.add('hidden');
        resultContainer.scrollIntoView({ behavior: 'smooth' });
        
        try {
            // First step animation
            updateLoadingMessage('Uploading audio file...');
            
            const uploadResponse = await fetch(UPLOAD_URL, {
                method: 'POST',
                headers: {
                    'authorization': API_KEY
                },
                body: selectedFile
            });

            if (!uploadResponse.ok) throw new Error('Upload failed');

            // Second step animation
            updateLoadingMessage('Processing your audio...');
            
            const uploadData = await uploadResponse.json();
            const audioUrl = uploadData.upload_url;

            const transcriptResponse = await fetch(TRANSCRIPT_URL, {
                method: 'POST',
                headers: {
                    'authorization': API_KEY,
                    'content-type': 'application/json',
                },
                body: JSON.stringify({
                    audio_url: audioUrl
                })
            });

            if (!transcriptResponse.ok) throw new Error('Transcription request failed');

            // Final step animation
            updateLoadingMessage('Getting your transcription...');
            
            const transcriptData = await transcriptResponse.json();
            const result = await pollTranscript(transcriptData.id);
            
            // Animate the result display
            transcription.value = '';
            const textToType = result.text;
            
            // Hide loading before the typing animation
            loading.classList.add('hidden');
            
            // Simple typewriter effect
            let i = 0;
            const typeWriter = () => {
                if (i < textToType.length) {
                    transcription.value += textToType.charAt(i);
                    i++;
                    // Adjust speed based on text length
                    const speed = Math.max(5, Math.min(50, 500 / textToType.length));
                    setTimeout(typeWriter, speed);
                }
            };
            
            typeWriter();
            
        } catch (error) {
            console.error('Error:', error);
            transcription.value = 'Error processing audio. Please try again.';
            loading.classList.add('hidden');
        }
    });

    function updateLoadingMessage(message) {
        const loadingMessage = loading.querySelector('p');
        loadingMessage.textContent = message;
        
        // Add a subtle animation when updating the message
        loadingMessage.classList.add('pulse');
        setTimeout(() => loadingMessage.classList.remove('pulse'), 500);
    }

    async function pollTranscript(transcriptId) {
        const pollingEndpoint = `${TRANSCRIPT_URL}/${transcriptId}`;
        
        while (true) {
            const pollingResponse = await fetch(pollingEndpoint, {
                headers: {
                    'authorization': API_KEY
                }
            });
            const transcriptionResult = await pollingResponse.json();

            if (transcriptionResult.status === 'completed') {
                return transcriptionResult;
            } else if (transcriptionResult.status === 'error') {
                throw new Error(`Transcription failed: ${transcriptionResult.error}`);
            } else {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    }

    // Copy text functionality with a better effect
    copyBtn.addEventListener('click', () => {
        transcription.select();
        document.execCommand('copy');
        
        const originalText = copyBtn.textContent;
        copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
        copyBtn.classList.add('copied');
        
        setTimeout(() => {
            copyBtn.innerHTML = '<i class="fas fa-copy"></i> Copy Text';
            copyBtn.classList.remove('copied');
        }, 2000);
    });
}); 