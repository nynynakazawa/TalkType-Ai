// app/history.tsx
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, Dimensions, Pressable } from "react-native";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "../src/firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import SessionDetailView from "../src/components/SessionDetailView";



const { width } = Dimensions.get("window");
const scale = width < 768 ? 0.8 : 1;

export default function HistoryScreen() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      const q = query(collection(db, "chatSessions"), orderBy("timestamp", "desc"));
      const querySnapshot = await getDocs(q);
      const sessionData: any[] = [];
      querySnapshot.forEach((doc) => {
        sessionData.push({ id: doc.id, ...doc.data() });
      });
      setSessions(sessionData);
    };
    fetchSessions();
  }, []);

  if (selectedSession) {
    return <SessionDetailView session={selectedSession} onBack={() => setSelectedSession(null)} />;
  }

  return (
    <LinearGradient colors={["#1e1e2f", "#3e3e55"]} style={styles.container}>
      <Text style={styles.title}>診断結果履歴</Text>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable style={styles.sessionItem} onPress={() => setSelectedSession(item)}>
            <Text style={styles.timestamp}>
              {new Date(item.timestamp.seconds * 1000).toLocaleString()}
            </Text>
            <Text style={styles.diagnosis} numberOfLines={1}>
            {item.diagnosis && item.diagnosis.trim() !== "" ? `診断結果: ${item.diagnosis}` : "詳細を見る"}
            </Text>
          </Pressable>
        )}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: {
    fontSize: 28 * scale,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
  },
  sessionItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.3)",
    marginBottom: 8,
  },
  timestamp: {
    color: "#ccc",
    fontSize: 20 * scale,
    marginBottom: 4,
  },
  diagnosis: {
    color: "#fff",
    fontSize: 20 * scale,
  },
});