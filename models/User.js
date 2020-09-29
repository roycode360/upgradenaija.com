const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
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
    default: new Date(),
  },
  deadline: {
    type: String
  },
  status: {
    type: String
  },
  amount: {
    type: String,
    default: 0
  },
  paymentDetails: {
    payAcc: {
      type: String
    },
    payName: {
      type: String
    },
    payBank: {
      type: String
    },
    payPhone: {
      type: String
    },
    confirm: {
      type: Boolean,
      default: false
    }
  },
  pledge: {
    accName: {
      type: String
    },
    accNumber: {
      type: String
    },
    bank: {
      type: String
    },
    phoneNo: {
      type: String
    },
    pledgeAmount: {
      type: String
    },
    pledgeType: {
      type: String
    }
  },
  expectedFunds: {
    users: [{
      senderName: {
        type: String
      },
      senderNumber: {
        type: String
      },
      senderAmount: {
        type: String
      },
      payed: {
        type: Boolean
      },
      identification: {
        type: mongoose.Schema.Types.ObjectId
      }
    }],
    statistics: {
      pledged: {
        type: String
      },
      type: {
        type: String
      },
      expect: {
        type: String
      },
      matched: {
        type: String,
        default: 0
      },
      gotten: {
        type: String,
        default: 0
      }
    }
  },
  progress: {
    pledge: {
      type: Boolean,
      default: false
    },
    matched: {
      type: Boolean,
      default: false
    },
    awaitingFund: {
      type: Boolean,
      default: false
    },
    matchedFund: { 
      type: Boolean,
      default: false
    }
  }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
