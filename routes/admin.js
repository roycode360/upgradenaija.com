const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const passport = require("passport");
const date = require('date-and-time');
const Admin = require("../models/Admin");
const User = require('../models/User');
const Transaction = require('../models/Transactions');
const {
  profit,
  calcMatched,
  deadline
} = require('./stats/dbStats');
const {
  preAuthenticated,
  postAuthenticated
} = require("../config/auth");

// Login Page
router.get("/login", postAuthenticated, (req, res) => res.render("adminLogin"));

// Register Page
router.get("/register", postAuthenticated, (req, res) =>
  res.render("adminReg")
);

// Register
router.post("/register", (req, res) => {
  const {
    name,
    email,
    password,
    password2
  } = req.body;
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
    const sender = await User.findOne({
      email: req.body.S_email
    });
    const reciever = await User.findOne({
      email: req.body.R_email
    });

    //Validating sender before process of matching 
    if (sender.status === 'matched') {
      throw new Error(`${sender.name.toUpperCase()} is currently matched to another user!`);
    } else if (sender.status !== 'pledged') {
      throw new Error(`${sender.name.toUpperCase()} has no pending pledge at the moment!`);
    }
    //Validating reciever before process of matching 
    if (reciever.status !== 'awaiting payment' && reciever.status !== 'expecting payment') {
      throw new Error(`${reciever.name.toUpperCase()} can't recieve funds yet!`);
    }


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
    // Validating if expected amount of payment has been exceeded
    const x = reciever.expectedFunds.statistics.matched;
    const y = sender.pledge.pledgeAmount;
    const z = reciever.expectedFunds.statistics.expect;
    const w = reciever.amount;
    console.log(x, y, z, w);
    if ((x + y) > z) {
      throw new Error(`₦${(reciever.expectedFunds.statistics.matched + sender.pledge.pledgeAmount) - reciever.expectedFunds.statistics.expect} above ${reciever.name.toUpperCase()} expected match amount!`);
    }

    // statistics
    reciever.expectedFunds.statistics = {
      pledged: reciever.pledge.pledgeAmount,
      type: reciever.pledge.pledgeType,
      expect: profit(reciever.pledge.pledgeType, reciever.pledge.pledgeAmount),
      matched: calcMatched(reciever.expectedFunds.statistics.matched, sender.pledge.pledgeAmount)
    }
    // update amount
    if (reciever.status !== 'expecting payment') {
      reciever.amount = profit(reciever.pledge.pledgeType, reciever.pledge.pledgeAmount);
    } else {
      reciever.amount = reciever.amount;
    }

    // update deadline
    reciever.deadline = deadline('expecting payment');

    // Save both user documents
    await sender.save();
    await reciever.save();
    req.flash("success_msg", "Users have been matched!");
    res.redirect("/admin");

  } catch (e) {
    console.log(e)
    req.flash("error_msg", `${e}`);
    res.redirect("/admin");
  }
});

// post for admin actions
router.post('/actions', preAuthenticated, async (req, res) => {
  try {
    const sender = await User.findOne({
      email: req.body.S_email
    });
    const reciever = await User.findOne({
      email: req.body.R_email
    });
    if (req.body.action_type === 'remove match') {
      // sender updates
      sender.paymentDetails = {};
      sender.pledge = {};
      sender.progress = {
        matched: false,
        matchedFund: false,
        pledge: false,
        awaitingFund: false
      }
      sender.status = undefined;
      sender.amount = '0';
      sender.deadline = undefined;

      // reciever updates
      if (reciever.expectedFunds.users.length > 1) {
        reciever.progress = {
          matched: false,
          matchedFund: true,
          pledge: false,
          awaitingFund: false
        }
        reciever.status = 'expecting payment';
      } else {
        reciever.progress = {
          matched: false,
          matchedFund: false,
          pledge: false,
          awaitingFund: true
        }
        reciever.status = 'awaiting payment';
      }
      reciever.expectedFunds.users.forEach((cur, ind) => {
        console.log(sender._id, cur.identification)
        if (sender._id.toString() === cur.identification.toString()) {
          reciever.expectedFunds.users.splice(ind, 1);
          reciever.expectedFunds.statistics.matched = reciever.expectedFunds.statistics.matched - cur.senderAmount;
          reciever.deadline = deadline('awaiting payment');
        };
      })
    }

    if (req.body.action_type === 'confirm user') {
      let notFound = true;
      if ((reciever.expectedFunds.statistics.matched === reciever.expectedFunds.statistics.expect) && req.user.expectedFunds.users.length === 1) {
        // reciever updates
        reciever.paymentDetails = {};
        reciever.pledge = {};
        reciever.progress = {
          matched: false,
          matchedFund: false,
          pledge: false,
          awaitingFund: false
        }
        reciever.status = undefined;
        reciever.amount = 0;
        reciever.deadline = undefined;
        reciever.expectedFunds.statistics = {
          matched: 0,
          expect: 0
        };
      } else {
        reciever.progress = {
          matched: false,
          matchedFund: true,
          pledge: false,
          awaitingFund: false
        }
        reciever.status = 'expecting payment';
      }
      // sender updates
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

      reciever.expectedFunds.users.forEach(async (cur, ind) => {
        console.log(sender._id, cur.identification)
        if (sender._id.toString() === cur.identification.toString()) {
          notFound = false;
          // update amount user has been paid so far
          reciever.expectedFunds.statistics.gotten = reciever.expectedFunds.users[ind].senderAmount;
          // update amount
          reciever.amount = reciever.amount - reciever.expectedFunds.users[ind].senderAmount;
          // create a new transaction model and save this confirmed transaction
          const transaction = new Transaction({
            senderEmail: sender.email,
            recieverEmail: reciever.email,
            amountSent: reciever.expectedFunds.users[ind].senderAmount,
            senderPledgeType: sender.pledge.pledgeType,
            recieverPledgeType: reciever.pledge.pledgeType,
            dateOfTransaction: new Date()
          })
          // save transaction information
          await transaction.save();

          // update total amount field in admin
          const admin = await Admin.findOne({
            admin: true
          });
          admin.totalAmount += reciever.expectedFunds.users[ind].senderAmount;
          // save admin
          await admin.save();
          // delete sender from reciver's list of unpaid transactions
          reciever.expectedFunds.users.splice(ind, 1);
        };
      })
      if (notFound) {
        throw new Error(`${reciever.name.toUpperCase()}  is not expecting any funds from ${sender.name.toUpperCase()}`)
      }
    }
    // save both users
    await sender.save();
    await reciever.save();
    
    req.flash("success_msg", "Action complete!");
    res.redirect('/admin');
  } catch (e) {
    req.flash("error_msg", `${e}`)
    res.redirect('/admin');
  }
})

module.exports = router;