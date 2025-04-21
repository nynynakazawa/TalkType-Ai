// app/index.tsx
import React from "react";
import { StyleSheet, View, Text, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import CustomButton from "../src/components/CustomButton";


const { width } = Dimensions.get("window");
const scale = width < 768 ? 0.8 : 1;

export default function HomeScreen() {
  const router = useRouter();
  return (
    <LinearGradient colors={["#1e1e2f", "#3e3e55"]} style={styles.container}>
      <Text style={styles.title}>TalkType AI</Text>
      <View style={styles.buttonContainer}>
  <CustomButton
    title="チャットを開始"
    onPress={() => router.push("/chat")}
  />
  <View style={styles.buttonSpacer} />
  <CustomButton
    title="診断結果履歴"
    onPress={() => router.push("/history")}
  />
</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 46, // 少し抑えたサイズ
    color: "#fff",
    marginBottom: 30,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 8,
  },
  buttonContainer: {
    flexDirection: "row", // 横並び
    justifyContent: "center", // 中央揃え
    alignItems: "center", // 垂直方向の中央揃え
    marginTop: 20, // 上方向の余白（適宜調整）
    width: "80%", // 幅を指定（削除せず統合）
  },
  buttonSpacer: {
    width: 20, // ボタン間のスペース（適宜調整）
  },
});