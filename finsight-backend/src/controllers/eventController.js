const Event = require('../models/Event');
const Consent = require('../models/Consent');

exports.trackEvent = async (req, res) => {
  try {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId || req.user._id || req.user.id;
    
    let { 
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

    feature = feature.trim().toUpperCase().replace(/ /g, '_');
    channel = channel?.toUpperCase();
    eventType = eventType?.toUpperCase();

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

    const eventsToInsert = events.map(event => {
      if (event.feature) {
        event.feature = event.feature.trim().toUpperCase().replace(/ /g, '_');
      }
      if (event.channel) {
        event.channel = event.channel.toUpperCase();
      }
      if (event.eventType) {
        event.eventType = event.eventType.toUpperCase();
      }
      return {
        ...event,
        eventType: event.eventType || 'UNKNOWN',
        timestamp: event.timestamp || new Date(),
      // Spreading tenantId and userId at the end ensures ANY tenantId from the request body is overwritten
      tenantId,
      userId
    };
  });

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

exports.getEvents = async (req, res) => {
  try {
    const { tenantId } = req.user;
    let { page = 1, limit = 50, feature, channel, startDate, endDate } = req.query;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is required' });
    }

    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const query = { tenantId };

    if (feature) {
      query.feature = feature;
    }

    if (channel) {
      query.channel = channel;
    }

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;

    const events = await Event.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);

    return res.status(200).json({
      success: true,
      data: events,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};
