const Journey = require('../models/Journey');
const JourneyStep = require('../models/JourneyStep');
const AuditLog = require('../models/AuditLog');

exports.createJourney = async (req, res) => {
  try {
    const { name } = req.body;
    const tenantId = req.user.tenantId;

    const newJourney = new Journey({
      name,
      tenantId
    });

    const savedJourney = await newJourney.save();

    await AuditLog.create({
      tenantId,
      action: 'CREATE_JOURNEY',
      performedBy: req.user.userId
    });

    res.status(201).json({ success: true, message: 'Journey created successfully', data: savedJourney });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.addJourneyStep = async (req, res) => {
  try {
    const { journeyId, stepOrder, stepName, featureCode } = req.body;

    // Convert featureCode to uppercase
    const upperFeatureCode = featureCode ? featureCode.toUpperCase() : undefined;

    const newJourneyStep = new JourneyStep({
      journeyId,
      stepOrder,
      stepName,
      featureCode: upperFeatureCode
    });

    const savedStep = await newJourneyStep.save();

    await AuditLog.create({
      tenantId: req.user.tenantId,
      action: 'ADD_JOURNEY_STEP',
      performedBy: req.user.userId,
      metadata: {
        journeyId,
        stepOrder,
        stepName
      }
    });

    res.status(201).json({ success: true, message: 'Journey step added successfully', data: savedStep });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.getJourneySteps = async (req, res) => {
  try {
    const { journeyId } = req.params;
    const filter = journeyId ? { journeyId } : {};
    
    // Return steps sorted by stepOrder
    const steps = await JourneyStep.find(filter).sort({ stepOrder: 1 });
    res.status(200).json({ success: true, message: 'Journey steps retrieved successfully', data: steps });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
