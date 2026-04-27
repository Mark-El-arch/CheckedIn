import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Image,
} from "react-native";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { auth, db } from "../../firebase";

export default function HomeScreen({ navigation }) {
  const [challenges, setChallenges] = useState([]);
  const user = auth.currentUser;

  useEffect(() => {
    const q = query(
      collection(db, "challenges"),
      where("participantIds", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q, (snap) => {
      setChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure?", [
      { text: "Cancel" },
      { text: "Log out", onPress: () => signOut(auth) },
    ]);
  };

  const renderChallenge = ({ item }) => {
    const deadline = item.deadline?.toDate();
    const deadlineStr = deadline ? deadline.toDateString() : "No deadline";
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("ChallengeDetail", { challengeId: item.id })}
      >
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardSub}>📅 {deadlineStr}</Text>
        <Text style={styles.cardCode}>Code: {item.code}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hey, {user.displayName} 👋</Text>
          <Text style={styles.subtitle}>{challenges.length} active challenge{challenges.length !== 1 ? "s" : ""}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate("Account")} style={styles.avatar}>
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>
                {user.displayName?.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={challenges}
        keyExtractor={(item) => item.id}
        renderItem={renderChallenge}
        ListEmptyComponent={
          <Text style={styles.empty}>No challenges yet. Create or join one!</Text>
        }
        contentContainerStyle={{ paddingBottom: 120 }}
      />

      <View style={styles.fab}>
        <TouchableOpacity style={styles.fabBtn} onPress={() => navigation.navigate("Create")}>
          <Text style={styles.fabText}>+ Create</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fabBtn, styles.fabSecondary]}
          onPress={() => navigation.navigate("Join")}
        >
          <Text style={[styles.fabText, { color: "#6C63FF" }]}>Join</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  header: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#6C63FF", padding: 20, paddingTop: 50,
  },
  greeting: { color: "#fff", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#D9D6FF", fontSize: 13, marginTop: 2 },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center", alignItems: "center",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.6)",
  },
  avatarImage: { width: 42, height: 42, borderRadius: 21 },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  card: {
    backgroundColor: "#fff", margin: 12, marginBottom: 0,
    borderRadius: 14, padding: 18,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a2e" },
  cardSub: { color: "#888", marginTop: 4 },
  cardCode: { marginTop: 8, color: "#6C63FF", fontWeight: "600" },
  empty: { textAlign: "center", marginTop: 60, color: "#aaa", fontSize: 16 },
  fab: {
    position: "absolute", bottom: 24, left: 24, right: 24,
    flexDirection: "row", gap: 12,
  },
  fabBtn: {
    flex: 1, backgroundColor: "#6C63FF", padding: 16,
    borderRadius: 14, alignItems: "center",
  },
  fabSecondary: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#6C63FF" },
  fabText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});