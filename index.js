require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const app = express();

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

//Global variables
const randomMax = 100000;

//Mongoose
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const urlSchema = new Schema(
  {
    original_url: { type: String, required: true },
    short_url: { type: Number, required: true, unique: true },
  },
  { versionKey: false }
);

const Url = mongoose.model("Url", urlSchema);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true }));
app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

//Project  endpoints
app.post(
  "/api/shorturl",
  function (req, res, next) {
    const regex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
    const { url } = req.body;
    if (url.match(regex)) {
      next();
    } else {
      res.json({ error: "Invalid URL" });
    }
  },
  async function (req, res) {
    const { url } = req.body;
    const urls = await findUrlByOriginal(url);
    if (urls.length === 0) {
      const newUrl = await saveUrl(url);
      return res.json(parseUrlObject(newUrl));
    }
    const newUrl = urls[0];
    return res.json(parseUrlObject(newUrl));
  }
);

app.get("/api/shorturl/:id", async function (req, res) {
  const { id } = req.params;
  const urls = await findUrlByShort(id);

  return res.redirect(parseUrlObject(urls[0]).original_url);
});

//Helper functions
function generateId() {
  return Math.floor(Math.random() * randomMax);
}

function parseUrlObject(url) {
  return { original_url: url.original_url, short_url: url.short_url };
}

async function saveUrl(url) {
  return await new Url({
    original_url: url,
    short_url: generateId(),
  }).save();
}
async function findUrlByShort(short) {
  return await Url.find({ short_url: short });
}
async function findUrlByOriginal(url) {
  return await Url.find({ original_url: url });
}

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
