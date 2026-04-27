import { useEffect, useState } from "react";
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, Platform, Share,
} from "react-native";
import {
  doc, onSnapshot, collection, updateDoc,
  serverTimestamp, deleteDoc, getDocs,
  setDoc, increment, getDoc,
} from "firebase/firestore";
import { auth, db } from "../../firebase";

const getTodayString = () => new Date().toISOString().split("T")[0];

export default function ChallengeDetailScreen({ route, navigation }) {
  const { challengeId } = route.params;
  const [challenge, setChallenge] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [myHistory, setMyHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const user = auth.currentUser;

  // Listen to challenge document
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "challenges", challengeId), (snap) => {
      if (snap.exists()) setChallenge({ id: snap.id, ...snap.data() });
    });
    return unsub;
  }, [challengeId]);

  // Listen to participants in real-time
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "challenges", challengeId, "participants"),
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setParticipants(list);
      }
    );
    return unsub;
  }, [challengeId]);

  // Load personal check-in history
  useEffect(() => {
    const loadHistory = async () => {
      const snap = await getDocs(
        collection(db, "challenges", challengeId, "participants", user.uid, "checkIns")
      );
      const dates = snap.docs.map((d) => d.id).sort((a, b) => b.localeCompare(a));
      setMyHistory(dates);
    };
    loadHistory();
  }, [challengeId, participants]);

  const myEntry = participants.find((p) => p.id === user.uid);
  const alreadyCheckedInToday = myEntry?.lastCheckInDate === getTodayString();
  const isCreator = challenge?.createdBy === user.uid;

  const handleCheckIn = async () => {
    const doCheckIn = async () => {
      const today = getTodayString();
      try {
        // Store this day's check-in
        await setDoc(
          doc(db, "challenges", challengeId, "participants", user.uid, "checkIns", today),
          { checkedInAt: serverTimestamp() }
        );
        // Update participant summary
        await updateDoc(
          doc(db, "challenges", challengeId, "participants", user.uid),
          {
            totalCheckIns: increment(1),
            lastCheckInDate: today,
          }
        );
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Confirm you've completed today's challenge!");
      if (confirmed) doCheckIn();
    } else {
      Alert.alert("Check in?", "Confirm you've completed today's challenge!", [
        { text: "Cancel" },
        { text: "Yes, I did it! ✅", onPress: doCheckIn },
      ]);
    }
  };

  const handleDelete = async () => {
    const doDelete = async () => {
      try {
        const participantsSnap = await getDocs(
          collection(db, "challenges", challengeId, "participants")
        );
        await Promise.all(participantsSnap.docs.map((d) => deleteDoc(d.ref)));
        await deleteDoc(doc(db, "challenges", challengeId));
        navigation.goBack();
      } catch (err) {
        Alert.alert("Error", err.message);
      }
    };

    if (Platform.OS === "web") {
      const confirmed = window.confirm("Delete this challenge? This cannot be undone.");
      if (confirmed) doDelete();
    } else {
      Alert.alert("Delete challenge?", "This cannot be undone.", [
        { text: "Cancel" },
        { text: "Delete", style: "destructive", onPress: doDelete },
      ]);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join my challenge "${challenge.title}" on CheckedIn!\n\nUse code: ${challenge.code}`,
      });
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

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

  // Sorted leaderboard
  const leaderboard = [...participants].sort(
    (a, b) => (b.totalCheckIns || 0) - (a.totalCheckIns || 0)
  );

  const renderOverviewParticipant = ({ item }) => (
    <View style={[styles.participant, item.lastCheckInDate === getTodayString() && styles.participantDone]}>
      <Text style={styles.participantName}>
        {item.lastCheckInDate === getTodayString() ? "✅" : "⏳"} {item.name}
        {item.id === user.uid ? " (you)" : ""}
      </Text>
      <Text style={styles.checkedTime}>
        {item.totalCheckIns || 0} day{(item.totalCheckIns || 0) !== 1 ? "s" : ""} completed
      </Text>
    </View>
  );

  const renderLeaderboard = ({ item, index }) => (
    <View style={[styles.participant, index === 0 && styles.firstPlace]}>
      <View style={styles.leaderRow}>
        <Text style={styles.leaderRank}>
          {index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `#${index + 1}`}
        </Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.participantName}>
            {item.name}{item.id === user.uid ? " (you)" : ""}
          </Text>
          <Text style={styles.checkedTime}>
            {item.totalCheckIns || 0} day{(item.totalCheckIns || 0) !== 1 ? "s" : ""} completed
          </Text>
        </View>
      </View>
    </View>
  );

  const renderHistory = ({ item }) => (
    <View style={styles.participant}>
      <Text style={styles.participantName}>✅ {item}</Text>
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
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <Text style={styles.heroTitle}>{challenge.title}</Text>
          {isCreator && (
            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
              <Text style={styles.deleteBtnText}>🗑</Text>
            </TouchableOpacity>
          )}
        </View>
        {challenge.description ? (
          <Text style={styles.heroDesc}>{challenge.description}</Text>
        ) : null}
        <Text style={styles.heroDeadline}>{getDeadlineText()}</Text>
        <View style={styles.heroBottom}>
          <View style={styles.codeBadge}>
            <Text style={styles.codeText}>Code: {challenge.code}</Text>
          </View>
          <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
            <Text style={styles.shareBtnText}>📤 Invite</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {["overview", "leaderboard", "history"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === "overview" ? "👥 Overview" : tab === "leaderboard" ? "🏆 Leaderboard" : "📅 My History"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <FlatList
          data={participants}
          keyExtractor={(item) => item.id}
          renderItem={renderOverviewParticipant}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Participants ({participants.length})</Text>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {activeTab === "leaderboard" && (
        <FlatList
          data={leaderboard}
          keyExtractor={(item) => item.id}
          renderItem={renderLeaderboard}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>Rankings</Text>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {activeTab === "history" && (
        <FlatList
          data={myHistory}
          keyExtractor={(item) => item}
          renderItem={renderHistory}
          ListHeaderComponent={
            <Text style={styles.sectionTitle}>
              Your check-ins ({myHistory.length} day{myHistory.length !== 1 ? "s" : ""})
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No check-ins yet. Start today!</Text>
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />
      )}

      {/* Check In Button */}
      {!alreadyCheckedInToday ? (
        <TouchableOpacity style={styles.checkInBtn} onPress={handleCheckIn}>
          <Text style={styles.checkInText}>✅ Check In for Today</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.doneBar}>
          <Text style={styles.doneText}>You're checked in for today 🎉</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  hero: { backgroundColor: "#6C63FF", padding: 24 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff", flex: 1 },
  deleteBtn: {
    backgroundColor: "rgba(255,0,0,0.25)", padding: 8, borderRadius: 8, marginLeft: 10,
  },
  deleteBtnText: { fontSize: 16 },
  heroDesc: { color: "#D9D6FF", marginTop: 8, fontSize: 15 },
  heroDeadline: { color: "#fff", marginTop: 10, fontWeight: "600" },
  heroBottom: { flexDirection: "row", alignItems: "center", marginTop: 12, gap: 10 },
  codeBadge: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  codeText: { color: "#fff", fontWeight: "700", letterSpacing: 2 },
  shareBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  shareBtnText: { color: "#fff", fontWeight: "700" },
  tabs: { flexDirection: "row", backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eee" },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabActive: { borderBottomWidth: 3, borderBottomColor: "#6C63FF" },
  tabText: { fontSize: 12, color: "#aaa", fontWeight: "600" },
  tabTextActive: { color: "#6C63FF" },
  sectionTitle: { fontWeight: "700", fontSize: 16, margin: 16, color: "#1a1a2e" },
  participant: {
    backgroundColor: "#fff", marginHorizontal: 16, marginBottom: 10,
    borderRadius: 12, padding: 16,
    shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 1,
  },
  participantDone: { borderLeftWidth: 4, borderLeftColor: "#4CAF50" },
  firstPlace: { borderLeftWidth: 4, borderLeftColor: "#FFD700" },
  participantName: { fontSize: 16, fontWeight: "600", color: "#1a1a2e" },
  checkedTime: { color: "#888", fontSize: 12, marginTop: 4 },
  leaderRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  leaderRank: { fontSize: 24 },
  empty: { textAlign: "center", marginTop: 40, color: "#aaa", fontSize: 15 },
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