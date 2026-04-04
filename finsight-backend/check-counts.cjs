const mongoose = require('mongoose');
require('dotenv').config();
mongoose.connect(process.env.MONGO_URI).then(async () => {
    const Event = require('./src/models/Event');
    const cloudCount = await Event.countDocuments({ 'metadata.deploymentType': 'CLOUD' });
    const allCount = await Event.countDocuments({});
    console.log('CLOUD Count:', cloudCount);
    console.log('ALL Count:', allCount);
    process.exit();
});
