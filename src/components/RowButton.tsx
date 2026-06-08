import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { spring } from "../lib/motion";

type RowButtonProps = {
  children?: ReactNode;
  className?: string;
  icon?: string;
  meta?: string;
  onClick?: () => void;
  title: string;
  type?: "button" | "submit";
};

export function RowButton({
  children,
  className = "",
  icon,
  meta,
  onClick,
  title,
  type = "button"
}: RowButtonProps) {
  return (
    <motion.button
      className={`row-button ${className}`}
      onClick={onClick}
      type={type}
      whileHover={{ y: -1, scale: 1.012 }}
      whileTap={{ scale: 0.978 }}
      transition={spring}
    >
      <span className="row-button__main">
        {icon && <span className="row-button__icon">{icon}</span>}
        <span>{title}</span>
      </span>
      {children ?? (meta && <span className="row-button__meta">{meta}</span>)}
    </motion.button>
  );
}
