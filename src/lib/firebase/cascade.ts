import "server-only";
import type { Firestore } from "firebase-admin/firestore";

// When an admin deletes a module, its student data (progress, chat sessions,
// submissions) goes with it — otherwise those docs are orphaned forever.
export async function deleteModuleData(db: Firestore, moduleId: string): Promise<void> {
  for (const col of ["progress", "chat_sessions", "submissions"]) {
    const snap = await db.collection(col).where("moduleId", "==", moduleId).get();
    // Firestore batches cap at 500 ops; chunk to stay under it.
    const docs = snap.docs;
    for (let i = 0; i < docs.length; i += 400) {
      const batch = db.batch();
      docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
      await batch.commit();
    }
  }
}
