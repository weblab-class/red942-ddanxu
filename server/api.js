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
const path = require("path");

// import models so we can interact with the database
const User = require("./models/user.js");
const { Novel, Save } = require("./models/novels.js");
const { Frame } = require("./models/frames.js");

// import authentication library
const auth = require("./auth.js");

// api endpoints: all these paths will be prefixed with "/api/"
const router = express.Router();

//initialize socket
const socketManager = require("./server-socket.js");

const audioUpload = require("./audioUplaod.js");

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
  return novelId;
};

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
  const frameId = req.query.frameId;
  if (!frameId) {
    return res.status(400).send({ error: "frameId is required" });
  }

  const novelId = await frameToNovel(frameId);
  const novel = await Novel.findById(novelId);
  const bgs = novel.backgrounds;
  return res.status(200).send({ backgrounds: bgs });
});

router.get("/spritesFromFrame", async (req, res) => {
  const frameId = req.query.frameId;
  if (!frameId) {
    return res.status(400).send({ error: "frameId is required" });
  }

  const novelId = await frameToNovel(frameId);
  const novel = await Novel.findById(novelId);
  const sprites = novel.sprites;
  return res.status(200).send({ sprites: sprites });
});

router.get("/bgmsFromFrame", async (req, res) => {
  const frameId = req.query.frameId;
  if (!frameId) {
    return res.status(400).send({ error: "frameId is required" });
  }

  const novelId = await frameToNovel(frameId);
  const novel = await Novel.findById(novelId);
  const bgms = novel.bgms;
  return res.status(200).send({ bgms: bgms });
});

router.get("/onPlaysFromFrame", async (req, res) => {
  const frameId = req.query.frameId;
  if (!frameId) {
    return res.status(400).send({ error: "frameId is required" });
  }

  const novelId = await frameToNovel(frameId);
  const novel = await Novel.findById(novelId);
  const onPlays = novel.onPlayAudios;
  return res.status(200).send({ onPlayAudios: onPlays });
});

router.get("/text", async (req, res) => {
  const frameId = req.query.frameId;
  if (!frameId) {
    return res.status(400).send({ error: "frameId is required" });
  }

  const frame = await Frame.findById(frameId);
  const text = frame.text;
  return res.status(200).send({ text: text });
});

router.get("/audioAsBlob", async (req, res) => {
  const links = req.query.links;
  if (!links) {
    return res.status(400).send({ error: "links are required" });
  }

  

  const audioId = links[0];
  console.log("https://drive.google.com/uc?export=download&id=" + audioId);
  const response = await fetch("https://drive.google.com/uc?export=download&id=" + audioId);


  res.setHeader("Content-Type", "audio/mp3");
  res.setHeader("Content-Disposition", "inline; filename=audio.mp3");
  const arrayBuffer = await response.arrayBuffer();
  return res.status(200).send(Buffer.from(arrayBuffer));
});

router.get("/publicNovels", async (req, res) => {
  console.log("public novels was called");
  const publicNovels = (await Novel.find({ isPublic: true })).map((novel) => novel._id);
  console.log(publicNovels);
  return res.status(200).send({ novels: publicNovels });
});

router.get("/next5sounds", async (req, res) => {
  let frameId = req.query.frameId;
  const bgms = [];
  const onPlays = [];

  for (let i = 0; i < 5; i++) {
    const frame = await Frame.findById(frameId);

    if (frame.bgm && !bgms.includes(frame.bgm[0])) {
      bgms.push(frame.bgm[0]);
    }

    if (frame.onPlayAudio && !onPlays.includes(frame.onPlayAudio[0])) {
      onPlays.push(frame.onPlayAudio[0]);
    }
  
    if (frame.nextFrame) {
      frameId = frame.nextFrame;
    } else {
      break;
    }
  }

  return res.status(200).send({bgms: bgms, onPlays: onPlays});
})


router.get("/frameFromSave", async (req, res) => {
  const saveId = req.query.saveId;

  const save = await Save.findById(saveId);
  return res.status(200).send({frameId: save.currentFrameId});
})


//------------------POST-----------------------

const storage = multer.memoryStorage();
const upload = multer({ storage });

// Load service account credentials
// Load service account credentials from an environment variable


router.post("/togglePublic", async (req, res) => {
  const { novelId } = req.body;
  const novel = await Novel.findById(novelId);
  novel.isPublic = !novel.isPublic;
  await novel.save();
  return res.status(200).send({ msg: "swapped!" });
});

router.post("/imgUp", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send({ msg: "No File Upload" });
  }

  const { name, frameId, type } = req.body;

  try {
    // Call the uploadToImgur function with the image buffer
    const imageUrl = await imgur.uploadToImgur(req.file.buffer);
    const frame = await Frame.findById(frameId);
    const novelId = frame.novelId;
    const novel = await Novel.findById(novelId);
    if (type === "bg") {
      novel.backgrounds = [...(novel.backgrounds || []), { name: name, link: imageUrl }];
      frame.background = imageUrl;
    } else {
      novel.sprites = [...(novel.sprites || []), { name: name, link: imageUrl }];
      switch (type) {
        case "left":
          frame.spriteLeft = imageUrl;
          break;
        case "mid":
          frame.spriteMid = imageUrl;
          break;
        case "right":
          frame.spriteRight = imageUrl;
          break;
      }
    }
    await novel.save();
    await frame.save();
    res.status(200).send({ link: imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).send({ msg: "Failed to upload image" });
  }
});

//@TODO convert audio to mp3 and put a fairly low bit rate for storage reasons
router.post("/audioUp", upload.single("audio"), async (req, res) => {

  const { name, frameId, type } = req.body;

  const extension = path.extname(req.file.originalname).slice(1);
  const supportedExtensions = ["mp3", "wav", "aac", "ogg", "flac", "m4a", "amr"];
  if (!supportedExtensions.includes(extension.toLowerCase())) {
    throw new Error(`Unsupported audio format: ${extension}`);
  }

  const fileData = await audioUpload.uploadFileToDrive(req.file);

  const result = [fileData.id]
  const frame = await Frame.findById(frameId);
  const novelId = frame.novelId;
  const novel = await Novel.findById(novelId);

  if (type == "bgm") {
    novel.bgms = [...(novel.bgms || []), { name: name, links: result }];
    frame.bgm = result;
  } else {
    novel.onPlayAudios = [...(novel.onPlayAudios || []), { name: name, links: result }];
    frame.onPlayAudio = result;
  }

  await novel.save();
  await frame.save();

  return res.status(200).send({ fileId: fileData.id });
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

  const user = await User.findById(userId);
  const editing = user.editing;
  user.editing = [...editing, { novelId: novelId, frameId: frameId }];
  await user.save();

  return res.status(200).send({ novelId: novelId });
});

router.post("/nextFrame", async (req, res) => {
  console.log("made it here");
  const { oldFrameId } = req.body;

  console.log(oldFrameId);
  oldFrame = await Frame.findById(oldFrameId);
  console.log("Got old frame?");

  const newFrame = new Frame({
    prevFrames: [oldFrame._id],
    novelId: oldFrame.novelId,
    spriteLeft: oldFrame.spriteLeft,
    spriteMid: oldFrame.spriteMid,
    spriteRight: oldFrame.spriteRight,
    background: oldFrame.background,
    bgm: oldFrame.bgm,
  });
  const frame = await newFrame.save();
  oldFrame.nextFrame = frame._id;
  await oldFrame.save();
  return res.status(200).send({ frameId: frame._id });
});

router.post("/setbg", async (req, res) => {
  const { link, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.background = link;
  await frame.save();
  console.log("bg set for " + frameId);
  return res.status(200).send({ link: link });
});

router.post("/setleft", async (req, res) => {
  const { link, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.spriteLeft = link;
  await frame.save();
  return res.status(200).send({ link: link });
});

router.post("/setmid", async (req, res) => {
  const { link, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.spriteMid = link;
  await frame.save();
  return res.status(200).send({ link: link });
});

router.post("/setright", async (req, res) => {
  const { link, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.spriteRight = link;
  await frame.save();
  return res.status(200).send({ link: link });
});

router.post("/setbgm", async (req, res) => {
  const { links, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.bgm = links;
  await frame.save();
  return res.status(200).send({ links: links });
});

router.post("/setonPlay", async (req, res) => {
  const { links, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.onPlayAudio = links;
  await frame.save();
  return res.status(200).send({ links: links });
});

router.post("/setText", async (req, res) => {
  const { text, frameId } = req.body;
  const frame = await Frame.findById(frameId);
  frame.text = text;
  await frame.save();
  return res.status(200).send(text);
});

router.post("/userPlayNew", async (req, res) => {
  const { userId, novelId, frameId } = req.body;
  const user = await User.findById(userId);
  const novel = await Novel.findById(novelId);
  const save = new Save({
    userId: userId,
    novelId: novelId,
    vars: novel.vars,
    currentFrameId: frameId
  });
  const saveId = await save.save()
  user.playing = [...(user.playing || []), { novelId: novelId, saveId: saveId }];
  await user.save();
  return res.status(200).send({saveId: saveId}) ;
});

router.post("/nextFrameSave", async (req, res) => {
  const {saveId, nextFrame} = req.body;
  console.log(saveId)
  try {
    const save = await Save.findById(saveId);
    save.currentFrameId = nextFrame;
    await save.save();
  } catch (error) {
    console.log(error)
    return res.status(404).send("Save not found")
  }
  
  return res.status(200).send({nextFrame: nextFrame});
});

//-----------------MISC----------------------------

// anything else falls to this "not found" case
router.all("*", (req, res) => {
  console.log(`API route not found: ${req.method} ${req.url}`);
  res.status(404).send({ msg: "API route not found" });
});

module.exports = router;
