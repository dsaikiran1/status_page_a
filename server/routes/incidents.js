import express from 'express';
import { check, validationResult } from 'express-validator';
import auth from '../middleware/auth.js';
import Incident from '../models/Incident.js';
import Service from '../models/Service.js';
import Organization from '../models/Organization.js';

const router = express.Router();

// @route   POST api/incidents
// @desc    Create a new incident
// @access  Private
router.post('/', [
  auth,
  [
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty(),
    check('organization', 'Organization is required').not().isEmpty(),
    check('services', 'Services must be an array').isArray(),
    check('type', 'Type must be incident or maintenance').isIn(['incident', 'maintenance'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, organization, services, severity, status, type, startTime } = req.body;

    const org = await Organization.findById(organization);
    if (!org) return res.status(404).json({ msg: 'Organization not found' });

    const isMember = org.members.some(member => member.user.toString() === req.user.id);
    if (!isMember) return res.status(401).json({ msg: 'Not authorized' });

    const incident = new Incident({
      title,
      description,
      organization,
      services,
      severity: severity || 'minor',
      status: status || 'investigating',
      type: type || 'incident',
      startTime: startTime || new Date(),
      createdBy: req.user.id,
      updates: [{
        message: description,
        status: status || 'investigating',
        createdBy: req.user.id
      }]
    });

    await incident.save();

    if (type === 'incident') {
      for (const serviceId of services) {
        let serviceStatus;
        switch (severity) {
          case 'critical': serviceStatus = 'major_outage'; break;
          case 'major': serviceStatus = 'partial_outage'; break;
          case 'minor':
          default: serviceStatus = 'degraded'; break;
        }

        await Service.findByIdAndUpdate(
          serviceId,
          {
            status: serviceStatus,
            $push: {
              statusHistory: {
                status: serviceStatus,
                message: `Affected by incident: ${title}`,
                timestamp: new Date()
              }
            }
          }
        );
      }
    }

    const io = req.app.get('io');
    io.emit(`organization:${organization}:incidents:update`, { action: 'create', incident });

    res.json(incident);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/incidents/organization/:orgId
// @desc    Get all incidents for an organization
// @access  Public (for status page)
router.get('/organization/:orgId', async (req, res) => {
  try {
    const incidents = await Incident.find({
      organization: req.params.orgId,
      status: { $ne: 'resolved' }
    }).sort({ startTime: -1 });

    res.json(incidents);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/incidents/:id
// @desc    Update an incident
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ msg: 'Incident not found' });

    const org = await Organization.findById(incident.organization);
    const isMember = org.members.some(member => member.user.toString() === req.user.id);
    if (!isMember) return res.status(401).json({ msg: 'Not authorized' });

    const updatableFields = [
      'title', 'description', 'severity', 'status', 'type', 'services', 'startTime', 'endTime'
    ];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        incident[field] = req.body[field];
      }
    });

    await incident.save();

    const io = req.app.get('io');
    io.emit(`organization:${incident.organization}:incidents:update`, {
      action: 'update',
      incident
    });

    res.json(incident);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   DELETE api/incidents/:id
// @desc    Delete an incident
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ msg: 'Incident not found' });

    const org = await Organization.findById(incident.organization);
    const isMember = org.members.some(member => member.user.toString() === req.user.id);
    if (!isMember) return res.status(401).json({ msg: 'Not authorized' });

    await Incident.findByIdAndDelete(req.params.id);

    const io = req.app.get('io');
    io.emit(`organization:${incident.organization}:incidents:update`, {
      action: 'delete',
      incidentId: req.params.id
    });

    res.json({ msg: 'Incident deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/incidents/:id/updates
// @desc    Add an update to an incident
// @access  Private
router.post('/:id/updates', [
  auth,
  [
    check('message', 'Message is required').not().isEmpty(),
    check('status', 'Status is required').isIn(['investigating', 'identified', 'monitoring', 'resolved'])
  ]
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const incident = await Incident.findById(req.params.id);
    if (!incident) return res.status(404).json({ msg: 'Incident not found' });

    const org = await Organization.findById(incident.organization);
    const isMember = org.members.some(member => member.user.toString() === req.user.id);
    if (!isMember) return res.status(401).json({ msg: 'Not authorized' });

    const { message, status } = req.body;

    incident.updates.push({
      message,
      status,
      createdBy: req.user.id
    });

    incident.status = status;

    if (status === 'resolved') {
      incident.endTime = new Date();

      if (incident.type === 'incident') {
        for (const serviceId of incident.services) {
          await Service.findByIdAndUpdate(
            serviceId,
            {
              status: 'operational',
              $push: {
                statusHistory: {
                  status: 'operational',
                  message: `Incident resolved: ${incident.title}`,
                  timestamp: new Date()
                }
              }
            }
          );
        }
      }
    }

    await incident.save();

    const io = req.app.get('io');
    io.emit(`organization:${incident.organization}:incidents:update`, {
      action: 'update',
      incident
    });

    res.json(incident);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
