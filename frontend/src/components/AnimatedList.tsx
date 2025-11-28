// src/components/AnimatedList.tsx
import React, { useEffect, useRef, useState } from "react";
import { motion, useInView } from "motion/react";

type RenderItem<T> = (item: T, idx: number, selected: boolean) => React.ReactNode;

interface AnimatedListProps<T> {
  items: T[];
  renderItem: RenderItem<T>;

  // selection
  selectedIndex?: number;                       // controlled (preferred)
  onSelectedIndexChange?: (idx: number) => void;
  initialSelectedIndex?: number;                // fallback when uncontrolled

  // behavior
  selectOnHover?: boolean;                      // default false (click-only)
  enableArrowNavigation?: boolean;              // default true

  // visuals
  className?: string;
  itemClassName?: string;
  showGradients?: boolean;                      // default true
  displayScrollbar?: boolean;                   // default true
}

function AnimatedItem({
  children,
  delay = 0,
  index,
  onMouseEnter,
  onClick,
}: {
  children: React.ReactNode;
  delay?: number;
  index: number;
  onMouseEnter?: (i: number) => void;
  onClick?: (i: number) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { amount: 0.5, triggerOnce: false });

  return (
    <motion.div
      ref={ref}
      data-index={index}
      onMouseEnter={() => onMouseEnter?.(index)}
      onClick={() => onClick?.(index)}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={inView ? { scale: 1, opacity: 1 } : { scale: 0.9, opacity: 0 }}
      transition={{ duration: 0.18, delay }}
      className="mb-3 cursor-pointer"
    >
      {children}
    </motion.div>
  );
}

export default function AnimatedList<T>({
  items,
  renderItem,
  selectedIndex,
  onSelectedIndexChange,
  initialSelectedIndex = -1,
  selectOnHover = false,               // ← click only by default
  enableArrowNavigation = true,
  className = "",
  itemClassName = "",
  showGradients = true,
  displayScrollbar = true,
}: AnimatedListProps<T>) {
  const listRef = useRef<HTMLDivElement | null>(null);

  // controlled vs uncontrolled
  const [internalIndex, setInternalIndex] = useState(initialSelectedIndex);
  const isControlled = typeof selectedIndex === "number";
  const activeIndex = isControlled ? (selectedIndex as number) : internalIndex;

  const setIndex = (idx: number) => {
    if (isControlled) onSelectedIndexChange?.(idx);
    else setInternalIndex(idx);
  };

  const [topG, setTopG] = useState(0);
  const [botG, setBotG] = useState(1);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = el;
    setTopG(Math.min(scrollTop / 50, 1));
    const bottomDistance = scrollHeight - (scrollTop + clientHeight);
    setBotG(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
  };

  // arrow keys / enter
  useEffect(() => {
    if (!enableArrowNavigation) return;
    const handler = (e: KeyboardEvent) => {
      if (!listRef.current) return;
      if (e.key === "ArrowDown" || (e.key === "Tab" && !e.shiftKey)) {
        e.preventDefault();
        setIndex(Math.min((activeIndex ?? -1) + 1, items.length - 1));
      } else if (e.key === "ArrowUp" || (e.key === "Tab" && e.shiftKey)) {
        e.preventDefault();
        setIndex(Math.max((activeIndex ?? 0) - 1, 0));
      } else if (e.key === "Enter" && activeIndex >= 0) {
        e.preventDefault();
        onSelectedIndexChange?.(activeIndex);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items.length, activeIndex, enableArrowNavigation, onSelectedIndexChange]);

  return (
    <div className={`relative ${className}`}>
      <div
        ref={listRef}
        className={`max-h-[360px] overflow-y-auto p-1 ${
          displayScrollbar
            ? "[&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:bg-[#0b0e14] [&::-webkit-scrollbar-thumb]:bg-[#222] [&::-webkit-scrollbar-thumb]:rounded-[4px]"
            : "scrollbar-hide"
        }`}
        onScroll={handleScroll}
        style={{ scrollbarWidth: displayScrollbar ? "thin" : "none", scrollbarColor: "#222 #0b0e14" }}
      >
        {items.map((item, index) => {
          const selected = index === activeIndex;
          return (
            <AnimatedItem
              key={index}
              index={index}
              delay={0.06}
              onMouseEnter={selectOnHover ? setIndex : undefined}
              onClick={setIndex}
            >
              <div
                className={`rounded-xl border p-4 transition-colors ${
                  selected ? "border-blue-500 bg-blue-500/10" : "border-gray-700 bg-gray-800 hover:border-gray-600"
                } ${itemClassName}`}
              >
                {renderItem(item, index, selected)}
              </div>
            </AnimatedItem>
          );
        })}
      </div>

      {showGradients && (
        <>
          <div
            className="pointer-events-none absolute top-0 left-0 right-0 h-[40px] bg-gradient-to-b from-gray-900 to-transparent transition-opacity"
            style={{ opacity: topG }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-gray-900 to-transparent transition-opacity"
            style={{ opacity: botG }}
          />
        </>
      )}
    </div>
  );
}
