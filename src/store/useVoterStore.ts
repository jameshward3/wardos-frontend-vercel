"use client";

import { useSyncExternalStore } from "react";
import type { PlatformAnalytics } from "../types/voter";
import { demoAnalytics } from "../lib/analytics";

type LayerMode = "turnout" | "registered" | "party" | "ballot" | "persuasion" | "gotv" | "swing";
type GeographyMode = "ward" | "district" | "street";

interface VoterState {
  analytics: PlatformAnalytics;
  layerMode: LayerMode;
  geographyMode: GeographyMode;
  selectedWard: string;
  selectedDistrict: string;
  opacity: number;
}

const listeners = new Set<() => void>();
let state: VoterState = {
  analytics: demoAnalytics(),
  layerMode: "turnout",
  geographyMode: "ward",
  selectedWard: "All",
  selectedDistrict: "All",
  opacity: 82,
};

function emit() {
  listeners.forEach((listener) => listener());
  if (typeof indexedDB !== "undefined") {
    const request = indexedDB.open("orange-voter-intelligence", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("platform");
    request.onsuccess = () => {
      const tx = request.result.transaction("platform", "readwrite");
      tx.objectStore("platform").put(state.analytics, "analytics");
    };
  }
}

export function setVoterState(patch: Partial<VoterState>) {
  state = { ...state, ...patch };
  emit();
}

export function useVoterStore() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
    () => state,
  );
}
