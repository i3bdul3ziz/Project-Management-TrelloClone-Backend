const mongoose = require("mongoose");
const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: String,
    email: {
      type: String,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    resetPasswordExpires: Date,
    resetPasswordToken: String,
    projects: [
      {
        project: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Project",
        },
        havePermission: Boolean,
      },
    ],
  },
  { timetamps: true }
);

const User = mongoose.model("User", userSchema);
module.exports = User;
