const createError = require("http-errors");
const express = require("express");
const path = require("path");
const logger = require("morgan");
const session = require("express-session");
const passport = require("passport");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const flash = require("connect-flash");
const expressLayouts = require("express-ejs-layouts");
const methodOverride = require("method-override");

// load config file
dotenv.config({ path: "./config/config.env" });

// initialize express
const app = express();

//cors middleware for cross origin requests
app.use(cors());

// passer
app.use(
  express.urlencoded({
    extended: false,
  })
);

//Express session
app.use(
  session({
    secret: process.env.APP_SECRET,
    resave: true,
    saveUninitialized: true,
  })
);

//mongoose mongodb connection
const db = process.env.MONGODB_URI || process.env.DATABASE;

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .catch((err) => console.log(err))
  .then(console.log("connected to database"));

// Passport Config
require("./config/passport")(passport);

// Connect flash
app.use(flash());

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

//Global variables
app.use(function (req, res, next) {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  next();
});

//serve static assets
app.use("/static", express.static("public"));

// view engine setup                                       
app.use(express.static(__dirname + "/public"));  
app.use(expressLayouts); 
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json()); 

app.use(methodOverride("_method"));

//routes
app.use("/", require("./routes/index"));
app.use("/users", require("./routes/users"));
app.use("/admin", require("./routes/admin"));
app.use("/blog", require("./routes/blog"));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
