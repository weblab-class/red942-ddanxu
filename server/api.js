/*
|--------------------------------------------------------------------------
| api.js -- server routes
|--------------------------------------------------------------------------
|
| This file defines the routes for your server.
|
*/

const imgur = require("./imgur.js");
const multer = require("multer");
const express = require("express");

// import models so we can interact with the database
const User = require("./models/user.js");
const { Novel } = require("./models/novels.js");
const { Frame } = require("./models/frames.js");

// import authentication library
const auth = require("./auth.js");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket.js");

//---------Auth-------------

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

//------------Helpers---------------

const frameToNovel = async (frameId) => {
  const frame = await Frame.findById(frameId);
  const novelId = frame.novelId;
  return(novelId);
}

//-------------------------GET--------------------

router.get("/user", (req, res) => {
  User.findById(req.query.userid)
    .then((user) => {
      res.send(user);
    })
    .catch((err) => {
      res.status(500).send("User Not");
    });
});

router.get("/frame", async (req, res) => {
  const { frameId } = req.query;
  if (!frameId) {
    return res.status(400).send({ error: "frameId is required" });
  }
  try {
    const frame = await Frame.findById(frameId);
    return res.send({ frame: frame });
  } catch (error) {
    return res.status(500).send({ error: "/frame fucked up" });
  }
});

router.get("/novel", async (req, res) => {
  const { novelId } = req.query;
  if (!novelId) {
    return res.status(400).send({ error: "novelId is required" });
  }
  try {
    const novel = await Novel.findById(novelId);
    return res.status(200).send({ novel: novel });
  } catch (error) {
    return res.status(500).send({ error: "/novel fucked up" });
  }
});

router.get("/bgsFromFrame", async (req, res) => {
  const frameId= req.query.frameId;
  if (!frameId) {
    return res.status(400).send({ error: "frameId is required" });
    
  }

  const novelId = await frameToNovel(frameId);
  const novel = await Novel.findById(novelId);
  const bgs = novel.backgrounds;
  return res.status(200).send({backgrounds: bgs});
});

router.get("/spritesFromFrame", async (req, res) => {
  const frameId = req.query.frameId;
  if (!frameId) {
    return res.status(400).send({ error: "frameId is required" });
  }
  

  const novelId = await frameToNovel(frameId);
  const novel = await Novel.findById(novelId);
  const sprites = novel.sprites;
  return res.status(200).send({sprites: sprites});
});

//------------------POST-----------------------


const storage = multer.memoryStorage();
const upload = multer({ storage });

router.post("/imgUp", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ msg: "No File Upload" });
  }

  const {name, frameId, type} = req.body;

  try {
    // Call the uploadToImgur function with the image buffer
    const imageUrl = await imgur.uploadToImgur(req.file.buffer);
    const frame = await Frame.findById(frameId);
    const novelId = frame.novelId;
    const novel = await Novel.findById(novelId);
    if (type === 'bg') {
      novel.backgrounds = [...(novel.backgrounds || []), {name: name, link: imageUrl}];
      frame.background = imageUrl;
    } else {
      novel.sprites = [...(novel.sprites || []), {name: name, link: imageUrl}];
      switch (type) {
        case 'left':
          frame.spriteLeft = imageUrl;
          break;
        case 'mid':
          frame.spriteMid = imageUrl;
          break;
        case 'right':
          frame.spriteRight = imageUrl;
          break;
      }
    }
    await novel.save();
    await frame.save();
    res.status(200).send({link: imageUrl});
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).send({ msg: "Failed to upload image" });
  }
});

router.post("/audioUp", upload.single("audio"), async (req, res) => {
  console.log("made it here");
  if (!req.file) {
    console.log("audio up failed");
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
    console.log("No thumbnail :(");
    return res.status(400).send({ msg: "No Thumbnail Upload" });
  }

  const { name, userId } = req.body;
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
    backgrounds: [{ name: "Thumbnail", link: thumbnailLink }],
  });
  newNovel = await newNovel.save();
  const novelId = newNovel._id;

  await Frame.findByIdAndUpdate(frameId, { novelId: novelId });

  return res.status(200).send({ novelId: novelId });
});

router.post("/setbg", async (req, res) => {
  const { link, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.background = link;
  await frame.save();
  return res.status(200).send(link);
});

router.post("/setleft", async (req, res) => {
  const { link, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.spriteLeft = link;
  await frame.save();
  return res.status(200).send(link);
});

router.post("/setmid", async (req, res) => {
  const { link, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.spriteMid = link;
  await frame.save();
  return res.status(200).send(link);
});

router.post("/setright", async (req, res) => {
  const { link, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.spriteRight = link;
  await frame.save();
  return res.status(200).send({link: link});
});
//-----------------MISC----------------------------

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
