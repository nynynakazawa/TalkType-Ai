// src/components/CustomButton.tsx
import React from 'react';
import { Text, Pressable, StyleSheet, Dimensions } from 'react-native';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

const { width } = Dimensions.get("window");
const scale = width < 768 ? 0.8 : 1;

export default function CustomButton({ title, onPress, disabled = false }: CustomButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={styles.buttonText}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: "transparent",
    borderWidth: 2, // 約2px
    borderColor: "rgba(255, 255, 255, 0.7)",
    borderRadius: 15, // 約15px
    alignItems: "center",
    justifyContent: "center",
    minHeight: 60, // 3.75em ≒ 60px
    paddingVertical: 16,
    paddingHorizontal: 12, // 横パディングを短めに
  },
  buttonText: {
    fontSize: 20 * scale,
    fontWeight: "600",
    color: "#fff", // 文字色を白に変更
    textAlign: "center",
  },
  buttonPressed: {
    backgroundColor: "#1A1A1A",
    shadowColor: "rgba(0, 0, 0, 0.25)",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 15,
    transform: [{ translateY: -2 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});