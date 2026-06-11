"use client";

import { useState, useEffect } from "react";

export default function TopStrip() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timestamp = time.toISOString().replace("T", " ").slice(0, 19) + "Z";

  return (
    <div className="h-6 bg-[oklch(0.218_0_0/0.95)] border-b border-border-2 flex items-center justify-between px-8 shrink-0">
      <span className="font-mono text-[15px] text-fg-3 tracking-[1px]">
        INTEGRATED_SYSTEM_NODE: 0X449F
      </span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-[15px] text-fg-3 tracking-[0.5px]">
          {timestamp}
        </span>
        <div className="w-1.5 h-1.5 bg-success shrink-0" />
        <span className="font-mono text-[15px] text-fg-3 tracking-[1px]">
          STATUS: SYNCHRONIZED
        </span>
      </div>
    </div>
  );
}
