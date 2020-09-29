const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const Admin = require("../models/Admin");
const User = require('../models/User');
const { profit, calcMatched, deadline } = require('./stats/dbStats');
const { preAuthenticated, postAuthenticated } = require("../config/auth");

// Login Page
router.get("/login", postAuthenticated, (req, res) => res.render("adminLogin"));

// Register Page
router.get("/register", postAuthenticated, (req, res) =>
  res.render("adminReg")
);

// Register
router.post("/register", (req, res) => {
  const { name, email, password, password2 } = req.body;
  let errors = [];

  if (!name || !email || !password || !password2) {
    errors.push({
      msg: "Please enter all fields",
    });
  }

  if (password != password2) {
    errors.push({
      msg: "Passwords do not match",
    });
  }

  if (password.length < 6) {
    errors.push({
      msg: "Password must be at least 6 characters",
    });
  }

  if (errors.length > 0) {
    res.render("register", {
      errors,
      name,
      email,
      password,
      password2,
    });
  } else {
    Admin.findOne({
      email: email,
    }).then((admin) => {
      if (admin) {
        errors.push({
          msg: "Email already exists",
        });
        res.render("register", {
          errors,
          name,
          email,
          password,
          password2,
        });
      } else {
        const newAdmin = new Admin({
          name,
          email,
          password,
        });


        bcrypt.genSalt(10, (err, salt) => {
          bcrypt.hash(newAdmin.password, salt, (err, hash) => {
            if (err) throw err;
            newAdmin.password = hash;
            newAdmin
              .save()
              .then((admin) => {
                req.flash(
                  "success_msg",
                  "You are now registered. please log in"
                );
                res.redirect("/admin/login");
              })
              .catch((err) => console.log(err));
          });
        });
      }
    });
  }
});

// Login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/admin",
    failureRedirect: "/admin/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/admin/login");
});

// post to match
router.post("/match", preAuthenticated, async (req, res) => {
  try {
    const sender = await User.findOne({ email: req.body.S_email});
    const reciever = await User.findOne({ email: req.body.R_email});
    console.log(sender);
    console.log(reciever);

    // updating details to sender
    sender.paymentDetails.payAcc = reciever.pledge.accNumber;
    sender.paymentDetails.payName = reciever.pledge.accName;
    sender.paymentDetails.payBank = reciever.pledge.bank;
    sender.paymentDetails.payPhone = reciever.pledge.phoneNo;
    // update progress
    sender.progress = {
      matched: true,
      matchedFund: false,
      pledge: false,
      awaitingFund: false
    };
    // update status
    sender.status = 'matched';
    // update amount
    sender.amount = sender.pledge.pledgeAmount;
    // update deadline
    sender.deadline = deadline('matched');

    // Updating details to reciver 
    // update status
    reciever.status = 'expecting payment';
    // update progress
    reciever.progress = {
      matched: false,
      matchedFund: true,
      pledge: false,
      awaitingFund: false
    };
    // update sender details
    reciever.expectedFunds.users.push({
      senderName: sender.name,
      senderNumber: sender.pledge.phoneNo,
      senderAmount: sender.pledge.pledgeAmount,
      payed: false,
      identification: sender._id
    });
    // statistics
    reciever.expectedFunds.statistics = {
      pledged: reciever.pledge.pledgeAmount,
      type: reciever.pledge.pledgeType,
      expect: profit(reciever.pledge.pledgeType, reciever.pledge.pledgeAmount),
      matched: calcMatched(reciever.expectedFunds.statistics.matched, sender.pledge.pledgeAmount)
    }
    // update amount
    reciever.amount = profit(reciever.pledge.pledgeType, reciever.pledge.pledgeAmount);
    // update deadline
    reciever.deadline = deadline('expecting payment');

    // Save both user documents
    await sender.save();
    reciever.save().then(
      (Match) => res.redirect("/admin"),
      req.flash(
        "success_msg",
        "Users have been matched!"
      )
    );
  } catch(e) {
    console.log(e)
    req.flash("error_msg", "Invalid Input");
    res.redirect("/admin");
  }
});

module.exports = router;
  