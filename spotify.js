const CLIENT_ID = '7e18eee0dbaa4e999f89166eae57cca1';
const CLIENT_SECRET = 'd2fd4f72b0a1440f8685b99c52a5c0df';

const isLocalHost = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const REDIRECT_URI = isLocalHost
  ? `${window.location.origin}/callback`
  : `${window.location.origin}${window.location.pathname}`;

const SCOPES = 'user-library-read user-read-playback-state user-modify-playback-state';

// Base64 Encode the Client ID and Secret for client credentials flow (if needed)
const encodedCredentials = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

// Step 1: Redirect to Spotify Login
function redirectToSpotifyLogin() {
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(SCOPES)}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  window.location.href = authUrl;
}

// Step 2: Fetch the token using the authorization code from the URL
async function fetchAccessToken(authorizationCode) {
  const resultElement = document.getElementById('result');
  const nextButton = document.getElementById('nextBtn');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedCredentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: authorizationCode,
        redirect_uri: REDIRECT_URI,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();

    if (data.access_token) {
      console.log('Spotify Access Token:', data.access_token);

      // Fetch and log the current user's info
      try {
        const userResponse = await fetch('https://api.spotify.com/v1/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`,
          },
        });

        if (!userResponse.ok) {
          throw new Error(`HTTP error! status: ${userResponse.status}`);
        }

        const userData = await userResponse.json();
        console.log('User Display Name:', userData.display_name);

        // Display success message
        displayMessage(`Token fetched successfully! Logged in as: ${userData.display_name}`, 'success');

        // Make "Next" button visible
        nextButton.style.display = 'inline-block';

        // Save the token to local storage (Optional)
        localStorage.setItem('spotify_token', data.access_token);
      } catch (userError) {
        console.error('Error fetching user info:', userError);
        displayMessage('Token fetched, but couldn\'t retrieve user info. Check console.', 'success');
        nextButton.style.display = 'inline-block';
        localStorage.setItem('spotify_token', data.access_token);
      }
    } else {
      displayMessage('Failed to fetch token. Check the response.', 'error');
    }
  } catch (error) {
    console.error('Error fetching Spotify token:', error);
    displayMessage('An error occurred. See console for details.', 'error');
  }
}

// Step 3: Handle the redirect and retrieve the authorization code
function handleSpotifyRedirect() {
  const urlParams = new URLSearchParams(window.location.search);
  const authorizationCode = urlParams.get('code');

  if (authorizationCode) {
    // Exchange the authorization code for an access token
    fetchAccessToken(authorizationCode);
  } else {
    displayMessage('No authorization code found in URL', 'error');
  }
}

// Step 4: Display messages
function displayMessage(message, type) {
  const resultElement = document.getElementById('result');
  resultElement.textContent = message;
  resultElement.style.color = type === 'success' ? 'black' : 'red';
}

// Function to play a Spotify track using deep link (no Premium required)
function playSpotifyTrack(spotifyURI, accessToken) {
  console.log('Opening Spotify URI in background:', spotifyURI);
  // Open the Spotify URI in a background tab so the current app stays in front
  if (spotifyURI.startsWith('spotify:')) {
    const newWin = window.open('', '_blank');
    if (newWin) {
      newWin.opener = null;
      newWin.location.href = spotifyURI;
    } else {
      window.location.href = spotifyURI;
    }
  }
}

// Store the current Spotify URI globally for play/pause/restart controls
let currentSpotifyURI = null;

function setCurrentSpotifyURI(uri) {
  currentSpotifyURI = uri;
}

function getCurrentSpotifyURI() {
  return currentSpotifyURI;
}

// Event listeners (only add if elements exist)
const getTokenBtn = document.getElementById('getTokenBtn');
if (getTokenBtn) {
  getTokenBtn.addEventListener('click', redirectToSpotifyLogin);
}

// Handle redirect when the user is sent back from Spotify login
if (window.location.href.includes('code=')) {
  handleSpotifyRedirect();
}