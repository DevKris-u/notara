"use client";

import { useEffect, useRef } from "react";

export function ScrollToBottom({ signal }: { signal: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollIntoView({ block: "end" });
  }, [signal]);

  return <div ref={ref} aria-hidden="true" />;
}
