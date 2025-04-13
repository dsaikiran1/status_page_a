import express from "express";
import Organization from "../models/Organization.js";
import Service from "../models/Service.js";
import Incident from "../models/Incident.js";

const router = express.Router();

// @route   GET api/public/status/:orgSlug
// @desc    Get public status page data for an organization
// @access  Public
router.get('/status/:orgSlug', async (req, res) => {
  try {
    // Find organization by slug
    const organization = await Organization.findOne({ slug: req.params.orgSlug });
    
    if (!organization) {
      return res.status(404).json({ msg: 'Organization not found' });
    }

    // Get services
    const services = await Service.find({ organization: organization._id });

    // Get active incidents
    const activeIncidents = await Incident.find({
      organization: organization._id,
      status: { $ne: 'resolved' }
    }).sort({ startTime: -1 });

    // Get recent resolved incidents (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentIncidents = await Incident.find({
      organization: organization._id,
      status: 'resolved',
      endTime: { $gte: sevenDaysAgo }
    }).sort({ endTime: -1 });

    // Calculate uptime percentages for each service
    const serviceUptime = {};
    for (const service of services) {
      // Basic calculation (can be improved)
      let uptime = 100;

      // Count total downtime minutes in the past 30 days
      const statusHistory = service.statusHistory.filter(update => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return update.timestamp >= thirtyDaysAgo && update.status !== 'operational';
      });

      // Simple uptime calculation
      const downtimePercentage = statusHistory.length * 0.5; // rough estimate
      uptime = Math.max(0, Math.min(100, 100 - downtimePercentage));

      serviceUptime[service._id] = uptime.toFixed(2);
    }

    // Determine overall system status
    let overallStatus = 'operational';
    for (const service of services) {
      if (service.status === 'major_outage') {
        overallStatus = 'major_outage';
        break;
      } else if (service.status === 'partial_outage' && overallStatus !== 'major_outage') {
        overallStatus = 'partial_outage';
      } else if (service.status === 'degraded' && overallStatus === 'operational') {
        overallStatus = 'degraded';
      }
    }

    res.json({
      organization: {
        name: organization.name,
        website: organization.website,
        logo: organization.logo
      },
      status: {
        overall: overallStatus,
        services: services.map(service => ({
          id: service._id,
          name: service.name,
          description: service.description,
          status: service.status,
          uptime: serviceUptime[service._id]
        }))
      },
      incidents: {
        active: activeIncidents,
        recent: recentIncidents
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
