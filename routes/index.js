const express = require("express");
const router = express.Router();
const currencyFormatter = require('currency-formatter');
const User = require("../models/User");
const { getDatabaseStats } = require('./stats/dbStats');
const { preAuthenticated, ensureAuthenticated } = require("../config/auth");
const { deadline } = require("./stats/dbStats");

// index Page
router.get("/", (req, res) => res.render("index"));

// about page
router.get("/about", (req, res) => res.render("about"));

router.get("/services", (req, res) => res.render("services"));   

// get dashbord for user 
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  const formatAmount = (amount) => currencyFormatter.format(amount,  { code: 'NG' });
  res.render("dashboard", {
    user: req.user,
    deadline,
    formatAmount
  }); 
});

// get dashboard for admin
router.get("/admin", preAuthenticated, async (req, res) => {
  const { admin, users, totalUsers, dbPledgeInfo, dbMatchedInfo, dbPendingInfo, dbUnpaidInfo } = await getDatabaseStats();
  const adminName = admin.name.split(' ')[0];
  const formatAmount = (amount) => currencyFormatter.format(amount,  { code: 'NG' });
  res.render("admin", {
    // admin: req.user, used later DO NOT REMOVE!
    admin,
    adminName,
    users,
    formatAmount,
    totalUsers,
    dbPledgeInfo, 
    dbMatchedInfo,
    dbPendingInfo,
    dbUnpaidInfo
  });
});

module.exports = router;
