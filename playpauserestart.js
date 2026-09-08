// Replace with your Spotify Access Token
const accessToken = localStorage.getItem('spotify_token');

// Play or resume playback - Open Spotify URI to start playing
async function playTrack() {
    const uri = getCurrentSpotifyURI();
    if (uri) {
        window.location.href = uri;
        console.log('Opened Spotify URI for playback.');
    } else {
        alert('No song selected. Please scan a QR code first.');
    }
}

// Pause playback - Show message to use Spotify app
async function pauseTrack() {
    alert('Please use your Spotify app to pause playback.');
    console.log('Use Spotify app to pause.');
}

// Restart the currently playing track - Open the same URI again
async function restartTrack() {
    const uri = getCurrentSpotifyURI();
    if (uri) {
        window.location.href = uri;
        console.log('Restarted track by opening Spotify URI again.');
    } else {
        alert('No song selected. Please scan a QR code first.');
    }
}

// Event listeners for buttons
document.getElementById('play-pause-btn').addEventListener('click', async () => {
    const playPauseBtn = document.getElementById('play-pause-btn');

    // Toggle between play and pause messages
    if (playPauseBtn.textContent === 'Play') {
        await playTrack();
        playPauseBtn.textContent = 'Pause';
    } else {
        await pauseTrack();
        playPauseBtn.textContent = 'Play';
    }
});

document.getElementById('restart-btn').addEventListener('click', restartTrack);
