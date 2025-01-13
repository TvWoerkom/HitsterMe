// Function to request camera access and display video feed in iframe
function startCamera() {
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    // Request access to video (camera)
    navigator.mediaDevices.getUserMedia({ video: true })
      .then(function(stream) {
        // Create a video element dynamically
        const videoElement = document.createElement('video');
        videoElement.srcObject = stream;
        videoElement.autoplay = true;  // Start playing the video automatically
        videoElement.width = '100%';  // Set video width to 100% of iframe
        videoElement.height = '100%';  // Set video height to 100% of iframe

        // Find the iframe and insert the video element into it
        const iframe = document.getElementById('camera-frame');
        const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
        iframeDocument.body.appendChild(videoElement);
      })
      .catch(function(error) {
        console.error('Error accessing the camera: ', error);
        alert('Please allow camera access to view the feed.');
      });
  } else {
    alert('Your browser does not support camera access.');
  }
}

// Call the startCamera function once the page is loaded
window.onload = function() {
  startCamera();
};
