import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

// How notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Request permission and save push token to Firestore
export const registerForPushNotifications = async () => {
  if (!Device.isDevice) {
    console.log("Push notifications only work on a real device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.log("Permission not granted for notifications.");
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: "328a87eb-1db7-4bfe-86b4-eb3dacbd9cad"
  });
  const token = tokenData.data;

  // Save token to this user's Firestore doc
  const user = auth.currentUser;
  if (user) {
    await updateDoc(doc(db, "users", user.uid), { pushToken: token });
  }

  return token;
};

// Send a push notification via Expo's Push API
export const sendPushNotification = async (token, title, body) => {
  if (!token) return;
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: token,
      title,
      body,
      sound: "default",
    }),
  });
};

// Schedule a daily reminder at 8am
export const scheduleDailyReminder = async (challengeTitle) => {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "CheckedIn 💪",
      body: `Don't forget to check in for "${challengeTitle}" today!`,
      sound: "default",
    },
    trigger: {
      hour: 8,
      minute: 0,
      repeats: true,
    },
  });
};