import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert,
} from "react-native";
import {
  collection, query, where, getDocs,
  doc, setDoc, updateDoc, arrayUnion,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function JoinScreen({ navigation }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  const handleJoin = async () => {
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode.length !== 6) {
      Alert.alert("Oops", "Enter a valid 6-character code.");
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, "challenges"), where("code", "==", trimmedCode));
      const snap = await getDocs(q);

      if (snap.empty) {
        Alert.alert("Not found", "No challenge with that code exists.");
        setLoading(false);
        return;
      }

      const challengeDoc = snap.docs[0];
      const challengeId = challengeDoc.id;

      await updateDoc(doc(db, "challenges", challengeId), {
        participantIds: arrayUnion(user.uid),
      });

      await setDoc(doc(db, "challenges", challengeId, "participants", user.uid), {
        userId: user.uid,
        name: user.displayName,
        checkedIn: false,
        checkedInAt: null,
      });

      navigation.navigate("ChallengeDetail", { challengeId });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>
        Enter the 6-character code your friend shared with you.
      </Text>

      <TextInput
        style={styles.codeInput}
        placeholder="e.g. XK92PL"
        value={code}
        onChangeText={setCode}
        autoCapitalize="characters"
        maxLength={6}
      />

      <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Joining..." : "Join Challenge"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 24, justifyContent: "center" },
  heading: { fontSize: 16, color: "#555", textAlign: "center", marginBottom: 32, lineHeight: 24 },
  codeInput: {
    backgroundColor: "#fff", borderRadius: 14, padding: 18,
    fontSize: 28, fontWeight: "800", textAlign: "center", letterSpacing: 8,
    borderWidth: 2, borderColor: "#6C63FF", color: "#1a1a2e",
  },
  button: {
    backgroundColor: "#6C63FF", padding: 18, borderRadius: 14,
    alignItems: "center", marginTop: 24,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 17 },
});