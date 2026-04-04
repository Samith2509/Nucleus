require('dotenv').config();
const mongoose = require('mongoose');
const Event = require('./src/models/Event');

const checkDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const r = await Event.aggregate([
            { $match: { feature: 'AUTH_001' } },
            { $group: { _id: '$feature', userIds: { $addToSet: '$userId' }, total: { $sum: 1 } } }
        ]);
        console.dir(r, { depth: null });
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};
checkDB();
