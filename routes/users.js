const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const date = require('date-and-time');
const currencyFormatter = require('currency-formatter');
const shortid = require('shortid');
const User = require("../models/User");
const Admin = require('../models/Admin');
const Transaction = require('../models/Transactions');
const { profit } = require('./stats/dbStats');
const { deadline } = require('./stats/dbStats');
const {
  ensureAuthenticated,
  forwardAuthenticated,
  preAuthenticated,
} = require("../config/auth");

// Login Page
router.get("/login", forwardAuthenticated, (req, res) => res.render("login"));

// Register Page
router.get("/register", forwardAuthenticated, (req, res) =>
  res.render("register")
);

// Register
router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      password2,
      referral_code
    } = req.body;
    let referralObjId;
    const invite = await User.findOne({ promo_code: referral_code });
    if (invite) {
      referralObjId = invite._id;
    }
    if (referral_code && !invite) {
      throw new Error(`Invalid referrer code!`);
    }
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
      User.findOne({
        email: email,
      }).then((user) => {
        if (user) {
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
          const newUser = new User({
            name,
            email,
            password,
            referral_code,
            promo_code: `${name.split(' ')[0]}/${shortid.generate()}`,
            referralId: referralObjId
          });
  
          bcrypt.genSalt(10, (err, salt) => {
            bcrypt.hash(newUser.password, salt, async (err, hash) => {
              if (err) throw err;
              newUser.password = hash;
              await newUser.save()
                  req.flash("success_msg", "You are now registered and can log in");
                  res.redirect("/users/login");
            });
          });
        }
      });
    }
  } catch (e) {
    req.flash("error_msg", `${e}`);
    res.redirect("/users/register");
  }
});

// Login
router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/users/login",
    failureFlash: true,
  })(req, res, next);
});

// Logout
router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "You are logged out");
  res.redirect("/users/login");
});

// post to pledge
router.post("/pledge", ensureAuthenticated, async (req, res) => {
  if (req.user.status === 'pledged' || req.user.status === 'matched' || req.user.status === 'awaiting payment' || req.user.status === 'expecting payment') {
    // User in ongoing transaction
    req.flash("error_msg", "Unfinished transaction. You can't pledge again until after recieving funds for current pledge!");
    res.redirect('/dashboard')
  } else {
    // Update user pledge info
    req.user.pledge.accName = req.body.accountName;
    req.user.pledge.accNumber = req.body.accountNumber;
    req.user.pledge.accType = req.body.accountType;
    req.user.pledge.bank = req.body.bank;
    req.user.pledge.phoneNo = req.body.phoneNumber;
    req.user.pledge.pledgeAmount = req.body.pledgeAmount;
    req.user.pledge.pledgeType = req.body.pledgeType;

    // set user progress
    req.user.progress.pledge = true;
    req.user.progress.matched = false;
    req.user.progress.matchedFund = false;
    req.user.progress.awaitingFund = false;
    // update user status
    req.user.status = 'pledged';
    // update amount info
    req.user.amount = req.body.pledgeAmount;
    // set deadline
    req.user.deadline = deadline('pledged');

    // set expected amount
    req.user.expectedFunds.statistics.expect = profit(req.user.pledge.pledgeType, req.user.pledge.pledgeAmount);

    // Save user
    await req.user.save();
    req.flash( "success_msg", "Request successful! You would be matched with a user within 24 hours");
    res.redirect("/dashboard");
  }
});

// confirm a pledge
router.post("/pledge/confirm", ensureAuthenticated, async (req, res) => {
  try {
    const senderId = req.user.expectedFunds.users[req.query.num].identification;
    const sender = await User.findOne({ _id: senderId });
    
    // update sender details
    // update progress
    sender.progress = {
      awaitingFund: true,
      pledge: false,
      matchedFund: false,
      matched: false
    }
    // update deadline
    sender.deadline = deadline('awaiting payment', sender.pledge.pledgeType);

    // update status
    sender.status = 'awaiting payment';

    // update amount
    sender.amount = profit(sender.pledge.pledgeType, sender.pledge.pledgeAmount);

    // update referral payment
    const referrer = await User.findOne({promo_code: sender.referral_code});
    if (referrer) {
      sender.referralBonus.accName = referrer.pledge.accName;
      sender.referralBonus.accNumber = referrer.pledge.accNumber;
      sender.referralBonus.accType = referrer.pledge.accType;
      sender.referralBonus.amount = (sender.pledge.pledgeAmount * 0.05);
    }

    // create a new transaction model and save this confirmed transaction
    const transaction = new Transaction({
      senderEmail: sender.email,
      recieverEmail: req.user.email,
      amountSent: req.user.expectedFunds.users[req.query.num].senderAmount,
      senderPledgeType: sender.pledge.pledgeType,
      recieverPledgeType: req.user.pledge.pledgeType,
      dateOfTransaction: new Date()
    })
    // save transaction information
    await transaction.save();

    // update total amount field in admin
    const admin = await Admin.findOne({admin: true});
    admin.totalAmountNaira += req.user.expectedFunds.users[req.query.num].senderAmount;
    // save admin
    await admin.save();

    // update user details
    if((req.user.expectedFunds.statistics.matched === req.user.expectedFunds.statistics.expect) && req.user.expectedFunds.users.length === 1) {
      // this means all funds have been confirmed
      // empty paymentDetails
      req.user.paymentDetails = {};
      // empty progress
      req.user.progress = {
        awaitingFund: false,
        pledge: false,
        matchedFund: false,
        matched: false
      };
      // empty pledge
      req.user.pledge = {};
      // empty fund statistics
      req.user.expectedFunds.statistics = {
        matched: 0,
        expect: 0
      };
      // set status to undefined
      req.user.status = undefined;
      // set deadline to undefined
      req.user.deadline = undefined;
      // set amount to 0
      req.user.amount = 0
      // empty users array
      req.user.expectedFunds.users.splice(req.query.num, 1)
    } else {
      // this means some funds have not been confirmed
      req.user.progress = {
        awaitingFund: false,
        pledge: false,
        matchedFund: true,
        matched: false
      };
      // update amount user has been paid so far
      req.user.expectedFunds.statistics.gotten = req.user.expectedFunds.users[req.query.num].senderAmount;
      // update status
      req.user.status = 'expecting payment';
      // update amount
      req.user.amount = req.user.amount - req.user.expectedFunds.users[req.query.num].senderAmount;
      // remove user
      req.user.expectedFunds.users.splice(req.query.num, 1);
    };

    // save both users
    await sender.save();
    await req.user.save();

    req.flash("success_msg", "You have successfully confirmed the user!");
    res.redirect('/dashboard');
  } catch (e) {
    req.flash("error_msg", "Unable to confirm user!");
    res.redirect('/dashboard');
  }
});  

// pledge success
router.get("/success", (req, res) => res.render("success"));
module.exports = router;