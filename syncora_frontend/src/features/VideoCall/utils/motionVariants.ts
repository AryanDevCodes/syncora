import { Variants } from 'framer-motion';

export const tileVariants: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.96, y: -8, transition: { duration: 0.28 } },
};

export const controlsVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

export const pulseVariants: Variants = {
  idle: { scale: 1 },
  pulse: { scale: 1.08, transition: { repeat: Infinity, repeatType: 'reverse', duration: 0.9 } },
};
