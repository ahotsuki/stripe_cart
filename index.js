require("dotenv").config();

const bcrypt = require("bcrypt");
const saltRounds = 5;
// const pd = "hello";

// bcrypt.hash(pd, saltRounds, (err, hash) => {
//   if (err) return console.error(err);
//   console.log(hash);
//   bcrypt.compare("hola", hash, (e, r) => console.log(r));
// });

const path = require("path");
const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const cookieParser = require("cookie-parser");
const cookieEncrypter = require("cookie-encrypter");
const DB = require("./db/index");
const app = express();

//
//
// Global vars

const ENC_SECRET_KEY = process.env.COOKIE_ENC_KEY;
const MODULES_PATH = path.join(__dirname, "node_modules");
const ICON_PATH = path.join(
  MODULES_PATH,
  "semantic-ui-icon",
  "assets",
  "fonts"
);
const cookieParams = {
  httpOnly: true,
  signed: true,
  maxAge: 3600000, //1000 is 1 second
};

//
//
// Middlewares

app.use(cookieParser(ENC_SECRET_KEY));
app.use(cookieEncrypter(ENC_SECRET_KEY));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(MODULES_PATH));
app.use(express.static(path.join(MODULES_PATH, "jquery")));
app.use(express.static(path.join(MODULES_PATH, "semantic-ui-css")));
app.use(express.static(path.join(MODULES_PATH, "semantic-ui-icon")));

//
//
// Getting module static files for browser imports

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

app.post("/api/signup", async (req, res) => {
  console.log(req.body);
  const customer = await stripe.customers.create({
    email: req.body.email,
  });
  // console.log(customer); // save customer with customer.id
  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    if (err) return console.error(err);
    const data = { id: customer.id, email: req.body.email, password: hash };
    DB.addUser(data);
    res.cookie("x-auth", data, cookieParams);
    res.end("signed");
  });
});

app.post("/api/login", (req, res) => {
  const user = req.body;
  console.log(user);
  const USERS = DB.getUsers();
  console.log(USERS);
  const index = USERS.findIndex((item) => item.email === user.email);
  if (index === -1) return res.status(404).end();
  bcrypt.compare(user.password, USERS[index].password, (err, r) => {
    if (!r) return res.send({ message: "Wrong password!" });
    res.cookie("x-auth", USERS[index], cookieParams);
    res.send({});
  });
});

app.get("/cookie/get", (req, res) => {
  const plain = req.cookies;
  const signed = req.signedCookies;
  res.send({
    signed,
  });
});

app.get("/cookie/clear/:name", (req, res) => {
  const name = req.params.name;
  res.clearCookie(name);
  res.end("Cookies deleted");
});

app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1JcUrcFayxrrdcjLfwmE0549",
          quantity: 1,
        },
      ],
      customer: "cus_KHN7c9t9pzHN9Z",
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `http://localhost:3000/success.html`,
      cancel_url: `http://localhost:3000/cancel.html`,
    });
    res.redirect(303, session.url);
  } catch (ex) {
    console.log(ex);
    res.end();
  }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening to port ${PORT}...`));
