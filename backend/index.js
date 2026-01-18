const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/authRoutes");
const referendumRoutes = require("./routes/referendumRoutes");
const voteRoutes = require("./routes/voteRoutes");
const supportRoutes = require("./routes/supportRoutes");

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.error(err));

app.use("/api/auth", authRoutes);
app.use("/api/referendums", referendumRoutes);
app.use("/api/votes", voteRoutes);

app.use("/api/support", supportRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
