export const easeOut = [0.22, 1, 0.36, 1] as const;

export const spring = {
  type: "spring",
  stiffness: 380,
  damping: 31,
  mass: 0.72
} as const;

export const gentleSpring = {
  type: "spring",
  stiffness: 260,
  damping: 26,
  mass: 0.85
} as const;

export const pageTransition = {
  duration: 0.52,
  ease: easeOut
};

export const rowContainer = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.045
    }
  }
};

export const rowItem = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1 }
};
