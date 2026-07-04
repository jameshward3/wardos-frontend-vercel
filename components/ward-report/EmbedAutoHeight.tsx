"use client";

import { useEffect } from "react";

/**
 * When this page is loaded inside an iframe (e.g. the jw4o.com/wardreport
 * Squarespace embed), posts the document height to the parent window so the
 * embedding page can resize the iframe instead of clipping content or
 * showing a nested scrollbar. Renders nothing; see README for the matching
 * Squarespace-side listener snippet. No-ops when not embedded.
 */
export function EmbedAutoHeight() {
  useEffect(() => {
    if (window.self === window.top) return;

    const postHeight = () => {
      window.parent.postMessage(
        { type: "ward-report:height", height: document.documentElement.scrollHeight },
        "*",
      );
    };

    postHeight();
    const observer = new ResizeObserver(postHeight);
    observer.observe(document.documentElement);
    window.addEventListener("load", postHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener("load", postHeight);
    };
  }, []);

  return null;
}
