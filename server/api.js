/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

//lets us call apis
const fetch = require("node-fetch");

const multer = require("multer");
//this lets us read the image files
const fs = require("fs");

//makes sure paths dont fuck up
const path = require("path");

const utils = require("../client/src/utilities.js");

const express = require("express");

// import models so we can interact with the database
const User = require("./models/user");

// import authentication library
const auth = require("./auth");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket");

router.post("/login", auth.login);
router.post("/logout", auth.logout);
router.get("/whoami", (req, res) => {
  if (!req.user) {
    // not logged in
    return res.send({});
  }

  res.send(req.user);
});

router.post("/initsocket", (req, res) => {
  // do nothing if user not logged in
  if (req.user)
    socketManager.addUser(req.user, socketManager.getSocketFromSocketID(req.body.socketid));
  res.send({});
});

// |------------------------------|
// | write your API methods below!|
// |------------------------------|

const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadToImgur = async (imageBuffer) => {
  try {
    // imgur needs the image as base64 string
    const base64Image = imageBuffer.toString("base64");

    const imgurClientID = process.env.imgurClientID;
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

    // Parse the JSON response
    const jsonResponse = await response.json();

    //Check if the upload was successful
    if (jsonResponse.success) {
      console.log("Image uploaded successfully:", jsonResponse.data.link);
      return jsonResponse.data.link;
    } else {
      console.log(response);
      throw new Error("Failed to upload image: " + jsonResponse.data.error);
    }
  } catch (error) {
    console.error("Image upload failed:", error);
  }
};

router.post("/imgUp", upload.single("image"), async (req, res) => {
  console.log("made it here");
  if (!req.file) {
    console.log(req.body);
    return res.status(400).send({ msg: "No File Upload" });
  }

  try {
    // Call the uploadToImgur function with the image buffer
    const imageUrl = await uploadToImgur(req.file.buffer);
    res.status(200).send({ msg: "Image uploaded successfully", imageUrl });
    console.log(imageUrl);
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).send({ msg: "Failed to upload image" });
  }
});

router.post("/audioUp", upload.single("audio"), async (req, res) => {
  console.log("made it here");
  if (!req.file) {
    console.log(req.body);
    return res.status(400).send({ msg: "No File Upload" });
  }

  // try {
  //   // Call the uploadToImgur function with the image buffer
  //   const imageUrl = await uploadToImgur(req.file.buffer);
  //   res.status(200).send({ msg: "Image uploaded successfully", imageUrl });
  //   console.log(imageUrl)
  // } catch (error) {
  //   console.error("Error uploading image:", error);
  //   res.status(500).send({ msg: "Failed to upload image" });
  // }

});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
