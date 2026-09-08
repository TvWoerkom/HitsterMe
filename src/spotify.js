const CLIENT_ID = '7e18eee0dbaa4e999f89166eae57cca1';
const CLIENT_SECRET = 'd2fd4f72b0a1440f8685b99c52a5c0df';
const REDIRECT_URI = 'https://tvwoerkom.github.io/'; // Ensure this matches the one in your Spotify Developer Dashboard
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

      // Display success message
      displayMessage('Token fetched successfully! You can now proceed.', 'success');

      // Make "Next" button visible
      nextButton.style.display = 'inline-block';

      // Save the token to local storage (Optional)
      localStorage.setItem('spotify_token', data.access_token);
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

// Event listeners
document.getElementById('getTokenBtn').addEventListener('click', redirectToSpotifyLogin);
document.getElementById('nextBtn').addEventListener('click', () => {
 window.location.href = 'qr_coding.html';
});

// Handle redirect when the user is sent back from Spotify login
if (window.location.href.includes('code=')) {
  handleSpotifyRedirect();
}
