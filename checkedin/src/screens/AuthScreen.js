import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../../firebase";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email || !password || (!isLogin && !name)) {
      Alert.alert("Oops", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: name });
      }
    } catch (err) {
      Alert.alert("Error", err.message);
    }
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.logo}>CheckedIn</Text>
      <Text style={styles.tagline}>Challenge your crew.</Text>

      <View style={styles.card}>
        <Text style={styles.title}>{isLogin ? "Welcome back" : "Create account"}</Text>

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#aaa"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? "Please wait..." : isLogin ? "Log In" : "Sign Up"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? "No account? Sign up" : "Already have one? Log in"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#6C63FF", justifyContent: "center", padding: 24 },
  logo: { fontSize: 40, fontWeight: "800", color: "#fff", textAlign: "center" },
  tagline: { color: "#D9D6FF", textAlign: "center", marginBottom: 32, fontSize: 16 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 24 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 20, color: "#1a1a2e" },
  input: {
    borderWidth: 1, borderColor: "#e0e0e0", borderRadius: 10,
    padding: 14, marginBottom: 14, fontSize: 15,
    color: "#000",
  },
  button: {
    backgroundColor: "#6C63FF", padding: 16, borderRadius: 10,
    alignItems: "center", marginTop: 4,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  switchText: { textAlign: "center", marginTop: 16, color: "#6C63FF", fontWeight: "600" },
});