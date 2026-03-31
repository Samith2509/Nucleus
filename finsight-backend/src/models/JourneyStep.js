const mongoose = require('mongoose');

const journeyStepSchema = new mongoose.Schema({
  journeyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Journey',
    required: true
  },
  stepOrder: {
    type: Number,
    required: true
  },
  stepName: {
    type: String,
    required: true
  },
  featureCode: {
    type: String,
    required: true
  }
});

const JourneyStep = mongoose.model('JourneyStep', journeyStepSchema);

module.exports = JourneyStep;
