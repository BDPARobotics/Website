// Idempotent setup for the Firebase project in FIREBASE_SERVICE_ACCOUNT_KEY:
// enables required Google APIs, creates the default Firestore database, and
// turns on email/password sign-in. Safe to re-run.
// Usage: node --env-file=.env.local scripts/provision-firebase.mjs
import { GoogleAuth } from "google-auth-library";

const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY ?? "null");
if (!key) {
  console.error("FIREBASE_SERVICE_ACCOUNT_KEY not set in .env.local");
  process.exit(1);
}
const project = key.project_id;

const auth = new GoogleAuth({
  credentials: key,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});
const client = await auth.getClient();

async function call(method, url, body) {
  const { token } = await client.getAccessToken();
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json };
}

console.log(`provisioning ${project} ...`);

let r = await call(
  "POST",
  `https://serviceusage.googleapis.com/v1/projects/${project}/services:batchEnable`,
  { serviceIds: ["identitytoolkit.googleapis.com", "firestore.googleapis.com"] },
);
console.log("enable APIs:", r.status, r.json.error?.message ?? "ok");

// API enablement propagates asynchronously; give it a beat.
await new Promise((s) => setTimeout(s, 8000));

r = await call(
  "POST",
  `https://firestore.googleapis.com/v1/projects/${project}/databases?databaseId=(default)`,
  { type: "FIRESTORE_NATIVE", locationId: "nam5" },
);
if (r.status === 409) console.log("firestore: default database already exists");
else console.log("firestore create:", r.status, r.json.error?.message ?? "operation started");

r = await call(
  "POST",
  `https://identitytoolkit.googleapis.com/v2/projects/${project}/identityPlatform:initializeAuth`,
  {},
);
console.log("initializeAuth:", r.status, r.json.error?.message ?? "ok");

r = await call(
  "PATCH",
  `https://identitytoolkit.googleapis.com/admin/v2/projects/${project}/config?updateMask=signIn.email.enabled,signIn.email.passwordRequired`,
  { signIn: { email: { enabled: true, passwordRequired: true } } },
);
console.log("email/password sign-in:", r.status, r.json.error?.message ?? "enabled");

const { initializeApp, cert } = await import("firebase-admin/app");
const { getAuth } = await import("firebase-admin/auth");
initializeApp({ credential: cert(key) });
const list = await getAuth().listUsers(1);
console.log(`admin SDK OK — sample of ${list.users.length} user(s) fetched`);
console.log("done");
