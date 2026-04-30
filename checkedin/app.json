import { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";
import AppNavigator from "./src/navigation/AppNavigator";
import AuthScreen from "./src/screens/AuthScreen";
import { View, ActivityIndicator } from "react-native";
import { registerForPushNotifications } from "./src/utils/notifications";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      if (firebaseUser) {
        // Create or update user doc in Firestore
        await setDoc(doc(db, "users", firebaseUser.uid), {
          name: firebaseUser.displayName,
          email: firebaseUser.email,
        }, { merge: true });

        // Register for push notifications and save token
        await registerForPushNotifications();
      }
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#6C63FF" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {user ? <AppNavigator /> : <AuthScreen />}
    </NavigationContainer>
  );
}