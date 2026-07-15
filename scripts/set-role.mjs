// Grant a role via Firebase Auth custom claims.
// Usage: node --env-file=.env.local scripts/set-role.mjs <email> <student|mentor|admin>
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const [email, role] = process.argv.slice(2);
const ROLES = ["student", "mentor", "admin"];
if (!email || !ROLES.includes(role)) {
  console.error("Usage: node --env-file=.env.local scripts/set-role.mjs <email> <student|mentor|admin>");
  process.exit(1);
}

const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
if (!key) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY is not set in .env.local");
  process.exit(1);
}

initializeApp({ credential: cert(JSON.parse(key)) });
const auth = getAuth();
const user = await auth.getUserByEmail(email);
await auth.setCustomUserClaims(user.uid, { ...user.customClaims, role });
console.log(`Set role=${role} for ${email} (uid ${user.uid}). Takes effect on next token refresh/sign-in.`);
