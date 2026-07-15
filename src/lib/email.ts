import "server-only";
import { getAdminDb } from "@/lib/firebase/admin";

// Resend over raw REST — same no-SDK approach as the Gemini client.
const FROM_FALLBACK = "BDPA Robotics <onboarding@resend.dev>";

function fromAddress() {
  return process.env.EMAIL_FROM || FROM_FALLBACK;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailShell(title: string, bodyHtml: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#233242">
  <h1 style="color:#1b3965;font-size:22px;margin-bottom:16px">${title}</h1>
  ${bodyHtml}
  <p style="margin-top:32px;font-size:12px;color:#888888">BDPA Robotics &middot; A program of Black Data Processing Associates</p>
</div>`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ id?: string; error?: string }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { error: "RESEND_API_KEY not set" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: fromAddress(), to: [opts.to], subject: opts.subject, html: opts.html }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return { error: json?.message ?? `resend error ${res.status}` };
  return { id: json.id };
}

// Resend's batch endpoint accepts up to 100 emails per call.
export async function sendBatch(
  emails: { to: string; subject: string; html: string }[],
): Promise<{ ids: string[]; errors: string[] }> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ids: [], errors: ["RESEND_API_KEY not set"] };
  const ids: string[] = [];
  const errors: string[] = [];
  for (let i = 0; i < emails.length; i += 100) {
    const chunk = emails.slice(i, i + 100).map((e) => ({
      from: fromAddress(),
      to: [e.to],
      subject: e.subject,
      html: e.html,
    }));
    const res = await fetch("https://api.resend.com/emails/batch", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(chunk),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) errors.push(json?.message ?? `resend error ${res.status}`);
    else ids.push(...((json.data ?? []) as { id: string }[]).map((d) => d.id));
  }
  return { ids, errors };
}

export async function logNotification(uid: string, type: string, resendMessageId: string) {
  try {
    await getAdminDb().collection("notifications_log").add({ uid, type, sentAt: Date.now(), resendMessageId });
  } catch (err) {
    console.error("notifications_log write failed:", err);
  }
}

export function welcomeEmail(displayName: string): { subject: string; html: string } {
  const name = escapeHtml(displayName);
  return {
    subject: "Welcome to BDPA Robotics 🤖",
    html: emailShell(
      `Welcome, ${name}!`,
      `<p>Your BDPA Robotics account is ready. Here's how to get rolling:</p>
<ul style="line-height:1.8">
  <li><strong>Start the Robotic Arm Academy</strong> — five modules that take you from wiring your first sensor to full autonomous control.</li>
  <li><strong>Ask the AI tutor anything</strong> — it's built into every module and knows exactly what you're working on.</li>
  <li><strong>Submit your challenge runs</strong> — mentors review every attempt and tell you what to try next.</li>
</ul>
<p style="margin-top:24px"><a href="https://bdparobotics.org/dashboard" style="background:#1b3965;color:#ffffff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Go to your dashboard</a></p>`,
    ),
  };
}
