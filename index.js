require("dotenv").config();
const express = require("express");
const cookieParser = require("cookie-parser");
const cookieEncrypter = require("cookie-encrypter");
const app = express();

const SECRET = "thirtytwobitORthirtytwocharacter";

app.use(cookieParser(SECRET));
app.use(cookieEncrypter(SECRET));
app.use(express.json());

app.get("/", (req, res) => {
  res.send({ message: "hello" });
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
