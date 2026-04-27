import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Platform,
} from "react-native";
import {
  updateProfile, updateEmail, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, deleteUser,
} from "firebase/auth";
import { auth } from "../../firebase";

export default function AccountScreen({ navigation }) {
  const user = auth.currentUser;
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const reauthenticate = async () => {
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
  };

  const handleUpdateName = async () => {
    if (!displayName.trim()) {
      Alert.alert("Oops", "Name cannot be empty.");
      return;
    }
    setLoading(true);
    try {
      await updateProfile(user, { displayName: displayName.trim() });
      Alert.alert("Done ✅", "Display name updated.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  const handleUpdateEmail = async () => {
    if (!currentPassword) {
      Alert.alert("Required", "Enter your current password to change email.");
      return;
    }
    setLoading(true);
    try {
      await reauthenticate();
      await updateEmail(user, email.trim());
      Alert.alert("Done ✅", "Email updated.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword) {
      Alert.alert("Required", "Enter both your current and new password.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Oops", "New password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await reauthenticate();
      await updatePassword(user, newPassword);
      setNewPassword("");
      setCurrentPassword("");
      Alert.alert("Done ✅", "Password updated.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  const handleDeleteAccount = () => {
    const doDelete = async () => {
      if (!currentPassword) {
        Alert.alert("Required", "Enter your current password to delete your account.");
        return;
      }
      setLoading(true);
      try {
        await reauthenticate();
        await deleteUser(user);
      } catch (err) {
        Alert.alert("Error", err.message);
      }
      setLoading(false);
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Delete your account? This cannot be undone.");
      if (confirmed) doDelete();
    } else {
      Alert.alert("Delete Account", "This cannot be undone. All your data will be lost.", [
        { text: "Cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarLarge}>
          <Text style={styles.avatarText}>
            {user.displayName?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.avatarName}>{user.displayName}</Text>
        <Text style={styles.avatarEmail}>{user.email}</Text>
      </View>

      {/* Display Name */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display Name</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          placeholderTextColor="#aaa"
        />
        <TouchableOpacity style={styles.btn} onPress={handleUpdateName} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Saving..." : "Update Name"}</Text>
        </TouchableOpacity>
      </View>

      {/* Current Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Current Password</Text>
        <Text style={styles.hint}>Required for changing email, password, or deleting account.</Text>
        <TextInput
          style={styles.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="Enter current password"
          placeholderTextColor="#aaa"
          secureTextEntry
        />
      </View>

      {/* Email */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Email Address</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.btn} onPress={handleUpdateEmail} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Saving..." : "Update Email"}</Text>
        </TouchableOpacity>
      </View>

      {/* New Password */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>New Password</Text>
        <TextInput
          style={styles.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          placeholderTextColor="#aaa"
          secureTextEntry
        />
        <TouchableOpacity style={styles.btn} onPress={handleUpdatePassword} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "Saving..." : "Update Password"}</Text>
        </TouchableOpacity>
      </View>

      {/* Delete Account */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Danger Zone</Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount} disabled={loading}>
          <Text style={styles.deleteBtnText}>🗑 Delete My Account</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#F5F5F5", flexGrow: 1, paddingBottom: 60 },
  avatarSection: { alignItems: "center", marginBottom: 24, paddingVertical: 24 },
  avatarLarge: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "#6C63FF", justifyContent: "center", alignItems: "center",
    marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 32, fontWeight: "800" },
  avatarName: { fontSize: 20, fontWeight: "700", color: "#1a1a2e" },
  avatarEmail: { fontSize: 14, color: "#888", marginTop: 4 },
  section: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  hint: { fontSize: 13, color: "#888", marginBottom: 10, lineHeight: 18 },
  input: {
    borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10,
    padding: 14, fontSize: 15, marginBottom: 12, color: "#000",
  },
  btn: {
    backgroundColor: "#6C63FF", padding: 14, borderRadius: 10, alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  deleteBtn: {
    backgroundColor: "#FFF0F0", padding: 14, borderRadius: 10,
    alignItems: "center", borderWidth: 1, borderColor: "#FFCDD2",
  },
  deleteBtnText: { color: "#D32F2F", fontWeight: "700", fontSize: 15 },
});