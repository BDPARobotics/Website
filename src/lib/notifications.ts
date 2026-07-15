import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";
import type { Notification, NotificationRead } from "@/lib/types";

const RECENT_LIMIT = 50;

export interface NotificationWithReadState extends Notification {
  id: string;
  read: boolean;
}

// Everything with createdAt <= lastReadAt counts as read. There's no
// per-notification read state — visiting the notifications tab marks
// everything sent so far as read.
export async function getNotificationsForUser(uid: string): Promise<{
  notifications: NotificationWithReadState[];
  unreadCount: number;
}> {
  const db = getAdminDb();
  const [notifsSnap, readSnap] = await Promise.all([
    db.collection("notifications").orderBy("createdAt", "desc").limit(RECENT_LIMIT).get(),
    db.collection("notification_reads").doc(uid).get(),
  ]);

  const lastReadAt = readSnap.exists ? (readSnap.data() as NotificationRead).lastReadAt : 0;
  const notifications = notifsSnap.docs.map((d) => {
    const data = d.data() as Notification;
    return { id: d.id, ...data, read: data.createdAt <= lastReadAt };
  });
  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount };
}
