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

// Spread onto every motion element that animates opacity. Motion hands opacity
// to the browser's animation engine (WAAPI); when one finishes it cancels it
// and only writes the final value on its next frame, and Safari paints the
// frame in between with the start value. That flashed whole overlays in and
// out on open/close. Any onUpdate makes motion animate the value itself.
export const jsAnimated = { onUpdate: () => {} };
