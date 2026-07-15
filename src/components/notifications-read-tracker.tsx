"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Fires once on mount (real navigation, not Link prefetch) to mark every
// notification sent so far as read, then refreshes the tab's unread badge.
export function NotificationsReadTracker({ hadUnread }: { hadUnread: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!hadUnread) return;
    fetch("/api/notifications/read", { method: "POST" }).then(() => router.refresh());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
