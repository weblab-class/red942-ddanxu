const mongoose = require("mongoose");

const Frame = new mongoose.Schema({
  nextFrame: mongoose.Schema.Types.ObjectId, //id of the next frame
  prevFrames: [mongoose.Schema.Types.ObjectId], //ids of the previous frame (arr because could be multiple if paths converge here)
  spriteLeft: String, //sprite on the left side of screen
  spriteMid: String,
  spriteRight: String,
  background: String,
  bgmLink: String, //link to imgur background music mp4
  onPlayAudio: String, //audio for when the frame is played, does not continue
  text: String, //text displayed for this frame
  novelId: mongoose.Schema.Types.ObjectId, //id of novel that the frame is apart of
  isBranch: {type: Boolean, default: false},
});

const BranchFrame = new mongoose.Schema({
  nextFrame: [
    {
      //this should be the names of the variables along with the needed value to go to the target frame
      conditions: [{ name: String, value: mongoose.Schema.Types.Mixed }],
      targetFrame: mongoose.Schema.Types.ObjectId,
    },
  ],
  defaultFrame: mongoose.Schema.Types.ObjectId, //backup frame if none of the conditions matched up
  isBranch: {type: Boolean, default: true},
});

BranchFrame.add(Frame);

const ChoiceFrame = new mongoose.Schema({
  conditionName: String, //name of the variabe, see nextFrame in branchFrame
  options: [{ optionText: String, value: mongoose.Schema.Types.Mixed }], //optionText is what associated text will be shown to the user
});

ChoiceFrame.add(Frame);

module.exports = {
  Frame: mongoose.model("frame", Frame),
  ChoiceFrame: mongoose.model("choiceFrame", ChoiceFrame),
  BranchFrame: mongoose.model("branchFrame", BranchFrame),
};
