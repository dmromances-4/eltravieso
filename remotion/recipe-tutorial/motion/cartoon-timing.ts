import { interpolate, spring, type SpringConfig } from "remotion";

export type CartoonMotionInput = {
  anticipationFrames?: number;
  actionFrames?: number;
  holdFrames?: number;
  squash?: number;
};

export const SNAPPY_SPRING: SpringConfig = {
  damping: 12,
  mass: 0.7,
  overshootClamping: false,
  stiffness: 200,
};

export function snappyEntrance(frame: number, fps: number): number {
  return spring({ frame, fps, config: SNAPPY_SPRING });
}

export function anticipationSquash(
  frame: number,
  motion: CartoonMotionInput,
): { scaleX: number; scaleY: number } {
  const anticipation = motion.anticipationFrames ?? 10;
  const squash = motion.squash ?? 1;
  if (frame < anticipation) {
    const t = interpolate(frame, [0, anticipation], [0, 1], { extrapolateRight: "clamp" });
    return { scaleX: 1 + t * 0.06, scaleY: 1 - t * (1 - squash) };
  }
  const release = interpolate(frame, [anticipation, anticipation + 4], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return {
    scaleX: 1 + (1 - release) * 0.06,
    scaleY: squash + (1 - squash) * release,
  };
}

export function actionThenHold(
  frame: number,
  motion: CartoonMotionInput,
  activeValue: number,
  restValue = 1,
): number {
  const anticipation = motion.anticipationFrames ?? 10;
  const action = motion.actionFrames ?? 14;
  const hold = motion.holdFrames ?? 8;
  const actionStart = anticipation;
  const actionEnd = actionStart + action;
  const holdEnd = actionEnd + hold;

  if (frame < actionStart) return restValue;
  if (frame < actionEnd) {
    return interpolate(frame, [actionStart, actionEnd], [restValue, activeValue], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  if (frame < holdEnd) return activeValue;
  return restValue;
}

export function followThroughOffset(frame: number, peakFrame: number, amplitude = 12): number {
  if (frame <= peakFrame) return 0;
  return interpolate(frame, [peakFrame, peakFrame + 6], [amplitude, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}
