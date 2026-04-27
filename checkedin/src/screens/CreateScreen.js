import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ScrollView,
} from "react-native";
import { collection, addDoc, setDoc, doc, serverTimestamp, Timestamp } from "firebase/firestore";
import { auth, db } from "../../firebase";

const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function CreateScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadlineDays, setDeadlineDays] = useState("7");
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Give your challenge a title.");
      return;
    }
    const days = parseInt(deadlineDays);
    if (isNaN(days) || days < 1) {
      alert("Enter a valid number of days.");
      return;
    }

    setLoading(true);
    const code = generateCode();
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    try {
      const docRef = await addDoc(collection(db, "challenges"), {
        title: title.trim(),
        description: description.trim(),
        deadline: Timestamp.fromDate(deadline),
        createdBy: user.uid,
        code,
        participantIds: [user.uid],
        createdAt: serverTimestamp(),
      });

      await setDoc(doc(db, "challenges", docRef.id, "participants", user.uid), {
        userId: user.uid,
        name: user.displayName,
        checkedIn: false,
        checkedInAt: null,
      });

      alert(`Challenge created! 🎉\n\nShare this code with your friends: ${code}`);
      navigation.navigate("ChallengeDetail", { challengeId: docRef.id });
    } catch (err) {
      alert(err.message);
    }
    setLoading(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Challenge Title *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Swim 1km every day"
        value={title}
        onChangeText={setTitle}
      />

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="What are the rules?"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={4}
      />

      <Text style={styles.label}>Deadline (in days from today) *</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. 7"
        value={deadlineDays}
        onChangeText={setDeadlineDays}
        keyboardType="numeric"
      />

      <TouchableOpacity style={styles.button} onPress={handleCreate} disabled={loading}>
        <Text style={styles.buttonText}>
          {loading ? "Creating..." : "Create Challenge"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: "#F5F5F5", flexGrow: 1 },
  label: { fontWeight: "700", color: "#1a1a2e", marginBottom: 8, marginTop: 16, fontSize: 15 },
  input: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    fontSize: 15, borderWidth: 1, borderColor: "#e0e0e0",
  },
  multiline: { height: 100, textAlignVertical: "top" },
  button: {
    backgroundColor: "#6C63FF", padding: 18, borderRadius: 14,
    alignItems: "center", marginTop: 32,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 17 },
});