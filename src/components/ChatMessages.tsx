// src/components/ChatMessages.tsx
import React, { useRef } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { ChatMessage } from "./ChatHelpers";
import { filterSystemText } from "./ChatHelpers";
import { Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
const scale = width < 768 ? 0.8 : 1;
const prevContentHeightRef = useRef(0);

interface ChatMessagesProps {
  messages: ChatMessage[];
  scrollViewRef: React.RefObject<ScrollView>;
}

export default function ChatMessages({ messages, scrollViewRef }: ChatMessagesProps) {
  return (
        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-start" }}
          ref={scrollViewRef}
          onContentSizeChange={(contentWidth, contentHeight) => {
            if (contentHeight !== prevContentHeightRef.current) { // 前回と高さが変わった場合のみスクロールする
              prevContentHeightRef.current = contentHeight;
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }
          }}
        >
      {messages.map((msg, index) => {
        let bubbleStyle = styles.message;
        let displayText = msg.content;
        if (msg.role === "assistant") {
          bubbleStyle = { ...bubbleStyle, ...styles.aiBubble };
        } else if (msg.role === "user") {
          bubbleStyle = { ...bubbleStyle, ...styles.userBubble };
          displayText = "あなた: " + msg.content;
        } else if (msg.role === "system") {
          displayText = filterSystemText(msg.content);
          bubbleStyle = { ...bubbleStyle, ...styles.systemBubble };
        }
        return (
          <View key={index} style={bubbleStyle}>
            <Text style={msg.role === "user" ? styles.userText : styles.aiText}>{displayText}</Text>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    marginTop: 20, 
  },
  userText: { fontWeight: "bold", color: "#ffcccb", fontSize: 20 * scale},
  aiText: { fontWeight: "bold", color: "#add8e6", fontSize: 20 * scale },
});