// src/components/SessionDetailView.tsx
import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, StyleSheet, Button } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { groupMessagesByPhase, filterSystemText } from "./ChatHelpers";
import PhaseTabs from "./PhaseTabs";
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const scale = width < 768 ? 0.8 : 1;

interface SessionDetailViewProps {
  session: any;
  onBack: () => void;
}

export default function SessionDetailView({ session, onBack }: SessionDetailViewProps) {
  const [selectedPhase, setSelectedPhase] = useState("phase1");
  const phases = groupMessagesByPhase(session.messages);
  const messagesToDisplay = phases[selectedPhase] || [];

  return (
    <LinearGradient colors={["#1e1e2f", "#3e3e55"]} style={styles.container}>
      <View style={styles.header}>
        <Pressable style={({ pressed }) => [
          styles.sendButton,
          pressed && styles.sendButtonPressed,
          { marginRight: 10 },
        ]} onPress={onBack}>
          <Text style={styles.sendButtonText}>← 戻る</Text>
        </Pressable>
        <PhaseTabs selectedPhase={selectedPhase} setSelectedPhase={setSelectedPhase} />
      </View>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start" }} style={styles.chatContainer}>
        {messagesToDisplay.map((msg: any, index: number) => {
          let bubbleStyle = styles.message;
          let displayText = msg.content;
          if (msg.role === "user") {
            bubbleStyle = { ...bubbleStyle, ...styles.userBubble };
            displayText = "あなた: " + msg.content;
          } else if (msg.role === "assistant") {
            bubbleStyle = { ...bubbleStyle, ...styles.aiBubble };
          } else if (msg.role === "system") {
            displayText = filterSystemText(msg.content);
            bubbleStyle = { ...bubbleStyle, ...styles.systemBubble };
          }
          return (
            <View key={index} style={bubbleStyle}>
              <Text style={msg.role === "user" ? styles.userText : styles.aiText}>
                {displayText}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  chatContainer: { flex: 1, marginBottom: 16 },
  message: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  aiBubble: {
    alignSelf: "flex-start",
    maxWidth: "80%",
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "80%",
  },
  systemBubble: {
    alignSelf: "center",
    maxWidth: "80%",
  },
  userText: { fontWeight: "bold", color: "#ffcccb", fontSize: 20 * scale },
  aiText: { fontWeight: "bold", color: "#add8e6", fontSize: 20 * scale },
  sendButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 15,
    minHeight: 60,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonText: {
    fontSize: 20  * scale,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
  sendButtonPressed: {
    backgroundColor: "#1A1A1A",
    shadowColor: "rgba(0,0,0,0.25)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    transform: [{ translateY: -2 }],
  },
});