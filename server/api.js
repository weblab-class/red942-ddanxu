/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const imgur = require('./imgur.js');

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
const User = require("./models/user.js");
const {Novel} = require("./models/novels.js");
const {Frame} = require("./models/frames.js")

// import authentication library
const auth = require("./auth.js");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket.js");

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

router.get("/user", (req, res) => {
  User.findById(req.query.userid).then((user) => {
    res.send(user);
  }).catch((err) => {
    res.status(500).send('User Not');
  });
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/imgUp", upload.single("image"), async (req, res) => {
  console.log("made it here");
  if (!req.file) {
    console.log(req.body);
    return res.status(400).send({ msg: "No File Upload" });
  }

  try {
    // Call the uploadToImgur function with the image buffer
    const imageUrl = await imgur.uploadToImgur(req.file.buffer);
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
  //   const imageUrl = await imgur.uploadToImgur(req.file.buffer);
  //   res.status(200).send({ msg: "Image uploaded successfully", imageUrl });
  //   console.log(imageUrl)
  // } catch (error) {
  //   console.error("Error uploading image:", error);
  //   res.status(500).send({ msg: "Failed to upload image" });
  // }

});

router.post("/newNovel", upload.single("thumbnail"), async (req, res) => {
  if (!req.file) {
    console.log(req.body);
    return res.status(400).send({ msg: "No Thumbnail Upload" });
  }

  const {name, userId} = req.body;
  console.log(req.body);
  console.log(userId);
  const thumbnail = req.file;
  const thumbnailLink = await imgur.uploadToImgur(thumbnail.buffer);
  let frame = new Frame({
    text: "Start editing your first leaf!",
    // novelId
  });
  frame = await frame.save();
  const frameId = frame._id;

  let newNovel = new Novel({
    name: name,
    startFrameId: frameId,
    thumbnail: thumbnailLink,
    vars: [],
    editors: [userId],
    sprites: [],
    onPlayAudios: [],
    bgms: [],
    backgrounds: [{name: "Thumbnail",link: thumbnailLink}]
  });
  newNovel = await newNovel.save();
  const novelId = newNovel._id;

  await Frame.findByIdAndUpdate(
    frameId,
    {novelId: novelId}
  );

});

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
