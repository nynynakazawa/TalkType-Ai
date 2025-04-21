// src/components/PhaseTabs.tsx
import React from "react";
import {Pressable, Text, StyleSheet, ScrollView } from "react-native";
import { Dimensions } from 'react-native';
const { width } = Dimensions.get('window');
const scale = width < 768 ? 0.8 : 1;

interface PhaseTabsProps {
  selectedPhase: string;
  setSelectedPhase: (phase: string) => void;
}

export default function PhaseTabs({ selectedPhase, setSelectedPhase }: PhaseTabsProps) {
  const phases = ["phase1", "phase2", "phase3", "diagnosis"];
  return (
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.phaseTabs}
      >
        {['phase1', 'phase2', 'phase3', 'diagnosis'].map((phase) => (
          <Pressable
            key={phase}
            onPress={() => setSelectedPhase(phase)}
            style={[styles.tab, selectedPhase === phase && styles.activeTab]}
          >
            <Text style={styles.tabText}>{phase.toUpperCase()}</Text>
          </Pressable>
        ))}
      </ScrollView>
    );
}

const styles = StyleSheet.create({
  phaseTabs: {
    flexDirection: "row",
    marginLeft: 10,
  },
  tab: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.7)",
    borderRadius: 15,
    minHeight: 60,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: "#1A1A1A",
  },
  tabText: {
    fontSize: 20 * scale,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});