const express = require("express");
const app = express();
require("dotenv").config();
const cors = require("cors");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4000;

mongoose
  .connect(
    process.env.MONGO_URI || "mongodb://localhost/prjct-mngmnt",

    { useUnifiedTopology: true, useNewUrlParser: true, useFindAndModify: false }
  )
  .then((res) => {
    console.log("connected");
  })
  .catch((err) => {
    console.log(err);
  });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Starter Routes
app.use("/user", require("./Routes/user"));
app.use("/projects", require("./Routes/projects"));
app.use("", require("./Routes/auth"));

app.listen(PORT, () => {});
