const Event = require('../models/Event');
const Consent = require('../models/Consent');

exports.trackEvent = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId || req.user._id || req.user.id;
    
    const { 
      sessionId, 
      channel, 
      feature, 
      eventType = 'UNKNOWN', 
      metadata,
      timestamp = new Date()
    } = req.body;

    if (!feature) {
      return res.status(400).json({ 
        success: false, 
        message: 'feature is a required field' 
      });
    }

    const validChannels = ['WEB', 'MOBILE', 'API', 'BATCH'];
    if (!channel || !validChannels.includes(channel)) {
      return res.status(400).json({ 
        success: false, 
        message: "channel must be one of ['WEB', 'MOBILE', 'API', 'BATCH']" 
      });
    }

    const consent = await Consent.findOne({ tenantId });
    if (consent && consent.telemetryEnabled === false) {
      return res.status(403).json({
        success: false,
        message: 'Telemetry disabled for this tenant'
      });
    }

    // Creating event explicitly with tenantId/userId from req.user, ignoring any from req.body
    const newEvent = await Event.create({
      tenantId,
      userId,
      sessionId,
      channel,
      feature,
      eventType,
      metadata,
      timestamp
    });

    return res.status(201).json({
      success: true,
      message: 'Event tracked successfully',
      data: newEvent
    });
  } catch (error) {
    console.error('Error tracking event:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

exports.trackBatchEvents = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId || req.user._id || req.user.id;
    
    const events = req.body.events || req.body;

    if (!events || !Array.isArray(events)) {
      return res.status(400).json({ 
        success: false, 
        message: 'An array of events is required' 
      });
    }

    const consent = await Consent.findOne({ tenantId });
    if (consent && consent.telemetryEnabled === false) {
      return res.status(403).json({
        success: false,
        message: 'Telemetry disabled for this tenant'
      });
    }

    const eventsToInsert = events.map(event => ({
      ...event,
      eventType: event.eventType || 'UNKNOWN',
      timestamp: event.timestamp || new Date(),
      // Spreading tenantId and userId at the end ensures ANY tenantId from the request body is overwritten
      tenantId,
      userId
    }));

    const insertedEvents = await Event.insertMany(eventsToInsert);

    return res.status(201).json({
      success: true,
      message: `${insertedEvents.length} events tracked successfully`,
      data: insertedEvents
    });
  } catch (error) {
    console.error('Error tracking batch events:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
