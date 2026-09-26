import { MongoClient, Db } from 'mongodb';

let db: Db | null = null;

export async function getDb(): Promise<Db> {
  if (db) return db;
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error('MONGO_URI is not set in environment variables.');
  }
  const client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}

export async function getGroupMemories(groupId: string): Promise<string> {
  try {
    const database = await getDb();
    const doc = await database.collection('memories').findOne({ groupId });
    return (doc?.memories as string) || '';
  } catch (err) {
    console.error('Failed to read memories from MongoDB:', err);
    return '';
  }
}

export async function updateGroupMemories(groupId: string, memories: string): Promise<void> {
  try {
    const database = await getDb();
    await database.collection('memories').updateOne(
      { groupId },
      { $set: { memories, updatedAt: new Date() } },
      { upsert: true }
    );
  } catch (err) {
    console.error('Failed to save memories to MongoDB:', err);
  }
}
