import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

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
    console.log("Notification permission denied.");
    return null;
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: "328a87eb-1db7-4bfe-86b4-eb3dacbd9cad",
    });
    const token = tokenData.data;
    console.log("Push token:", token);

    const user = auth.currentUser;
    if (user) {
      // Use setDoc with merge so it works whether doc exists or not
      await setDoc(
        doc(db, "users", user.uid),
        {
          pushToken: token,
          name: user.displayName,
          email: user.email,
        },
        { merge: true }
      );
      console.log("Token saved to Firestore.");
    }
    return token;
  } catch (err) {
    console.log("Error getting push token:", err.message);
    return null;
  }
};

export const sendPushNotification = async (token, title, body) => {
  if (!token) {
    console.log("No token provided, skipping notification.");
    return;
  }
  try {
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify({
        to: token,
        title,
        body,
        sound: "default",
        priority: "high",
      }),
    });
    const result = await response.json();
    console.log("Notification result:", JSON.stringify(result));
  } catch (err) {
    console.log("Error sending notification:", err.message);
  }
};

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