var currencyFormatter = require('currency-formatter');
const dateFormat = require('dateformat');
const User = require('../../models/User');
const Admin = require('../../models/Admin');
const Transactions = require('../../models/Transactions')
const date = require('date-and-time');

const getAmount = (arr) => {
    let add = 0;
    arr.forEach(cur => {
        add += cur.amount;
    });
    return currencyFormatter.format(add,  { code: 'NG' });
}

getDatabaseStats = async () => {
    const admin = await Admin.findOne({admin: true});
    const users = await User.find();
    const transactions = await Transactions.find();
    const totalUsers = await User.find().countDocuments();
    const totalPledge = await User.find({ status: 'pledged'});
    const totalMatched = await User.find({ status: 'matched'});
    const totalPending = await User.find({ status: 'awaiting payment'});
    const totalUnpaid = await User.find({ status: 'expecting payment'});

    const dbPledgeInfo = {
        count: totalPledge.length,
        totalAmount: getAmount(totalPledge)
    };

    const dbMatchedInfo = {
        count: totalMatched.length,
        totalAmount: getAmount(totalMatched)
    }

    const dbPendingInfo = {
        count: totalPending.length,
        totalAmount: getAmount(totalPending)
    }

    const dbUnpaidInfo = {
        count: totalUnpaid.length,
        totalAmount: getAmount(totalUnpaid)
    }

    return {
        admin,
        users,
        transactions,
        totalUsers,
        dbPledgeInfo,
        dbMatchedInfo,
        dbPendingInfo,
        dbUnpaidInfo
    }
};

const deadline = (progress, type) => {
    let deadllineDay;
    // for pledge
    if (progress === 'pledged' || progress === 'expecting payment' || progress === 'matched') {
        const now = new Date();
        deadllineArr = date.addDays(now, + 1).toString().split(' ');
        deadllineDay = `${deadllineArr[0]} ${deadllineArr[1]} ${deadllineArr[2]} ${deadllineArr[3]} ${deadllineArr[4]}`;
    } else if (progress === 'awaiting payment' && type === 'gold') {
        const now = new Date();
        deadllineArr = date.addDays(now, + 13).toString().split(' ');
        deadllineDay = `${deadllineArr[0]} ${deadllineArr[1]} ${deadllineArr[2]} ${deadllineArr[3]} ${deadllineArr[4]}`;
    }  else if (progress === 'awaiting payment' && type === 'silver') {
        const now = new Date();
        deadllineArr = date.addDays(now, + 30).toString().split(' ');
        deadllineDay = `${deadllineArr[0]} ${deadllineArr[1]} ${deadllineArr[2]} ${deadllineArr[3]} ${deadllineArr[4]}`;
    }

    return deadllineDay;
}

const profit = (type, amount) => {
    if (type.toLowerCase() === 'gold') {
        return amount + (amount * 0.5);
    } else {
        return amount + (amount * 0.25);
    }
};

const calcMatched = (init, cur) => {
    const match = init + cur;
    return match
}

module.exports = {
    getDatabaseStats,
    deadline,
    profit,
    calcMatched,
}