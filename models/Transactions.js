const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    senderEmail: {
        type: String
    },
    recieverEmail: {
        type: String
    },
    amountSent: {
        type: Number,
        default: 0
    },
    senderPledgeType: {
        type: String
    },
    recieverPledgeType: {
        type: String
    },
    dateOfTransaction: {
        type: Date
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;