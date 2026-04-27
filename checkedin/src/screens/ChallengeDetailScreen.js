import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert,
} from "react-native";
import {
  doc, onSnapshot, collection, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

export default function ChallengeDetailScreen({ route }) {
  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState(null);
  const [participants, setParticipants] = useState([]);
  const user = auth.currentUser;

  // Listen to challenge document in real-time
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "challenges", challengeId), (snap) => {
      if (snap.exists()) setChallenge({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [challengeId]);

  // Listen to participants subcollection in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "challenges", challengeId, "participants"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Checked-in participants appear first
        list.sort((a, b) => {
          if (a.checkedIn && !b.checkedIn) return -1;
          if (!a.checkedIn && b.checkedIn) return 1;
          return a.name.localeCompare(b.name);
        });
        setParticipants(list);
      }
    );
    return unsub;
  }, [challengeId]);

  const handleCheckIn = async () => {
    Alert.alert("Check in?", "Confirm you've completed this challenge!", [
      { text: "Cancel" },
      {
        text: "Yes, I did it! ✅",
        onPress: async () => {
          try {
            await updateDoc(
              doc(db, "challenges", challengeId, "participants", user.uid),
              {
                checkedIn: true,
                checkedInAt: serverTimestamp(),
              }
            );
          } catch (err) {
            Alert.alert("Error", err.message);
          }
        },
      },
    ]);
  };

  const myEntry = participants.find((p) => p.userId === user.uid);
  const alreadyCheckedIn = myEntry?.checkedIn === true;

  const getDeadlineText = () => {
    if (!challenge?.deadline) return "";
    const deadline = challenge.deadline.toDate();
    const now = new Date();
    const diff = deadline - now;
    if (diff < 0) return "⏰ Deadline passed";
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return `⏳ ${days}d ${hours}h remaining`;
  };

  const renderParticipant = ({ item }) => (
    <View style={[styles.participant, item.checkedIn && styles.participantDone]}>
      <Text style={styles.participantName}>
        {item.checkedIn ? "✅" : "⏳"} {item.name}
        {item.userId === user.uid ? " (you)" : ""}
      </Text>
      {item.checkedIn && item.checkedInAt && (
        <Text style={styles.checkedTime}>
          {item.checkedInAt.toDate().toLocaleString()}
        </Text>
      )}
    </View>
  );

  if (!challenge) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center", marginTop: 40, color: "#aaa" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>{challenge.title}</Text>
        {challenge.description ? (
          <Text style={styles.heroDesc}>{challenge.description}</Text>
        ) : null}
        <Text style={styles.heroDeadline}>{getDeadlineText()}</Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>Code: {challenge.code}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Participants ({participants.length})
      </Text>

      <FlatList
        data={participants}
        keyExtractor={(item) => item.id}
        renderItem={renderParticipant}
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      {!alreadyCheckedIn ? (
        <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
          <Text style={styles.checkInText}>✅ Check In — I did it!</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.doneBar}>
          <Text style={styles.doneText}>You're checked in 🎉</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  hero: { backgroundColor: "#6C63FF", padding: 24 },
  heroTitle: { fontSize: 24, fontWeight: "800", color: "#fff" },
  heroDesc: { color: "#D9D6FF", marginTop: 8, fontSize: 15 },
  heroDeadline: { color: "#fff", marginTop: 12, fontWeight: "600" },
  codeBadge: {
    marginTop: 12, backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  codeText: { color: "#fff", fontWeight: "700", letterSpacing: 2 },
  sectionTitle: { fontWeight: "700", fontSize: 16, margin: 16, color: "#1a1a2e" },
  participant: {
    backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  participantDone: { borderLeftWidth: 4, borderLeftColor: "#4CAF50" },
  participantName: { fontSize: 16, fontWeight: "600", color: "#1a1a2e" },
  checkedTime: { color: "#888", fontSize: 12, marginTop: 4 },
  checkInBtn: {
    position: "absolute", bottom: 24, left: 24, right: 24,
    backgroundColor: "#4CAF50", padding: 18, borderRadius: 16, alignItems: "center",
  },
  checkInText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  doneBar: {
    position: "absolute", bottom: 24, left: 24, right: 24,
    backgroundColor: "#E8F5E9", padding: 18, borderRadius: 16, alignItems: "center",
    borderWidth: 2, borderColor: "#4CAF50",
  },
  doneText: { color: "#2E7D32", fontWeight: "700", fontSize: 17 },
});