export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: EASE_OUT },
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.22, ease: EASE_OUT },
  },
};

export const SECTION_REVEAL = {
  initial: { opacity: 0, y: 24 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.54, ease: EASE_OUT },
  },
  viewport: { once: true, amount: 0.14 } as const,
};

export const STAGGER_CONTAINER = {
  initial: {},
  whileInView: {
    transition: {
      staggerChildren: 0.075,
    },
  },
  viewport: { once: true, amount: 0.12 } as const,
};

export const STAGGER_ITEM = {
  initial: { opacity: 0, y: 20 },
  whileInView: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: EASE_OUT },
  },
};

export const IMAGE_CLIP_REVEAL = {
  initial: { opacity: 0, clipPath: 'inset(6% 0% 6% 0%)' },
  whileInView: {
    opacity: 1,
    clipPath: 'inset(0% 0% 0% 0%)',
    transition: { duration: 0.62, ease: EASE_OUT },
  },
  viewport: { once: true, amount: 0.15 } as const,
};
