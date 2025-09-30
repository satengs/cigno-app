import { MongoClient } from 'mongodb';
import { getConfig } from '../config';

const globalState = globalThis;

let client = globalState.__cigno_client || null;

function getDbNameFromUri(uri, fallback) {
  try {
    const url = new URL(uri);
    const pathname = url.pathname.replace(/^\//, '');
    return pathname || fallback;
  } catch (e) {
    return fallback;
  }
}

export async function getDb() {
  const cfg = getConfig();
  if (!cfg.MONGODB_URI) throw new Error('MONGODB_URI is required');
  if (!client) {
    client = new MongoClient(cfg.MONGODB_URI, { maxPoolSize: 10 });
    globalState.__cigno_client = client;
  }
  if (!client.topology) {
    await client.connect();
  }
  const dbName = getDbNameFromUri(cfg.MONGODB_URI, 'cigno');
  return client.db(dbName);
}

export async function getCollection(collectionName) {
  const db = await getDb();
  return db.collection(collectionName);
}

export function getFieldLevelEncryption() {
  const { MONGODB_FLE_ENABLED } = getConfig();
  if (!MONGODB_FLE_ENABLED) {
    return {
      encryptField: (v) => v,
      decryptField: (v) => v,
    };
  }
  return {
    encryptField: (v) => v,
    decryptField: (v) => v,
  };
}


