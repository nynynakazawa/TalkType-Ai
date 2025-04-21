import axios from "axios";
import Constants from "expo-constants";
import { ChatMessage, OpenAIResponse } from "./ChatHelpers";

/**
 * 3回の診断結果を取得し、各結果のうち類似度が一定以上のもの（threshold以上）をコンセンサス結果として返す。
 * ここでは簡易なJaccard類似度を用いて、各結果を単語ごとに比較しています。
 */
export async function getEnsembleDiagnosis(messages: ChatMessage[]): Promise<string> {
  const apiKey = Constants.expoConfig?.extra?.GPT4O_MINI_API_KEY;
  if (!apiKey) throw new Error("API key is missing");

  const requestData = {
    model: "gpt-4o-mini",
    messages: messages,
    temperature: 0.7,
  };

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  try {
    // 並列で3回リクエストを発行
    const responses = await Promise.all([
      axios.post<OpenAIResponse>("https://api.openai.com/v1/chat/completions", requestData, { headers }),
      axios.post<OpenAIResponse>("https://api.openai.com/v1/chat/completions", requestData, { headers }),
      axios.post<OpenAIResponse>("https://api.openai.com/v1/chat/completions", requestData, { headers }),
    ]);

    const results = responses.map(res => res.data.choices[0].message.content);

    // 簡易なJaccard類似度で文字列の類似度を算出する関数
    function jaccardSimilarity(str1: string, str2: string): number {
      const set1 = new Set(str1.toLowerCase().split(/\W+/).filter(Boolean));
      const set2 = new Set(str2.toLowerCase().split(/\W+/).filter(Boolean));
      const intersection = new Set([...set1].filter(x => set2.has(x)));
      const union = new Set([...set1, ...set2]);
      return union.size === 0 ? 0 : intersection.size / union.size;
    }

    const sim12 = jaccardSimilarity(results[0], results[1]);
    const sim13 = jaccardSimilarity(results[0], results[2]);
    const sim23 = jaccardSimilarity(results[1], results[2]);

    const threshold = 0.7; // 類似度の閾値

    let consensus = "";
    if (sim12 >= threshold && sim13 >= threshold) {
      consensus = results[0];
    } else if (sim12 >= threshold && sim23 >= threshold) {
      consensus = results[1];
    } else if (sim13 >= threshold && sim23 >= threshold) {
      consensus = results[2];
    } else {
      // いずれも閾値を下回る場合は、例えば3つの結果を連結した上で再評価するか、単に最初の結果を採用する
      consensus = results[0];
    }

    return consensus;
  } catch (error) {
    throw error;
  }
}