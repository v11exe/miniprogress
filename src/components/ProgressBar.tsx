import {
  animate,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion
} from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { easeOut, gentleSpring } from "../lib/motion";
import type { ProgressBarStyleId } from "../lib/progress";

type ProgressBarProps = {
  animated?: boolean;
  delay?: number;
  onClick?: () => void;
  percent: number;
  preview?: boolean;
  showNumber?: boolean;
  size?: "large" | "small";
  styleId?: ProgressBarStyleId;
};

const steppedStyles = new Set<ProgressBarStyleId>([
  "segmented-capsule",
  "rounded-blocks",
  "pixel-battery",
  "stepped-dots"
]);

export function ProgressBar({
  animated = true,
  delay = 0.08,
  onClick,
  percent,
  preview = false,
  showNumber = true,
  size = "large",
  styleId = "soft-pill"
}: ProgressBarProps) {
  const displayedPercent = useAnimatedPercent(percent, delay, animated);
  const className = [
    "progress-bar",
    `progress-bar--${size}`,
    `progress-bar--${styleId}`,
    preview ? "progress-bar--preview" : "",
    onClick ? "progress-bar--button" : ""
  ]
    .filter(Boolean)
    .join(" ");
  const bar = steppedStyles.has(styleId) ? (
    <SteppedBar percent={percent} styleId={styleId} />
  ) : (
    <div className="progress-bar__track" aria-hidden="true">
      <motion.div
        animate={{ width: `${percent}%` }}
        className="progress-bar__fill"
        initial={animated ? { width: "0%" } : false}
        transition={{ ...gentleSpring, delay }}
      >
        {styleId === "thin-slider" && <span className="progress-bar__thumb" />}
      </motion.div>
    </div>
  );

  if (onClick) {
    return (
      <button
        aria-label="choose progress bar style"
        className={className}
        onClick={onClick}
        type="button"
      >
        {bar}
        {showNumber && <span className="progress-bar__number">{displayedPercent}%</span>}
      </button>
    );
  }

  return (
    <div className={className}>
      {bar}
      {showNumber && <span className="progress-bar__number">{displayedPercent}%</span>}
    </div>
  );
}

type SteppedBarProps = {
  percent: number;
  styleId: ProgressBarStyleId;
};

function SteppedBar({ percent, styleId }: SteppedBarProps) {
  const count = styleId === "stepped-dots" ? 18 : styleId === "pixel-battery" ? 16 : 14;
  const completedCount = Math.round((percent / 100) * count);
  const cells = useMemo(
    () => Array.from({ length: count }, (_, index) => index),
    [count]
  );

  return (
    <div className="progress-bar__track" aria-hidden="true">
      <div
        className="progress-bar__cells"
        style={{ "--cell-count": count } as CSSProperties}
      >
        {cells.map((index) => (
          <motion.span
            animate={{
              opacity: index < completedCount ? 1 : 0.42,
              scale: index < completedCount ? 1 : 0.92
            }}
            className={index < completedCount ? "is-filled" : ""}
            key={index}
            transition={{
              ...gentleSpring,
              delay: Math.min(index * 0.018, 0.18)
            }}
          />
        ))}
      </div>
    </div>
  );
}

function useAnimatedPercent(target: number, delay: number, animated: boolean) {
  const motionValue = useMotionValue(animated ? 0 : target);
  const prefersReducedMotion = useReducedMotion();
  const [displayed, setDisplayed] = useState(animated ? 0 : target);

  useMotionValueEvent(motionValue, "change", (latest) => {
    setDisplayed(Math.round(latest));
  });

  useEffect(() => {
    if (!animated || prefersReducedMotion) {
      motionValue.set(target);
      setDisplayed(target);
      return;
    }

    const controls = animate(motionValue, target, {
      delay,
      duration: 0.66,
      ease: easeOut
    });

    return () => controls.stop();
  }, [animated, delay, motionValue, prefersReducedMotion, target]);

  return displayed;
}
