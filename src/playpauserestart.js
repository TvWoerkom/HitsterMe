// Replace with your Spotify Access Token
const accessToken = localStorage.getItem('spotify_token');

// Define the base URL for Spotify's playback API
const spotifyApiBaseUrl = 'https://api.spotify.com/v1/me/player';

// Function to make API calls to Spotify
async function spotifyApiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: body ? JSON.stringify(body) : null
    };

    const response = await fetch(`${spotifyApiBaseUrl}${endpoint}`, options);
    if (!response.ok) {
        console.error(`Spotify API error: ${response.status}`, await response.json());
    }
    return response;
}

// Play or resume playback
async function playTrack() {
    await spotifyApiRequest('/play', 'PUT');
    console.log('Playback started/resumed.');
}

// Pause playback
async function pauseTrack() {
    await spotifyApiRequest('/pause', 'PUT');
    console.log('Playback paused.');
}

// Restart the currently playing track
async function restartTrack() {
    await spotifyApiRequest('/seek?position_ms=0', 'PUT');
    console.log('Track restarted.');
}

// Event listeners for buttons
document.getElementById('play-pause-btn').addEventListener('click', async () => {
    const playPauseBtn = document.getElementById('play-pause-btn');

    // Check current playback state
    const playbackState = await spotifyApiRequest('', 'GET').then(res => res.json());
    const isPlaying = playbackState.is_playing;

    if (isPlaying) {
        await pauseTrack();
        playPauseBtn.textContent = 'Play';
    } else {
        await playTrack();
        playPauseBtn.textContent = 'Pause';
    }
});

document.getElementById('restart-btn').addEventListener('click', restartTrack);
