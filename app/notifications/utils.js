// app/notifications/utils.js
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("This browser does not support notifications.");
    return "denied";
  }

  if (Notification.permission !== "default") {
    return Notification.permission; // "granted" or "denied"
  }

  const permission = await Notification.requestPermission();
  return permission;
}