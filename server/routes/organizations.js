import express from "express";
import { check, validationResult } from "express-validator";
import auth from "../middleware/auth.js";
import Organization from "../models/Organization.js";
import User from "../models/User.js";

const router = express.Router();

// @route   POST api/organizations
// @desc    Create a new organization
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', 'Name is required').not().isEmpty(),
      check('slug', 'Slug is required').not().isEmpty(),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { name, slug, website, logo } = req.body;

      const existingOrg = await Organization.findOne({ slug });
      if (existingOrg) {
        return res
          .status(400)
          .json({ msg: 'Organization with this slug already exists' });
      }

      const organization = new Organization({
        name,
        slug,
        website,
        logo,
        members: [{ user: req.user.id, role: 'owner' }],
      });

      await organization.save();

      await User.findByIdAndUpdate(req.user.id, {
        $push: { organizations: organization._id },
      });

      res.json(organization);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/organizations
// @desc    Get all organizations for user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('organizations');
    res.json(user.organizations);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   GET api/organizations/:id
// @desc    Get organization by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({ msg: 'Organization not found' });
    }

    const isMember = organization.members.some(
      (member) => member.user.toString() === req.user.id
    );

    if (!isMember) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    res.json(organization);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Organization not found' });
    }
    res.status(500).send('Server error');
  }
});

// @route   PUT api/organizations/:id
// @desc    Update organization
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let organization = await Organization.findById(req.params.id);

    if (!organization) {
      return res.status(404).json({ msg: 'Organization not found' });
    }

    const member = organization.members.find(
      (member) => member.user.toString() === req.user.id
    );

    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      return res.status(401).json({ msg: 'Not authorized' });
    }

    const { name, website, logo } = req.body;

    if (name) organization.name = name;
    if (website) organization.website = website;
    if (logo) organization.logo = logo;

    await organization.save();
    res.json(organization);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/organizations/:id/members
// @desc    Add a member to organization
// @access  Private
router.post(
  '/:id/members',
  [
    auth,
    [
      check('email', 'Email is required').isEmail(),
      check('role', 'Role is required').isIn(['admin', 'member']),
    ],
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const organization = await Organization.findById(req.params.id).populate('members.user', 'name email');

      if (!organization) {
        return res.status(404).json({ msg: 'Organization not found' });
      }

      // Check if requester is an owner
      const member = organization.members.find(
        (member) => String(member.user._id || member.user) === String(req.user.id)
      );

      if (!member || member.role !== 'owner') {
        return res.status(401).json({ msg: 'Not authorized' });
      }

      const { email, role } = req.body;

      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      const isMember = organization.members.some(
        (member) => String(member.user._id || member.user) === String(user._id)
      );

      if (isMember) {
        return res.status(400).json({ msg: 'User is already a member' });
      }

      organization.members.push({ user: user._id, role });
      await organization.save();

      await User.findByIdAndUpdate(user._id, {
        $push: { organizations: organization._id },
      });

      // Re-populate after adding
      await organization.populate('members.user', 'name email');

      const newMember = organization.members.find(
        (m) => String(m.user._id || m.user) === String(user._id)
      );

      res.json(newMember);
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/organizations/default
// @desc    Get default public organization ID (no auth)
// @access  Public
router.get('/default', async (req, res) => {
  try {
    const organization = await Organization.findOne().select('_id slug name');
    if (!organization) {
      return res.status(404).json({ msg: 'No organization found' });
    }
    res.json(organization);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

export default router;
