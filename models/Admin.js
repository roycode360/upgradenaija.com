const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  admin: {
    type: Boolean,
    default: true
  },
  totalAmount: {
    type: Number,
    default: 0
  }
});

const Admin = mongoose.model("Admin", AdminSchema);

module.exports = Admin;