const admin = require("firebase-admin");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;
let bucket = null;

try {
  const serviceAccountPath = path.join(__dirname, "../serviceAccountKey.json");

  if (fs.existsSync(serviceAccountPath)) {
    const serviceAccount = require(serviceAccountPath);
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${serviceAccount.project_id}.appspot.com`,
    });
    console.log("✅ Firebase Admin initialized from serviceAccountKey.json");
  } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
    console.log("✅ Firebase Admin initialized from environment variables");
  } else if (process.env.FIREBASE_PROJECT_ID) {
    firebaseApp = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
    });
    console.log(`✅ Firebase Admin initialized with Project ID: ${process.env.FIREBASE_PROJECT_ID}`);
  } else {
    console.log("ℹ️  Firebase Notice: No serviceAccountKey.json or FIREBASE_PROJECT_ID detected. Firebase ready for credentials.");
  }

  if (firebaseApp) {
    bucket = admin.storage().bucket();
  }
} catch (error) {
  console.warn("⚠️ Firebase Admin initialization notice:", error.message);
}

/**
 * Upload a memory buffer or file stream to Firebase Storage
 * @param {Buffer} buffer - File buffer
 * @param {string} destination - Path inside Firebase Storage bucket (e.g. 'videos/sample.mp4')
 * @param {string} contentType - MIME type of file
 * @returns {Promise<string>} Public or signed URL
 */
const uploadToFirebaseStorage = async (buffer, destination, contentType) => {
  if (!bucket) {
    throw new Error("Firebase Storage bucket is not configured. Please supply Firebase credentials.");
  }

  const file = bucket.file(destination);
  await file.save(buffer, {
    metadata: {
      contentType,
    },
    public: true,
  });

  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
};

module.exports = {
  admin,
  firebaseApp,
  bucket,
  uploadToFirebaseStorage,
};
