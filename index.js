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
    const user = req.signedCookies["x-auth"];
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1JcUrcFayxrrdcjLfwmE0549",
          quantity: 1,
        },
      ],
      customer: user.id,
      payment_method_types: ["card"],
      mode: "payment",
      success_url: `http://localhost:3000/success.html`,
      cancel_url: `http://localhost:3000/cancel.html`,
    });
    user.session = session.id;
    const update = DB.updateUser(user);
    res.cookie("x-auth", update, cookieParams);
    res.redirect(303, session.url);
  } catch (ex) {
    console.log(ex);
    res.end();
  }
});

app.get("/retrieve-checkout-session", async (req, res) => {
  try {
    const user = req.signedCookies["x-auth"];
    if (!user.session) return res.end();
    const session = await stripe.checkout.sessions.retrieve(user.session);
    res.send({ url: session.url });
  } catch (ex) {
    console.log(ex);
    res.end();
  }
});

app.get("/cancel-checkout-session", (req, res) => {
  const user = req.signedCookies["x-auth"];
  user.session = "";
  const update = DB.updateUser(user);
  console.log(update);
  res.cookie("x-auth", update, cookieParams);
  res.end();
});

app.get("/success-checkout-session", async (req, res) => {
  const user = req.signedCookies["x-auth"];
  const session = await stripe.checkout.sessions.retrieve(user.session);
  user.session = "";
  const update = DB.updateUser(user);
  res.cookie("x-auth", update, cookieParams);
  const lineItems = [];
  stripe.checkout.sessions.listLineItems(
    session.id,
    { limit: 5 },
    function (err, li) {
      if (err) return console.error(err);
      li.data.forEach((i) => {
        const temp = {};
        temp.id = i.id;
        temp.description = i.description;
        temp.price = i.price.unit_amount;
        temp.currency = i.price.currency;
        temp.quantity = i.quantity;
        lineItems.push(temp);
      });
    }
  );
  const paymentIntent = await stripe.paymentIntents.retrieve(
    session.payment_intent
  );
  const purchase = {
    customer_id: user.id,
    customer_email: session.customer_details.email,
    session_id: session.id,
    price: paymentIntent.amount,
    receipt: paymentIntent.charges.data[0].receipt_url,
    card: paymentIntent.charges.data[0].payment_method_details.card.last4,
    items: lineItems,
  };
  DB.addPurchase(purchase);
  res.send(purchase);
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening to port ${PORT}...`));
