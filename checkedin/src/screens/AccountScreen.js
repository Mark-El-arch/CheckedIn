import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView, Image, Platform,
} from "react-native";
import {
  updateProfile, updateEmail, updatePassword,
  reauthenticateWithCredential, EmailAuthProvider, deleteUser,
} from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { auth, storage } from "../../firebase";

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
      Alert.alert("Done", "Display name updated.");
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
      Alert.alert("Done", "Email updated.");
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
      Alert.alert("Done", "Password updated.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission needed", "Allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (result.canceled) return;

    setLoading(true);
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `avatars/${user.uid}`);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: downloadURL });
      Alert.alert("Done", "Profile picture updated.");
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  const handleDeleteAccount = () => {
    const doDelete = async () => {
      if (!currentPassword) {
        Alert.alert("Required", "Enter your current password to delete account.");
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

      {/* Profile Picture */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profile Picture</Text>
        <View style={styles.avatarRow}>
          <View style={styles.avatarLarge}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user.displayName?.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.photoBtn} onPress={handlePickPhoto}>
            <Text style={styles.photoBtnText}>
              {loading ? "Uploading..." : "Change Photo"}
            </Text>
          </TouchableOpacity>
        </View>
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
          <Text style={styles.btnText}>Update Name</Text>
        </TouchableOpacity>
      </View>

      {/* Current Password (shared for email/password/delete) */}
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
        <Text style={styles.sectionTitle}>Email</Text>
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
          <Text style={styles.btnText}>Update Email</Text>
        </TouchableOpacity>
      </View>

      {/* Password */}
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
          <Text style={styles.btnText}>Update Password</Text>
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
  section: {
    backgroundColor: "#fff", borderRadius: 16, padding: 18,
    marginBottom: 16, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1a1a2e", marginBottom: 12 },
  hint: { fontSize: 13, color: "#888", marginBottom: 10, lineHeight: 18 },
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 16 },
  avatarLarge: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#6C63FF", justifyContent: "center", alignItems: "center",
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "800" },
  photoBtn: {
    backgroundColor: "#F0EEFF", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10,
  },
  photoBtnText: { color: "#6C63FF", fontWeight: "700" },
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