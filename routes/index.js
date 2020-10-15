const express = require("express");
const router = express.Router();
const currencyFormatter = require('currency-formatter');
const dateFormat = require('dateformat');
const User = require("../models/User");
const { getDatabaseStats } = require('./stats/dbStats');
const { preAuthenticated, ensureAuthenticated } = require("../config/auth");
const { deadline } = require("./stats/dbStats");
const Admin = require("../models/Admin");

// index Page
router.get("/", (req, res) => res.render("index"));

// about page
router.get("/about", (req, res) => res.render("about"));

router.get("/services", (req, res) => res.render("services"));   

// get dashbord for user 
router.get("/dashboard", ensureAuthenticated, async (req, res) => {
  const formatAmount = (amount) => currencyFormatter.format(amount,  { code: 'NG' });
  const referrals = await User.find({ referral_code: req.user.promo_code });
  const admin = await Admin.findOne({ admin: true });
  res.render("dashboard", {
    user: req.user,
    admin,
    referrals,
    currencyFormatter,
    deadline,
    formatAmount
  }); 
});

// get dashboard for admin
router.get(`/${process.env.ADMIN_ROUTE}`, preAuthenticated, async (req, res) => {
  const { admin, users, transactions, totalUsers, dbPledgeNaira, dbPledgeDollar, dbMatchedNaira, dbMatchedDollar, dbPendingNaira, dbPendingDollar, dbUnpaidNaira, dbUnpaidDollar } = await getDatabaseStats();
  const formatAmount = (amount) => currencyFormatter.format(amount, 'NG');
  const formatDate = (date) => dateFormat(date);
  console.log();
  res.render(`admin`, {
    // admin: req.user, used later DO NOT REMOVE!
    admin,
    users,
    transactions,
    formatAmount,
    formatDate,
    totalUsers,
    dbPledgeNaira,
    dbPledgeDollar,
    dbMatchedNaira,
    dbMatchedDollar,
    dbPendingNaira,
    dbPendingDollar,
    dbUnpaidNaira,
    dbUnpaidDollar,
  });
});

module.exports = router;
