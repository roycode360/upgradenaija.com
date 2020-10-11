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
  referral_code: {
    type: String
  },
  promo_code: {
    type: String
  },
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
    type: Number,
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
    accType: {
      type: String
    },
    bank: {
      type: String
    },
    phoneNo: {
      type: String
    },
    pledgeAmount: {
      type: Number,
      default: 0
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
        type: Number,
        default: 0
      },
      payed: {
        type: Boolean,
        default: false
      },
      identification: {
        type: mongoose.Schema.Types.ObjectId
      }
    }],
    statistics: {
      pledged: {
        type: Number,
        default: 0
      },
      type: {
        type: String
      },
      expect: {
        type: Number,
        default: 0
      },
      matched: {
        type: Number,
        default: 0
      },
      gotten: {
        type: Number,
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
  },
  referralBonus: {
    accName: {
      type: String
    },
    accNumber: {
      type: String
    },
    accType: {
      type: String
    },
    amount: {
      type: Number
    }
  }
});

const User = mongoose.model("User", UserSchema);

module.exports = User;
