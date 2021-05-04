const express = require("express");
const nconf = require("nconf");
const bodyParser = require("body-parser");
const chalk = require("chalk");
const path = require("path");
const app = express();

// load config file
nconf
  .argv()
  .env()
  .file({
    file: __dirname + "/config.json",
  });

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// disable some headers
app.disable("etag");
app.disable("x-powered-by");

// routes
app.use("/api/users", require("./routes/users"));
// verify tokens
app.use(require('./middleware/verifyToken'));
// wallet routes
app.use("/api/wallets",require('./routes/wallet'));
// transaction routes
app.use("/api/transactions",require('./routes/transaction'));
// start the app

// 404
app.use(function (req, res, next) {
  res.status(404).render("404");
});

// error handling routes
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).send("Server Error");  
});

app.listen(nconf.get("port") || 3000);
console.log("App Started...");
