import admin from "firebase-admin";

function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } catch {
      throw new Error("Invalid FIREBASE_SERVICE_ACCOUNT_JSON");
    }
  }

  if (
    process.env.FIREBASE_PROJECT_ID &&
    process.env.FIREBASE_CLIENT_EMAIL &&
    process.env.FIREBASE_PRIVATE_KEY
  ) {
    return {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    };
  }

  return null;
}

if (!admin.apps.length) {
  const serviceAccount = getServiceAccount();
  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
  });
}

export const auth = admin.auth();
export const db = admin.firestore();
export const serverTimestamp = admin.firestore.FieldValue.serverTimestamp;
