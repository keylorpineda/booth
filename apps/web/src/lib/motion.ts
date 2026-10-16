import { type Transition, type Variants } from 'motion/react';

/**
 * Motion presets shared by every component. The app root wraps everything in
 * `<MotionConfig reducedMotion="user">`, so transforms are skipped for people who prefer
 * reduced motion and only opacity fades remain.
 */
export const spring = {
  /** Buttons, toggles, small feedback. */
  snappy: { type: 'spring', stiffness: 520, damping: 32, mass: 0.7 },
  /** Sheets, panels, layout changes. */
  gentle: { type: 'spring', stiffness: 260, damping: 30 },
  /** Playful pops: cart badge, success check. */
  bouncy: { type: 'spring', stiffness: 420, damping: 14 },
} satisfies Record<string, Transition>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: spring.gentle },
};

export const staggerChildren = (stagger = 0.04): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger } },
});

/** Press feedback for anything tappable. */
export const pressable = {
  whileTap: { scale: 0.97 },
  transition: spring.snappy,
} as const;
