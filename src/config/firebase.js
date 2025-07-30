import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

export const initializeFirebase = () => {
  if (admin.apps.length) return; // already initialised
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || "null");
  if (!serviceAccount) {
    console.warn("⚠️  Firebase service account not provided – auth disabled");
    return;
  }
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
};

export const verifyToken = async (token) => {
  if (!admin.apps.length) throw new Error("Firebase not initialised");
  return admin.auth().verifyIdToken(token);
}; 