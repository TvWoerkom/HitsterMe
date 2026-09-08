// Function to scan the video feed for QR codes
async function scanQRCode(videoElement) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const nextButton = document.getElementById('next-button');
  const ppButton = document.getElementById('play-pause-btn');
  const rsButton = document.getElementById('restart-btn');

  const videoBorder = document.getElementById('camera-container');
  const h1 = document.getElementById('h1');

  // Set the canvas size to match the video dimensions
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;

  let stopScanning = false; // Flag to control scanning loop

  // Start scanning using setInterval to repeatedly check for QR codes
  const scanInterval = setInterval(() => {
    if (stopScanning) {
      clearInterval(scanInterval); // Stop scanning immediately
      return; // Exit the function
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, canvas.width, canvas.height);

    if (code) {
      console.log('QR Code found:', code.data);

      // Check if the QR code contains a Spotify URL
      if (isSpotifyLink(code.data)) {
        // Convert the web URL to Spotify URI if it's a valid link
        const spotifyURI = convertToSpotifyURI(code.data);

        if (spotifyURI) {
          console.log('Opening Spotify URI:', spotifyURI);

          // Store the URI for play/pause/restart controls
          setCurrentSpotifyURI(spotifyURI);

          // Open the Spotify URI directly (no Premium required)
          playSpotifyTrack(spotifyURI, null);
        }
      } else if (isValidURL(code.data)) {
        // For other valid URLs, show a confirmation to the user before opening the link
        const userConfirmed = confirm(`QR Code detected: ${code.data}\n\nDo you want to open this link?`);
        //if (userConfirmed) {
          //window.open(code.data, '_blank'); // Open other valid URLs in a new tab
        //}
      } else {
        alert(`QR Code detected but it's not a valid URL: ${code.data}`);
      }

      // Stop scanning immediately after detecting a valid QR code
      stopScanning = true; // Set flag to stop further scanning

      // Hide the video and stop the stream once a link is detected
      const stream = videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop()); // Stop the camera stream

      // Hide the video element
      videoElement.style.display = 'none';

      // Show the "Next" button
      nextButton.style.display = 'block';
      ppButton.style.display = 'block'
      rsButton.style.display = 'block'

      videoBorder.style.display = 'none';
      h1.innerText  = 'Hitster Me! (...baby one more time?)';

      return; // Stop further scanning once a valid QR code is found
    }
  }, 100); // Check every 100ms (you can adjust the interval timing as needed)

  // This interval will be cleared as soon as `stopScanning` becomes true.
}

// Function to check if a URL is a Spotify link
function isSpotifyLink(string) {
  return string.startsWith('https://open.spotify.com/');
}

// Convert a Spotify web URL to a Spotify URI
function convertToSpotifyURI(spotifyURL) {
  try {
    const url = new URL(spotifyURL);

    // Extract the path to determine the type of resource (track, album, playlist, etc.)
    const path = url.pathname.split('/');
    const type = path[1]; // The resource type (e.g., "track", "album", "playlist")
    const id = path[2]; // The unique ID of the resource

    // Build the corresponding Spotify URI
    if (type === 'track') {
      return `spotify:track:${id}`;
    } else if (type === 'album') {
      return `spotify:album:${id}`;
    } else if (type === 'playlist') {
      return `spotify:playlist:${id}`;
    }

    // If it's not a valid Spotify link, return null
    return null;
  } catch (error) {
    console.error('Error converting to Spotify URI:', error);
    return null;
  }
}

// Function to validate if the detected text is a URL
function isValidURL(string) {
  try {
    new URL(string); // Attempt to create a URL object
    return true; // If successful, the string is a valid URL
  } catch (error) {
    return false; // If it fails, the string is not a valid URL
  }
}

// Function to play a Spotify track using the Web API
async function playSpotifyTrack(spotifyTrackURI, accessToken, position = 0) {
  const devicesUrl = 'https://api.spotify.com/v1/me/player/devices';
  const playUrl = 'https://api.spotify.com/v1/me/player/play';

  try {
    // Step 1: Fetch available devices
    const devicesResponse = await fetch(devicesUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!devicesResponse.ok) {
      console.error('Error fetching devices:', await devicesResponse.json());
      return;
    }

    const devicesData = await devicesResponse.json();
    const devices = devicesData.devices;

    if (devices.length === 0) {
      console.error('No available devices found.');
      return;
    }

    // Step 2: Select a device (for example, the first one)
    const targetDevice = devices[0];
    console.log(`Using device: ${targetDevice.name} (${targetDevice.id})`);

    // Step 3: Prepare the play request payload
	const payload = {
    uris: [spotifyTrackURI]  // Dynamically set the track URI
	//uris: ["spotify:track:4iV5W9uYEdYUVa79Axb7Rh"]
    };
    //const payload = {
    //  uris: [spotifyTrackURI], // Use the provided track URI
    // position_ms: position,   // Start position in milliseconds (default is 0)
    //};

    // Step 4: Play the track on the selected device
    const playResponse = await fetch(`${playUrl}?device_id=${targetDevice.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (playResponse.ok) {
      console.log('Track is playing successfully on device:', targetDevice.name);
    } else {
      const errorData = await playResponse.json();
      console.error('Error playing track:', errorData);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// pause spotify playback - FIX: Add async to allow use of await
async function pauseSpotifyPlayback() {
  const accessToken = localStorage.getItem('spotify_token');
  const url = 'https://api.spotify.com/v1/me/player/pause';  // Spotify API endpoint to pause playback

  try {
    const response = await fetch(url, {
      method: 'PUT',  // Using PUT to pause playback
      headers: {
        'Authorization': `Bearer ${accessToken}`,  // Pass the access token in the Authorization header
        'Content-Type': 'application/json'  // Set the content type to JSON
      }
    });

    if (response.ok) {
      console.log('Playback paused successfully!');
    } else {
      const errorData = await response.json();
      console.error('Error pausing playback:', errorData);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
}

// Initialize QR code scanning after the camera feed starts
async function startQRCodeScanning(videoElement) {
  // Wait until the video element is ready (it might take a moment to start playing)
  videoElement.onplay = () => {
    scanQRCode(videoElement);  // Assume scanQRCode is already defined elsewhere
  };
}

// Function to reactivate video scanning after pressing "Next"
function startNextScan() {
  pauseSpotifyPlayback()  // Now calling the async function correctly
  const videoElement = document.getElementById('camera-feed');
  
  const nextButton = document.getElementById('next-button');
  const ppButton = document.getElementById('play-pause-btn');
  const rsButton = document.getElementById('restart-btn');
  
  const videoBorder = document.getElementById('camera-container');
  const h1 = document.getElementById('h1');
  
  // Show the video element and hide the "Next" button
  videoElement.style.display = 'block';
  videoBorder.style.display = 'block';
  
  nextButton.style.display = 'none';
  ppButton.style.display = 'none'
  rsButton.style.display = 'none'
  
  h1.innerText = 'Scan a QRcode to start the song';
  ppButton.innertext = 'Pause'

  // Restart the camera feed and QR scanning
  showCameraFeed();
}
