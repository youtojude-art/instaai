"use client";

import { useEffect, useRef } from "react";

type ChatScrollAnchorProps = {
  messageCount: number;
};

export function ChatScrollAnchor({ messageCount }: ChatScrollAnchorProps) {
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    anchorRef.current?.scrollIntoView({
      block: "end",
      behavior: "smooth"
    });
  }, [messageCount]);

  return <div ref={anchorRef} aria-hidden="true" />;
}
