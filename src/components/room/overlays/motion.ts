// One easing family for every overlay: quick out, long soft settle. Tweens on
// transform/opacity only; springs on many elements at once read as chunky.
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN = [0.55, 0, 1, 0.45] as const;

export const enter = (delay = 0, duration = 0.55) => ({
  duration,
  delay,
  ease: EASE_OUT,
});

export const leave = (delay = 0) => ({ duration: 0.22, delay, ease: EASE_IN });
