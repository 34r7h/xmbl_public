const admin = require('firebase-admin');
const { logger } = require('../utils/logger');

let firebaseApp;

const initializeFirebase = () => {
  try {
    // Check if Firebase is already initialized
    if (firebaseApp) {
      return firebaseApp;
    }

    // Check if we have Firebase environment variables
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL) {
      logger.warn('⚠️ Firebase environment variables not set. Using default configuration for development.');
      
      // Initialize with default configuration for development
      firebaseApp = admin.initializeApp({
        projectId: 'xmbl-dev-project',
      });
      
      logger.info('🔥 Firebase Admin SDK initialized with default configuration');
      return firebaseApp;
    }

    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
    };

    // Initialize Firebase Admin SDK
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });

    logger.info('🔥 Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    logger.error('❌ Failed to initialize Firebase Admin SDK:', error);
    throw new Error('Firebase initialization failed');
  }
};

const getFirestore = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.firestore();
};

const getAuth = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }
  return admin.auth();
};

// Firestore collections
const COLLECTIONS = {
  USERS: 'users',
  APPS: 'apps',
  PAGES: 'pages',
  COMPONENTS: 'components',
  FUNCTIONS: 'functions',
  TEMPLATES: 'templates',
  DEPLOYMENTS: 'deployments',
  ANALYTICS: 'analytics',
};

// Firestore helper functions
const createDocument = async (collection, data, docId = null) => {
  try {
    const db = getFirestore();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    const docData = {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    let docRef;
    if (docId) {
      docRef = db.collection(collection).doc(docId);
      await docRef.set(docData);
    } else {
      docRef = await db.collection(collection).add(docData);
    }

    return docRef.id;
  } catch (error) {
    logger.error(`Error creating document in ${collection}:`, error);
    throw error;
  }
};

const updateDocument = async (collection, docId, data) => {
  try {
    const db = getFirestore();
    const timestamp = admin.firestore.FieldValue.serverTimestamp();

    const docData = {
      ...data,
      updatedAt: timestamp,
    };

    await db.collection(collection).doc(docId).update(docData);
    return true;
  } catch (error) {
    logger.error(`Error updating document in ${collection}:`, error);
    throw error;
  }
};

const getDocument = async (collection, docId) => {
  try {
    const db = getFirestore();
    const doc = await db.collection(collection).doc(docId).get();

    if (!doc.exists) {
      return null;
    }

    return {
      id: doc.id,
      ...doc.data(),
    };
  } catch (error) {
    logger.error(`Error getting document from ${collection}:`, error);
    throw error;
  }
};

const deleteDocument = async (collection, docId) => {
  try {
    const db = getFirestore();
    await db.collection(collection).doc(docId).delete();
    return true;
  } catch (error) {
    logger.error(`Error deleting document from ${collection}:`, error);
    throw error;
  }
};

const queryDocuments = async (collection, queries = [], orderBy = null, limit = null) => {
  try {
    const db = getFirestore();
    let query = db.collection(collection);

    // Apply where clauses
    queries.forEach(({ field, operator, value }) => {
      query = query.where(field, operator, value);
    });

    // Apply ordering
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction || 'asc');
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    const snapshot = await query.get();
    const documents = [];

    snapshot.forEach(doc => {
      documents.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return documents;
  } catch (error) {
    logger.error(`Error querying documents from ${collection}:`, error);
    throw error;
  }
};

// User-specific database operations
const getUserAppDatabase = (userId, appId) => {
  const db = getFirestore();
  return db.collection(`users/${userId}/apps/${appId}/data`);
};

const createUserAppCollection = async (userId, appId, collectionName, data) => {
  try {
    const userAppDb = getUserAppDatabase(userId, appId);
    const docRef = await userAppDb.doc(collectionName).collection('items').add({
      ...data,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    logger.error(`Error creating collection for user app:`, error);
    throw error;
  }
};

// Batch operations
const batchWrite = async (operations) => {
  try {
    const db = getFirestore();
    const batch = db.batch();

    operations.forEach(({ type, collection, docId, data }) => {
      const docRef = db.collection(collection).doc(docId);

      switch (type) {
        case 'create':
          batch.set(docRef, {
            ...data,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...data,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });

    await batch.commit();
    return true;
  } catch (error) {
    logger.error('Error in batch write operation:', error);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getFirestore,
  getAuth,
  COLLECTIONS,
  createDocument,
  updateDocument,
  getDocument,
  deleteDocument,
  queryDocuments,
  getUserAppDatabase,
  createUserAppCollection,
  batchWrite,
};
