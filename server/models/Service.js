import mongoose from 'mongoose';

const ServiceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  organization: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organization',
    required: true
  },
  status: {
    type: String,
    enum: ['operational', 'degraded', 'partial_outage', 'major_outage'],
    default: 'operational'
  },
  statusHistory: [{
    status: {
      type: String,
      enum: ['operational', 'degraded', 'partial_outage', 'major_outage']
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    message: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Service = mongoose.model('Service', ServiceSchema);
export default Service;
