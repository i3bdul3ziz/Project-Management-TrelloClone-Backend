const mongoose = require("mongoose");
const projectSchema = new mongoose.Schema(
  {
    projectName: {
      type: String,
    },
    cards: [
      {
        _id: mongoose.Types.ObjectId,
        title: String,
        items: [
          {
            taskTitle: String,
          },
        ],
      },
    ],
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    havePermission: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema);
module.exports = Project;
