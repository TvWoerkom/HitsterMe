// Function to get all media devices
async function getMediaDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    return videoDevices;
  } catch (error) {
    console.error('Error accessing devices:', error);
    return [];
  }
}

// Function to automatically select the back-facing camera if possible
async function showCameraFeed() {
  const videoElement = document.getElementById('camera-feed'); // Get the video element by ID
  const messageElement = document.getElementById('message');   // Get the message element by ID

  try {
    const devices = await getMediaDevices();

    // Try to find the back-facing camera by checking the label for 'back' or 'environment'
    const backCamera = devices.find(device => device.label.toLowerCase().includes('back') || device.label.toLowerCase().includes('environment'));

    let cameraToUse = null;

    // If back camera is found, select it
    if (backCamera) {
      cameraToUse = backCamera;
    } else {
      // Look for a camera with 'environment' in the label
      const environmentCamera = devices.find(device => device.label.toLowerCase().includes('environment'));

      // If found, use it as the back camera
      if (environmentCamera) {
        cameraToUse = environmentCamera;
      } else {
        // Fallback: Select the first available camera (typically front camera or whatever is available)
        cameraToUse = devices[0];
      }
    }

    if (cameraToUse) {
      // Request camera access with the chosen camera deviceId
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: cameraToUse.deviceId }
      });

      // Set the video element's source to the stream from the selected camera
      videoElement.srcObject = stream;

      // Hide the "Please allow camera access" message
      messageElement.style.display = 'none';

      // Start QR code scanning after the camera feed starts
      await startQRCodeScanning(videoElement); // Make sure the function is called correctly
    }
  } catch (error) {
    console.error('Error accessing camera:', error);
    // Show the message if there was an issue accessing the camera
    messageElement.style.display = 'block';
  }
}

// Call the function to show the camera feed when the page loads
window.onload = showCameraFeed;
