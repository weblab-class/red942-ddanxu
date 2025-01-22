const mongoose = require("mongoose");

const Novel = new mongoose.Schema({
  name: String,
  startFrameId: mongoose.Schema.Types.ObjectId,
  thumbnail: String,
  vars: [{ name: String, defaultVal: mongoose.Schema.Types.Mixed }], //varibles that arise from player choices
  editors: [mongoose.Schema.Types.ObjectId], //stored as userIds 
  backgrounds: [{ name: String, link: String }],
  sprites: [{ name: String, link: String }], //sprites used in novel, link is to imgur from api
  onPlayAudios: [{ name: String, links: [String] }],
  bgms: [{ name: String, links: [String] }],
  isPublic: {type: Boolean, default: false}
});

const Save = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId, 
  novelId: mongoose.Schema.Types.ObjectId,
  vars: [{ name: String, val: mongoose.Schema.Types.Mixed }],
  currentFrameId: mongoose.Schema.Types.ObjectId,
});

module.exports = {
  Novel: mongoose.model("novel", Novel),
  Save: mongoose.model("save", Save),
};
