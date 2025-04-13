import express from "express";
import { check, validationResult } from "express-validator";
import auth from "../middleware/auth.js";
import Service from "../models/Service.js";
import Organization from "../models/Organization.js";

const router = express.Router();

// @route   POST api/services
// @desc    Create a new service
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('organization', 'Organization is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, description, organization, status } = req.body;

      const org = await Organization.findById(organization);
      if (!org) {
        return res.status(404).json({ msg: 'Organization not found' });
      }

      const isMember = org.members.some(
        member => member.user.toString() === req.user.id
      );

      if (!isMember) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const service = new Service({
        name,
        description,
        organization,
        status: status || 'operational',
        statusHistory: [
          {
            status: status || 'operational',
            message: 'Initial status'
          }
        ]
      });

      await service.save();

      const io = req.app.get('io');
      io.emit(`organization:${organization}:services:update`, { action: 'create', service });

      res.json(service);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/services/organization/:orgId
// @desc    Get all services for an organization
// @access  Public (for status page)
router.get('/organization/:orgId', async (req, res) => {
  try {
    const services = await Service.find({ organization: req.params.orgId });
    res.json(services);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   PUT api/services/:id/status
// @desc    Update service status
// @access  Private
router.put(
  '/:id/status',
  [
    auth,
    [
      check('status', 'Status is required').isIn([
        'operational',
        'degraded',
        'partial_outage',
        'major_outage'
      ]),
      check('message', 'Message is required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const service = await Service.findById(req.params.id);

      if (!service) {
        return res.status(404).json({ msg: 'Service not found' });
      }

      const org = await Organization.findById(service.organization);
      const isMember = org.members.some(
        member => member.user.toString() === req.user.id
      );

      if (!isMember) {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const { status, message } = req.body;

      service.status = status;
      service.statusHistory.push({
        status,
        message,
        timestamp: new Date()
      });

      await service.save();

      const io = req.app.get('io');
      io.emit(`organization:${service.organization}:services:update`, {
        action: 'status-update',
        service
      });

      res.json(service);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   DELETE api/services/:id
// @desc    Delete a service
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ msg: 'Service not found' });
    }

    const org = await Organization.findById(service.organization);
    const isMember = org.members.some(
      member => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    //await service.remove();
    // Use findByIdAndDelete instead of remove()
    await Service.findByIdAndDelete(req.params.id);
    
    const io = req.app.get('io');
    io.emit(`organization:${service.organization}:services:update`, {
      action: 'delete',
      serviceId: req.params.id
    });

    console.log("Deleting service with ID:", req.params.id);
    console.log("User ID from auth middleware:", req.user.id);
    console.log("Service found:", service);
    console.log("Organization found:", org);

    res.json({ msg: 'Service deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
