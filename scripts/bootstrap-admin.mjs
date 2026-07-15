// Creates (or promotes) an admin account by email — works before anyone has
// signed up through the UI. Prints a temporary password if it had to create
// the account.
// Usage: node --env-file=.env.local scripts/bootstrap-admin.mjs <email> [displayName]
import crypto from "node:crypto";
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const [email, displayName = "Admin"] = process.argv.slice(2);
if (!email) {
  console.error("Usage: node --env-file=.env.local scripts/bootstrap-admin.mjs <email> [displayName]");
  process.exit(1);
}
const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "null");
if (!key) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local");
  process.exit(1);
}

initializeApp({ credential: cert(key) });
const auth = getAuth();
const db = getFirestore();

let user;
let tempPassword = null;
try {
  user = await auth.getUserByEmail(email);
} catch {
  tempPassword = crypto.randomBytes(9).toString("base64url");
  user = await auth.createUser({ email, password: tempPassword, displayName, emailVerified: true });
}

await auth.setCustomUserClaims(user.uid, { role: "admin" });
await db.collection("users").doc(user.uid).set(
  {
    role: "admin",
    chapterId: null,
    university: null,
    displayName: user.displayName ?? displayName,
    email,
    badgeIds: [],
    streak: { current: 0, longest: 0, lastActiveDate: "" },
    createdAt: Date.now(),
  },
  { merge: true },
);

console.log(`admin ready: ${email} (uid ${user.uid})`);
if (tempPassword) {
  console.log(`temporary password: ${tempPassword}`);
  console.log("log in with it at /login, then change it");
}
