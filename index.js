if (process.env.NODE_ENV === "undefined") require("dotenv").config();
const path = require("path");
const express = require("express");
const cookieParser = require("cookie-parser");
const cookieEncrypter = require("cookie-encrypter");
const app = express();

const SECRET = "thirtytwobitORthirtytwocharacter";
const MODULES_PATH = path.join(__dirname, "node_modules");
const ICON_PATH = path.join(
  MODULES_PATH,
  "semantic-ui-icon",
  "assets",
  "fonts"
);

app.use(cookieParser(SECRET));
app.use(cookieEncrypter(SECRET));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(MODULES_PATH));
app.use(express.static(path.join(MODULES_PATH, "jquery")));
app.use(express.static(path.join(MODULES_PATH, "semantic-ui-css")));
app.use(express.static(path.join(MODULES_PATH, "semantic-ui-icon")));

//
//
// Getting module static files

app.get("/modules/semantic/css", (req, res) => {
  res.sendFile(path.join(MODULES_PATH, "semantic-ui-css", "semantic.min.css"));
});

app.get("/modules/semantic/js", (req, res) => {
  res.sendFile(path.join(MODULES_PATH, "semantic-ui-css", "semantic.min.js"));
});

app.get(
  "/modules/semantic/themes/default/assets/fonts/icons.woff",
  (req, res) => {
    res.sendFile(path.join(ICON_PATH, "icons.woff"));
  }
);

app.get(
  "/modules/semantic/themes/default/assets/fonts/icons.woff2",
  (req, res) => {
    res.sendFile(path.join(ICON_PATH, "icons.woff2"));
  }
);

app.get("/modules/jquery", (req, res) => {
  res.sendFile(path.join(MODULES_PATH, "jquery", "dist", "jquery.min.js"));
});

//
//
// Api routes

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/set", (req, res) => {
  const cookieParams = {
    httpOnly: true,
    signed: true,
    maxAge: 10000, //1000 is 1 second
  };
  res.cookie("testsigned", "mytextisencrypted", cookieParams);
  res.cookie("testplain", "mytextisnotencrypted", { plain: true });
  res.end("new cookies set");
});

app.get("/get", (req, res) => {
  const plain = req.cookies;
  const signed = req.signedCookies;
  res.send({
    plain,
    signed,
  });
});

app.get("/clear/:name", (req, res) => {
  const name = req.params.name;
  res.clearCookie(name);
  res.end("Cookies deleted");
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening to port ${PORT}...`));
