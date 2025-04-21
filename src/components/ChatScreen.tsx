// src/components/ChatScreen.tsx
import React, { useState, useEffect, useRef, useMemo } from "react";
import { View, StyleSheet, Dimensions, Animated, Easing, Alert } from "react-native";
import Constants from "expo-constants";
import axios from "axios";
import { collection, addDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import { LinearGradient } from "expo-linear-gradient";
import ChatMessages from "./ChatMessages";
import ChatInput from "./ChatInput";
import { ChatMessage, getPhasePrompt, parseUserProfile, OpenAIResponse, UserProfile } from "./ChatHelpers";
import { getEnsembleDiagnosis } from "./EnsembleEvaluator";
import debounce from "lodash.debounce";


const { width } = Dimensions.get("window");

const MIN_REQUEST_INTERVAL = 3000;
const MAX_REQUESTS_PER_MINUTE = 10;
const MAX_TOKENS_PER_MINUTE = 5000;
const MAX_REQUESTS_PER_DAY = 200;
const MAX_TOKENS_PER_DAY = 100000;

let totalChars = 0;
let currentPhase = "phase1";
let userProfile: UserProfile | null = null;

export default function ChatScreen() {
  // React Hooksは必ずコンポーネント内で呼び出す
  const scrollViewRef = useRef(null);
  const phaseUpdatedAtRef = useRef<number>(Date.now());
  const lastAPICallTime = useRef<number>(0);
  const requestsCountMinute = useRef<number>(0);
  const tokensCountMinute = useRef<number>(0);
  const minuteStartTime = useRef<number>(Date.now());
  const requestsCountDay = useRef<number>(0);
  const tokensCountDay = useRef<number>(0);
  const dayStartTime = useRef<number>(Date.now());
  const allMessagesRef = useRef<ChatMessage[]>([
    { role: "system" as const, content: getPhasePrompt("phase1", null) }
  ]);

  const initialMessages: ChatMessage[] = (() => {
    let isReload = false;
    const navEntries = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (navEntries.length > 0) {
      isReload = navEntries[0].type === "reload";
    } else if (performance.navigation) {
      isReload = performance.navigation.type === performance.navigation.TYPE_RELOAD;
    }
    if (!isReload) {
      const cached = sessionStorage.getItem("chatConversation");
      if (cached) {
        return JSON.parse(cached);
      }
    } else {
      sessionStorage.removeItem("chatConversation");
    }
    return [{ role: "system" as const, content: getPhasePrompt("phase1", null) }];
  })();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const debouncedAddAssistantMessage = useMemo(
    () =>
      debounce((message: ChatMessage) => {
        setMessages((prev) => [...prev, message]);
      }, 300),
    []
  );
  
  useEffect(() => {
    sessionStorage.setItem("chatConversation", JSON.stringify(messages));
  }, [messages]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatDisabled, setChatDisabled] = useState(false);
  const cursorAnim = useRef(new Animated.Value(0)).current;
  const boxAnim = useRef(new Animated.Value(0)).current;
  const orangeX = useRef(new Animated.Value(0)).current;
  const orangeY = useRef(new Animated.Value(0)).current;
  const phaseIdRef = useRef(0);

  useEffect(() => {
    const animateOrange = () => {
      const randomX = Math.random() * 200 - 100;
      const randomY = Math.random() * 200 - 100;
      Animated.parallel([
        Animated.timing(orangeX, {
          toValue: randomX,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(orangeY, {
          toValue: randomY,
          duration: 3000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start(() => animateOrange());
    };
    animateOrange();
  }, [orangeX, orangeY]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(cursorAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(cursorAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(boxAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(boxAnim, {
          toValue: 0,
          duration: 2500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [cursorAnim, boxAnim]);

  // フェーズ更新処理（全会話履歴にマーカー付きシステムメッセージを追加し、UIは新フェーズのみ表示）
  useEffect(() => {
    let newPhase = "phase1";
    if (totalChars < 400) {
      newPhase = "phase1";
    } else if (totalChars < 600) {
      newPhase = "phase2";
    } else if (totalChars < 800) {
      newPhase = "phase3";
    } else {
      newPhase = "diagnosis";
    }
    if (newPhase !== currentPhase) {
      currentPhase = newPhase;
      phaseUpdatedAtRef.current = Date.now();
      phaseIdRef.current++;
      const systemMsg = { role: "system" as const, content: getPhasePrompt(newPhase, userProfile), phaseMarker: newPhase };
      // UI上は新フェーズのシステムメッセージのみ表示
      setMessages([systemMsg]);
      // 全会話履歴に追加（過去のメッセージは保持）
      allMessagesRef.current.push(systemMsg);
      console.log(`\n[Phase updated to: ${newPhase}, at: ${phaseUpdatedAtRef.current}]`);
    }
  }, [totalChars]);

  // 診断フェーズでは、複数回評価（アンサンブル評価）を実施
  useEffect(() => {
    if (currentPhase === "diagnosis") {
      (async () => {
        try {
          const now = Date.now();
          const waitTime = MIN_REQUEST_INTERVAL - (now - lastAPICallTime.current);
          if (waitTime > 0) {
            await new Promise((resolve) => setTimeout(resolve, waitTime));
          }
          lastAPICallTime.current = Date.now();
          if (now - minuteStartTime.current >= 60000) {
            minuteStartTime.current = now;
            requestsCountMinute.current = 0;
            tokensCountMinute.current = 0;
          }
          if (now - dayStartTime.current >= 24 * 60 * 60 * 1000) {
            dayStartTime.current = now;
            requestsCountDay.current = 0;
            tokensCountDay.current = 0;
          }
          if (
            requestsCountMinute.current >= MAX_REQUESTS_PER_MINUTE ||
            tokensCountMinute.current >= MAX_TOKENS_PER_MINUTE ||
            requestsCountDay.current >= MAX_REQUESTS_PER_DAY ||
            tokensCountDay.current >= MAX_TOKENS_PER_DAY
          ) {
            const delayTime = 60000 - (now - minuteStartTime.current);
            await new Promise((resolve) => setTimeout(resolve, delayTime));
            minuteStartTime.current = Date.now();
            requestsCountMinute.current = 0;
            tokensCountMinute.current = 0;
          }
          // 3回の診断評価結果からコンセンサスを取得
          const consensusDiagnosis: string = await getEnsembleDiagnosis(allMessagesRef.current);
          // 更新する際に診断結果用の phaseMarker を付与
          const diagnosisMsg: ChatMessage = { role: "assistant" as const, content: consensusDiagnosis, phaseMarker: "diagnosis" };
          setMessages((prev) => [...prev, diagnosisMsg]);
          allMessagesRef.current.push(diagnosisMsg);
          console.log("\n診断結果:", consensusDiagnosis);
          let messagesToSave = [...allMessagesRef.current];
          if (
            messagesToSave.length > 0 &&
            messagesToSave[messagesToSave.length - 1].role === "system" &&
            messagesToSave[messagesToSave.length - 1].phaseMarker === "diagnosis"
          ) {
            messagesToSave.pop();
          }
          await addDoc(collection(db, "chatSessions"), {
            timestamp: new Date(),
            messages: messagesToSave,
            diagnosis: consensusDiagnosis,
          });
          totalChars = 0; 
          currentPhase = "phase1";  
          phaseIdRef.current = 0; 
          console.log("診断完了: フェーズと文字数をリセットしました。");

          setChatDisabled(true);
        } catch (error: any) {
          console.error("診断API呼び出しエラー:", error.response?.data || error.message);
        }
      })();
    }
  }, [currentPhase]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!userProfile) {
      const parsedProfile = parseUserProfile(input);
      if (parsedProfile) {
        userProfile = parsedProfile;
        const systemMsg = { role: "system" as const, content: getPhasePrompt("phase1", userProfile) };
        setMessages([systemMsg]);
        allMessagesRef.current.push(systemMsg);
        console.log(`\n[User profile set: gender=${parsedProfile.gender}, age=${parsedProfile.age}]`);
        setInput("");
        return;
      } else {
        console.log("\nAI: 性別と年齢を確認できませんでした。もう一度教えてください。");
        setInput("");
        return;
      }
    }
    const newUserMsg: ChatMessage = { role: "user" as const, content: input };
    totalChars += input.length;
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    // 全会話履歴にも追加
    allMessagesRef.current.push(newUserMsg);
    setInput("");
    setLoading(true);
    try {
      const localPhaseTime = phaseUpdatedAtRef.current;
      const now = Date.now();
      const waitTime = MIN_REQUEST_INTERVAL - (now - lastAPICallTime.current);
      if (waitTime > 0) {
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
      lastAPICallTime.current = Date.now();
      if (now - minuteStartTime.current >= 60000) {
        minuteStartTime.current = now;
        requestsCountMinute.current = 0;
        tokensCountMinute.current = 0;
      }
      if (now - dayStartTime.current >= 24 * 60 * 60 * 1000) {
        dayStartTime.current = now;
        requestsCountDay.current = 0;
        tokensCountDay.current = 0;
      }
      if (
        requestsCountMinute.current >= MAX_REQUESTS_PER_MINUTE ||
        tokensCountMinute.current >= MAX_TOKENS_PER_MINUTE ||
        requestsCountDay.current >= MAX_REQUESTS_PER_DAY ||
        tokensCountDay.current >= MAX_TOKENS_PER_DAY
      ) {
        const delayTime = 60000 - (now - minuteStartTime.current);
        await new Promise((resolve) => setTimeout(resolve, delayTime));
        minuteStartTime.current = Date.now();
        requestsCountMinute.current = 0;
        tokensCountMinute.current = 0;
      }
      const currentPhaseId = phaseIdRef.current;
      const response = await axios.post<OpenAIResponse>(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: updatedMessages,
          temperature: 0.7,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${Constants.expoConfig?.extra?.GPT4O_MINI_API_KEY}`,
          },
        }
      );
      requestsCountMinute.current += 1;
      requestsCountDay.current += 1;
      tokensCountMinute.current += response.data.usage.total_tokens;
      tokensCountDay.current += response.data.usage.total_tokens;
      const assistantMessage = response.data.choices[0].message.content;
      if (localPhaseTime !== phaseUpdatedAtRef.current) {
        console.log("古いフェーズのレスポンスを無視します。");
        setLoading(false);
        return;
      }
      if (currentPhase === "diagnosis") {
        console.log("\n[診断フェーズでは送信されたユーザーメッセージに対する通常のAIの返信は非表示]");
      } else if (currentPhaseId === phaseIdRef.current) {
        debouncedAddAssistantMessage({ role: "assistant" as const, content: assistantMessage });
        allMessagesRef.current.push({ role: "assistant" as const, content: assistantMessage });
        console.log("\nAI:", assistantMessage);
      } else {
        console.log("\n[フェーズ移行直後のAIの返信は非表示]");
      }
      console.log(`[Total characters: ${totalChars}]`);
    } catch (error: any) {
      console.error("API呼び出しエラー:", error.response?.data || error.message);
      Alert.alert("エラー", "チャットの送信中に問題が発生しました。");
    }
    setLoading(false);
  };

  const progressValue = Math.min(totalChars / 800, 1);

  return (
    <LinearGradient colors={["#1e1e2f", "#3e3e55"]} style={styles.container}>
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { width: `${progressValue * 100}%` }]} />
      </View>
      <ChatMessages messages={messages} scrollViewRef={scrollViewRef as any} />
      <ChatInput input={input} setInput={setInput} onSend={sendMessage} loading={loading} chatDisabled={chatDisabled} />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  progressContainer: {
    position: "absolute",
    top: 16,
    right: 16,
    width: 100,
    height: 10,
    borderColor: "#fff",
    borderWidth: 1,
    borderRadius: 5,
    backgroundColor: "rgba(255,255,255,0.2)",
    zIndex: 1000,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 5,
  },
});