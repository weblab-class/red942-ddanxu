export const uploadToImgur = async (imageBuffer) => {
  try {
    // imgur needs the image as base64 string
    const base64Image = imageBuffer.toString("base64");

    const imgurClientID = process.env.IMGUR_CID;
    const apiUrl = "https://api.imgur.com/3/image";

    //We manually do a fetch here instead of the post function in utilities.js
    //because we need different headers
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Client-ID ${imgurClientID}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        image: base64Image,
        type: "base64",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text(); // Read the response body as text to help debug
      throw new Error(`Failed to upload image. Status: ${response.status}. Response: ${errorText}`);
    }

    // Parse the JSON response
    const jsonResponse = await response.json();

    //Check if the upload was successful
    if (jsonResponse.success) {
      return jsonResponse.data.link;
    } else {
      console.log("image upload failed");
      throw new Error("Failed to upload image: " + jsonResponse.data.error);
    }
  } catch (error) {
    console.error("Image upload failed:", error);
  }
};
