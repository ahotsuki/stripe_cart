const path = require("path");
const fs = require("fs");

const productsDB = path.join(__dirname, "products.json");
const usersDB = path.join(__dirname, "users.json");

function readDB(db) {
  try {
    const result = fs.readFileSync(db);
    return JSON.parse(result);
  } catch (ex) {
    console.error(ex);
  }
}

function writeDB(db, data) {
  try {
    fs.writeFileSync(db, JSON.stringify(data));
    return data;
  } catch (ex) {
    console.error(ex);
  }
}

function addUser(user) {
  const data = readDB(usersDB);
  data.push(user);
  writeDB(usersDB, data);
  return user;
}

function getUsers() {
  return readDB(usersDB);
}

function getProducts() {
  return readDB(productsDB);
}

module.exports = {
  getProducts,
  addUser,
  getUsers,
};
