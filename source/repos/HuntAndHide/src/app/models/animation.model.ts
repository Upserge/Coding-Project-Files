/**
 * Animation state machine for procedural character animations.
 *
 * This model is designed to be compatible with a future AnimationMixer upgrade (Option B).
 * Each AnimationState maps 1:1 to a potential AnimationClip name,
 * so migrating from procedural → keyframe clips only requires
 * swapping the tick implementation in the animation service.
 */

/** Discrete animation states — each drives a different procedural motion. */
export type AnimationState = 'idle' | 'walk' | 'run' | 'dash' | 'pounce' | 'caught' | 'death' | 'exhausted';

/**
 * Per-entity animation context tracked by the animation system.
 * Stored externally (Map keyed by entity uid) so the service stays stateless per-frame.
 */
export interface AnimationContext {
  /** Current animation playing. */
  state: AnimationState;
  /** Accumulated phase (radians) — drives periodic motions like walk cycle. */
  phase: number;
  /** Seconds the current state has been active — used for one-shot animations. */
  elapsed: number;
  /** Speed magnitude from last frame — determines walk vs run threshold. */
  speed: number;
  /** True for one frame when a foot strikes the ground (sin(phase) zero-crossing). */
  footstepTriggered: boolean;
  /** Previous phase value — used internally to detect zero-crossings. */
  prevPhase: number;
}

/** Default idle context for newly spawned entities. */
export function createAnimationContext(): AnimationContext {
  return { state: 'idle', phase: 0, elapsed: 0, speed: 0, footstepTriggered: false, prevPhase: 0 };
}

/** Speed thresholds for state transitions. */
export const ANIM_WALK_THRESHOLD = 0.1;
export const ANIM_RUN_THRESHOLD  = 6.0;
