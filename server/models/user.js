const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  name: String,
  googleid: String,
  playing: [{ novelId: mongoose.Schema.Types.ObjectId, saveId: mongoose.Schema.Types.ObjectId }],
  editing: [
    {
      novelId: mongoose.Schema.Types.ObjectId,
      frameId: mongoose.Schema.Types.ObjectId, //id of last frame opened
    },
  ],
});

// compile model from schema
module.exports = mongoose.model("user", UserSchema);
