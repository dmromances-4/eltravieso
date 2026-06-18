"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { App } from "@capacitor/app";

export default function CapacitorShell() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void StatusBar.setStyle({ style: Style.Dark });
    void StatusBar.setBackgroundColor({ color: "#0a0a0a" });

    const listener = App.addListener("appUrlOpen", ({ url }) => {
      if (!url) return;
      try {
        const parsed = new URL(url);
        const path = parsed.pathname + parsed.search;
        if (path && path !== window.location.pathname) {
          window.location.href = path;
        }
      } catch {
        // ignore malformed deep links
      }
    });

    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, []);

  return null;
}
