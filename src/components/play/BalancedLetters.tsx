"use client";

import { Children, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { letterRowSizes, letterTileGap, letterTileWidth } from "@/lib/balancedLetters";
import styles from "./Playground.module.css";

export function BalancedLetters({ children, className, label }: {
  children: ReactNode; className: string; label: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(3 * letterTileWidth + 2 * letterTileGap);
  useLayoutEffect(() => {
    const element = container.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const tiles = Children.toArray(children);
  const rows = letterRowSizes(tiles.length, width);
  const longest = rows[0] ?? 1;
  let index = 0;
  // Half-tile grid tracks center shorter rows. Keep cells in one flat DOM list
  // so resizing never reparents focused buttons or changes keyboard order.
  return <div ref={container} className={className} role="group" aria-label={label}
    style={{ gridTemplateColumns: `repeat(${longest * 2}, ${(letterTileWidth - letterTileGap) / 2}px)`, gap: letterTileGap }}>
    {rows.flatMap((size, row) => Array.from({ length: size }, (_, column) => {
      const tile = tiles[index++];
      return <span key={index} className={styles.letterCell}
        style={{ gridRow: row + 1, gridColumn: `${longest - size + column * 2 + 1} / span 2` }}>{tile}</span>;
    }))}
  </div>;
}
