// src/components/ChatInput.tsx
import React, { useState } from "react";
import { View, TextInput, Pressable, Text, StyleSheet } from "react-native";
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const scale = width < 768 ? 0.8 : 1;

interface ChatInputProps {
  input: string;
  setInput: (text: string) => void;
  onSend: () => void;
  loading: boolean;
  chatDisabled: boolean;
}

export default function ChatInput({ input, setInput, onSend, loading, chatDisabled }: ChatInputProps) {
  // ここで useState をコンポーネント内で呼び出す
  const [inputHeight, setInputHeight] = useState(60);

  return (
    <View style={styles.inputContainer}>
     <TextInput
        style={[styles.input, { height: Math.min(Math.max(60, inputHeight), 300) }]}
        value={input}
        onChangeText={setInput}
        placeholder="メッセージを入力"
        placeholderTextColor="#ccc"
        multiline={true}
        editable={!chatDisabled}
        onContentSizeChange={(e) => {
          if (!input.trim()) {  // 入力が空の場合は高さを60に固定
            if (inputHeight !== 60) setInputHeight(60);
            return;
          }
          const newHeight = Math.min(e.nativeEvent.contentSize.height, 300);
          setInputHeight((prevHeight) => {
            if (Math.abs(newHeight - prevHeight) > 1) return newHeight;
            return prevHeight;
          });
        }}
      />
      <Pressable
        style={({ pressed }) => [
          styles.sendButton,
          pressed && styles.sendButtonPressed,
        ]}
        onPress={onSend}
        disabled={loading}
      >
        <Text style={styles.sendButtonText}>
          {loading ? "送信中..." : "送信"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  input: {
    flex: 1,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    paddingVertical: 16,
    paddingHorizontal: 37,
    borderRadius: 15,
    color: "#fff",
    marginRight: 8,
    fontSize: 20 * scale,
    height: 60,
  },
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
    fontSize: 20 * scale,
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