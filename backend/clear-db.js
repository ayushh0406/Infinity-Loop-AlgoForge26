require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Pool = require('./models/Pool');
const Transaction = require('./models/Transaction');
const Loan = require('./models/Loan');

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://panigrahibalram16:Ping420+@cluster0.ne7hd.mongodb.net/Trustpool';

async function clearDB() {
    try {
        console.log("Connecting to MongoDB Atlas...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected \u2705");

        console.log("Clearing Users...");
        await User.deleteMany({});
        
        console.log("Clearing Pools...");
        await Pool.deleteMany({});
        
        console.log("Clearing Transactions...");
        await Transaction.deleteMany({});

        if(Loan) {
            console.log("Clearing Loans...");
            await Loan.deleteMany({});
        }

        console.log("\n=========================");
        console.log("\u2728 MongoDB completely CLEARED!");
        console.log("=========================\n");

        process.exit(0);
    } catch (err) {
        console.error("Error clearing DB:", err);
        process.exit(1);
    }
}

clearDB();
