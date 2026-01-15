import mongoose from 'mongoose';
import Device from '../models/Device.js';
import { manualStatusCheck } from '../services/statusMonitor.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lensclear';

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('📦 Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ MongoDB connected');

  const deviceId = 'ESP32_TEST_001';

  await Device.findOneAndUpdate(
    { deviceId },
    {
      deviceId,
      name: 'Test Device',
      type: 'combined',
      status: 'online',
      lastSeen: new Date(),
      userId: 'TEST_USER',
      authToken: 'TEST_TOKEN',
    },
    { upsert: true, new: true }
  );

  console.log('🕒 Waiting 20s to exceed offline threshold...');
  await sleep(20000);

  console.log('[Test] Triggering manual status check');
  await manualStatusCheck();

  const device = await Device.findOne({ deviceId });
  console.log(`🔎 Device ${deviceId} status after check: ${device.status}`);

  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});

