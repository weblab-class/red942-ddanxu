const fetch = require('node-fetch'); // Import node-fetch for HTTP requests
const fs = require('fs'); // For reading the image file
const path = require('path'); // For handling file paths

// Function to upload image to Imgur
const uploadImageToImgur = async (imagePath) => {
  try {
    // Read image file into buffer
    const imageBuffer = fs.readFileSync(imagePath);
    
    // Convert image buffer to base64 string
    const base64Image = imageBuffer.toString('base64');
    
    // Your Imgur Client ID
    const imgurClientID = '3734277a9e7812a';  // Replace with your actual Imgur Client ID
    
    // Imgur API URL for image upload
    const apiUrl = 'https://api.imgur.com/3/image';
    
    // Make the POST request to upload the image to Imgur
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Client-ID ${imgurClientID}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image: base64Image,
        type: 'base64' // Specify that the image is in base64 format
      })
    });

    // Parse the JSON response
    const jsonResponse = await response.json();
    
    // Check if the upload was successful
    if (jsonResponse.success) {
      console.log('Image uploaded successfully:', jsonResponse.data.link);
      return jsonResponse.data.link; // Return the URL of the uploaded image
    } else {
      throw new Error('Failed to upload image: ' + jsonResponse.data.error);
    }
  } catch (error) {
    console.error('Image upload failed:', error);
  }
};

// Example usage: Specify the path to your image here
const imagePath = path.join(__dirname, 'favicon.png'); // Replace with the correct path to your image file

uploadImageToImgur(imagePath)
  .then((link) => console.log('Uploaded Image URL:', link))
  .catch((error) => console.error('Error:', error));