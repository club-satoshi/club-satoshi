"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

interface ReelProps {
  items: ReactNode[];
  /** Pixel height of one row, or "auto" to measure the first child. */
  itemHeight: number | "auto";
  intervalMs: number;
  className?: string;
  trackClassName?: string;
  /** Called after each full loop, right before jumping back to the start. */
  onCycle?: () => void;
}

/**
 * Vertical sliding reel. Same 0.7s easing and clone-reset trick as the original,
 * which used three copies and an instant translateY reset.
 */
export default function Reel({
  items,
  itemHeight,
  intervalMs,
  className,
  trackClassName,
  onCycle,
}: ReelProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [autoHeight, setAutoHeight] = useState(0);
  const height = itemHeight === "auto" ? autoHeight : itemHeight;
  const [state, setState] = useState({ i: 0, animate: true });
  const last = items.length - 1;

  useEffect(() => {
    if (itemHeight !== "auto") return;
    const measure = () => {
      const first = trackRef.current?.firstElementChild as HTMLElement | null;
      if (first) setAutoHeight(first.offsetHeight);
    };
    const frame = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", measure);
    };
  }, [itemHeight, items.length]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setState((prev) => ({ i: Math.min(prev.i + 1, last), animate: true }));
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs, last]);

  useEffect(() => {
    if (state.i !== last) return;
    const id = window.setTimeout(() => {
      onCycle?.();
      setState({ i: 0, animate: false });
    }, 760);
    return () => window.clearTimeout(id);
  }, [state.i, last, onCycle]);

  return (
    <div className={className}>
      <div
        ref={trackRef}
        className={trackClassName}
        style={{
          transition: state.animate
            ? "transform .7s cubic-bezier(.65, 0, .35, 1)"
            : "none",
          transform: `translateY(-${state.i * height}px)`,
        }}
      >
        {items}
      </div>
    </div>
  );
}
