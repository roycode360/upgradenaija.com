const currencyFormatter = require('currency-formatter');
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
    const totalPledgeNaira = await User.find({ status: 'pledged', $or: [{'pledge.pledgeType': 'silver'}, {'pledge.pledgeType': 'gold'}]});
    const totalPledgeDollar = await User.find({ status: 'pledged', 'pledge.pledgeType': `bitcoin` });
    const totalMatchedNaira = await User.find({ status: 'matched', $or: [{'pledge.pledgeType': 'silver'}, {'pledge.pledgeType': 'gold'}]});
    const totalMatchedDollar = await User.find({ status: 'matched', 'pledge.pledgeType': `bitcoin` });
    const totalPendingNaira = await User.find({ status: 'awaiting payment', $or: [{'pledge.pledgeType': 'silver'}, {'pledge.pledgeType': 'gold'}]});
    const totalPendingDollar = await User.find({ status: 'awaiting payment', 'pledge.pledgeType': `bitcoin` });
    const totalUnpaidNaira = await User.find({ status: 'expecting payment', $or: [{'pledge.pledgeType': 'silver'}, {'pledge.pledgeType': 'gold'}]});
    const totalUnpaidDollar = await User.find({ status: 'expecting payment', 'pledge.pledgeType': `bitcoin` });

    const dbPledgeNaira = {
        count: totalPledgeNaira.length,
        totalAmount: getAmount(totalPledgeNaira)
    };
    const dbPledgeDollar = {
        count: totalPledgeDollar.length,
        totalAmount: getAmount(totalPledgeDollar)
    };

    const dbMatchedNaira = {
        count: totalMatchedNaira.length,
        totalAmount: getAmount(totalMatchedNaira)
    }
    const dbMatchedDollar = {
        count: totalMatchedDollar.length,
        totalAmount: getAmount(totalMatchedDollar)
    }

    const dbPendingNaira = {
        count: totalPendingNaira.length,
        totalAmount: getAmount(totalPendingNaira)
    }
    const dbPendingDollar = {
        count: totalPendingDollar.length,
        totalAmount: getAmount(totalPendingDollar)
    }

    const dbUnpaidNaira = {
        count: totalUnpaidNaira.length,
        totalAmount: getAmount(totalUnpaidNaira)
    }
    const dbUnpaidDollar = {
        count: totalUnpaidDollar.length,
        totalAmount: getAmount(totalUnpaidDollar)
    }

    return {
        admin,
        users,
        transactions,
        totalUsers,
        dbPledgeNaira,
        dbPledgeDollar,
        dbMatchedNaira,
        dbMatchedDollar,
        dbPendingNaira,
        dbPendingDollar,
        dbUnpaidNaira,
        dbUnpaidDollar
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
        deadllineArr = date.addDays(now, + 30).toString().split(' ');
        deadllineDay = `${deadllineArr[0]} ${deadllineArr[1]} ${deadllineArr[2]} ${deadllineArr[3]} ${deadllineArr[4]}`;
    }  else if (progress === 'awaiting payment' && type === 'silver') {
        const now = new Date();
        deadllineArr = date.addDays(now, + 13).toString().split(' ');
        deadllineDay = `${deadllineArr[0]} ${deadllineArr[1]} ${deadllineArr[2]} ${deadllineArr[3]} ${deadllineArr[4]}`;
    }  else if (progress === 'awaiting payment' && type === 'bitcoin') {
        const now = new Date();
        deadllineArr = date.addDays(now, + 30).toString().split(' ');
        deadllineDay = `${deadllineArr[0]} ${deadllineArr[1]} ${deadllineArr[2]} ${deadllineArr[3]} ${deadllineArr[4]}`;
    }

    return deadllineDay;
}

const profit = (type, amount) => {
    if (type === 'gold') {
        return amount + (amount * 0.5);
    } else if (type === 'silver') {
        return amount + (amount * 0.25);
    } else if (type === 'bitcoin') {
        return amount + (amount * 0.30);
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