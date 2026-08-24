import mongoose from 'mongoose';
import User from '../models/User.js';

// Older builds created provider_1_providerId_1 as a plain sparse unique index.
// Every local account was stored as (local, null), so a second local signup failed
// with E11000 even though the email was different. Drop the legacy index and rebuild.
export async function ensureIndexes() {
  try {
    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();
    const legacy = indexes.find(
      i => i.name === 'provider_1_providerId_1' && !i.partialFilterExpression
    );
    if (legacy) {
      console.log('[CampusPulse] Dropping legacy provider_1_providerId_1 index');
      await collection.dropIndex('provider_1_providerId_1');
    }
    // Clear providerId: null left behind by local signups so the new index ignores them.
    const cleaned = await collection.updateMany(
      { providerId: null },
      { $unset: { providerId: '' } }
    );
    if (cleaned.modifiedCount) {
      console.log(`[CampusPulse] Cleaned providerId on ${cleaned.modifiedCount} local account(s)`);
    }
    await User.syncIndexes();
    console.log('[CampusPulse] User indexes verified');
  } catch (error) {
    console.error(`[CampusPulse] Index verification failed: ${error.message}`);
  }
}
