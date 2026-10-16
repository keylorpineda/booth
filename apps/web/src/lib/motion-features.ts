import { domMax } from 'motion/react';

/**
 * Full Motion feature set (animations, gestures, drag, layout). Loaded lazily by <LazyMotion> in
 * app.tsx so it stays out of the critical first-load bundle.
 */
export default domMax;
