import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { PART_NAMES } from '../mesh/mesh-helpers';
import {
  AnimationContext,
  AnimationState,
  createAnimationContext,
  ANIM_WALK_THRESHOLD,
  ANIM_RUN_THRESHOLD,
} from '../../models/animation.model';
import { Vec3 } from '../../models/player.model';

/**
 * Procedural animation service — drives chibi character motion
 * by transforming named mesh children each frame.
 *
 * Architecture note: this service owns *only* the maths of procedural motion.
 * It reads/writes AnimationContext but never touches the scene graph registry.
 * Designed for a drop-in replacement with AnimationMixer later —
 * the public API (`tick`) stays the same; internals swap to clip playback.
 */
@Injectable({ providedIn: 'root' })
export class ProceduralAnimationService {
  private readonly animationAppliers: Record<AnimationState, AnimationApplier> = {
    idle: (group, ctx, delta) => this.applyIdle(group, ctx, delta),
    walk: (group, ctx, delta) => this.applyWalk(group, ctx, delta),
    run: (group, ctx, delta) => this.applyRun(group, ctx, delta),
    dash: (group, ctx, delta) => this.applyDash(group, ctx, delta),
    pounce: (group, ctx, delta) => this.applyPounce(group, ctx, delta),
    exhausted: (group, ctx, delta) => this.applyExhausted(group, ctx, delta),
    caught: (group, ctx, delta) => this.applyCaught(group, ctx, delta),
    death: (group, ctx, delta) => this.applyDeath(group, ctx, delta),
  };

  private contexts = new Map<string, AnimationContext>();

  /** Get or create the animation context for an entity. */
  getContext(uid: string): AnimationContext {
    let ctx = this.contexts.get(uid);
    if (!ctx) {
      ctx = createAnimationContext();
      this.contexts.set(uid, ctx);
    }
    return ctx;
  }

  /** Remove context when entity is removed from the scene. */
  removeContext(uid: string): void {
    this.contexts.delete(uid);
  }

  /** Clear all contexts (game reset / dispose). */
  dispose(): void {
    this.contexts.clear();
  }

  /**
   * Drive one frame of procedural animation.
   * @param uid       Entity id
   * @param group     The THREE.Group containing named body parts
   * @param position  Current world position
   * @param prevPos   Previous world position (for velocity derivation)
   * @param delta     Seconds since last frame
   * @param isAlive   Whether the entity is alive
   * @param isCaught  Whether the entity was just caught (plays catch anim instead of death)
   */
  tick(
    uid: string,
    group: THREE.Group,
    position: Vec3,
    prevPos: Vec3,
    delta: number,
    isAlive: boolean,
    isCaught = false,
    isExhausted = false,
    isDashing = false,
    isPouncing = false,
  ): void {
    const ctx = this.getContext(uid);
    this.prepareFrame(ctx, position, prevPos, delta);
    const newState = this.resolveState(ctx, isAlive, isCaught, isExhausted, isDashing, isPouncing);
    this.transitionState(group, ctx, newState);
    ctx.elapsed += delta;
    this.applyState(group, ctx, delta);
  }

  // ── State resolution ─────────────────────────────────────

  private resolveState(
    ctx: AnimationContext, isAlive: boolean, isCaught: boolean,
    isExhausted: boolean, isDashing: boolean, isPouncing: boolean,
  ): AnimationState {
    if (isCaught) return 'caught';
    if (!isAlive) return 'death';
    if (isDashing) return 'dash';
    if (isPouncing) return 'pounce';
    if (isExhausted) return 'exhausted';
    if (ctx.state === 'caught' && ctx.elapsed < 0.6) return 'caught';
    if (ctx.speed >= ANIM_RUN_THRESHOLD) return 'run';
    if (ctx.speed >= ANIM_WALK_THRESHOLD) return 'walk';
    return 'idle';
  }

  // ── Idle: gentle breathing + ear/tail twitch ─────────────

  private applyIdle(group: THREE.Group, ctx: AnimationContext, delta: number): void {
    ctx.phase += delta * 2.5;

    const body = group.getObjectByName(PART_NAMES.body);
    const head = group.getObjectByName(PART_NAMES.head);
    const tail = group.getObjectByName(PART_NAMES.tail);

    // Breathing: squash-and-stretch pulse
    if (body) {
      const baseY = (body.userData['baseY'] as number) ?? 0.65;
      body.position.y = baseY;
      body.rotation.x = 0;
      body.rotation.z = 0;
      const breath = Math.sin(ctx.phase) * 0.03;
      body.scale.set(1 - breath, 1 + breath, 1 - breath);
    }

    // Slight head tilt
    if (head) {
      head.rotation.z = Math.sin(ctx.phase * 0.7) * 0.03;
    }

    // Tail wag (slow)
    if (tail) {
      const baseRotX = (tail.userData['baseRotX'] as number) ?? 0;
      tail.rotation.x = baseRotX;
      tail.rotation.z = Math.sin(ctx.phase * 1.2) * 0.1;
    }

    // Randomized ear flick
    this.applyIdleEarFlick(group, ctx);
    this.resetLegs(group);
    this.resetArms(group);
  }

  // ── Walk: bouncy step cycle ──────────────────────────────

  private applyWalk(group: THREE.Group, ctx: AnimationContext, delta: number): void {
    const { sinPhase, cosPhase } = this.advanceLocomotionPhase(ctx, delta, 8);

    const body = group.getObjectByName(PART_NAMES.body);
    if (body) {
      const baseY = (body.userData['baseY'] as number) ?? 0.65;
      body.position.y = baseY + Math.abs(sinPhase) * 0.06;
      body.rotation.x = 0;
      body.rotation.z = sinPhase * 0.03;
      body.scale.set(1, 1, 1);
    }

    // Head sway (no position change — follows body via hierarchy)
    const head = group.getObjectByName(PART_NAMES.head);
    if (head) {
      head.rotation.z = -sinPhase * 0.04;
    }

    // Leg cycle
    this.applyLegCycle(group, sinPhase, 0.3);

    // Arm swing
    this.applyArmSwing(group, cosPhase, 0.2);

    // Tail wag (synced with walk, absolute rotation)
    const tail = group.getObjectByName(PART_NAMES.tail);
    if (tail) {
      const baseRotX = (tail.userData['baseRotX'] as number) ?? 0;
      tail.rotation.x = baseRotX;
      tail.rotation.z = sinPhase * 0.15;
    }

    // Ear bounce
    this.applyEarBounce(group, sinPhase, 0.06);
  }

  // ── Run: faster, exaggerated walk ────────────────────────

  private applyRun(group: THREE.Group, ctx: AnimationContext, delta: number): void {
    const { sinPhase, cosPhase } = this.advanceLocomotionPhase(ctx, delta, 14);

    const body = group.getObjectByName(PART_NAMES.body);
    if (body) {
      const baseY = (body.userData['baseY'] as number) ?? 0.65;
      body.position.y = baseY + Math.abs(sinPhase) * 0.1;
      body.rotation.x = 0.12;
      body.rotation.z = sinPhase * 0.05;
      body.scale.set(1, 1, 1);
    }

    // Head follows body via hierarchy — no position changes needed

    this.applyLegCycle(group, sinPhase, 0.5);
    this.applyArmSwing(group, cosPhase, 0.35);

    // Absolute tail rotation from rest pose
    const tail = group.getObjectByName(PART_NAMES.tail);
    if (tail) {
      const baseRotX = (tail.userData['baseRotX'] as number) ?? 0;
      tail.rotation.x = baseRotX + cosPhase * 0.1;
      tail.rotation.z = sinPhase * 0.25;
    }

    this.applyEarBounce(group, sinPhase, 0.1);
  }

  private applyExhausted(group: THREE.Group, ctx: AnimationContext, delta: number): void {
    ctx.phase += delta * 12;
    const body = group.getObjectByName(PART_NAMES.body);
    const head = group.getObjectByName(PART_NAMES.head);
    const tail = group.getObjectByName(PART_NAMES.tail);
    const pulse = Math.sin(ctx.phase) * 0.05;
    if (body) {
      const baseY = (body.userData['baseY'] as number) ?? 0.65;
      body.position.y = baseY - 0.03 + Math.abs(pulse) * 0.03;
      body.rotation.x = 0.18;
      body.rotation.z = pulse;
      body.scale.set(1.04, 0.94, 1.04);
    }
    if (head) head.rotation.x = -0.16 + Math.abs(pulse) * 0.08;
    if (tail) tail.rotation.z = pulse * 0.4;
    this.applyLegCycle(group, Math.sin(ctx.phase), 0.12);
    this.applyArmSwing(group, Math.cos(ctx.phase), 0.18);
  }

  // ── Dash: quick forward roll — low + fast + spin ─────────

  private applyDash(group: THREE.Group, ctx: AnimationContext, _delta: number): void {
    const t = Math.min(ctx.elapsed / 0.25, 1);
    const body = group.getObjectByName(PART_NAMES.body);
    if (body) {
      const baseY = (body.userData['baseY'] as number) ?? 0.65;
      const arc = Math.sin(t * Math.PI) * 0.15;
      body.position.y = baseY - 0.1 + arc;
      body.rotation.x = t * Math.PI * 2;
      body.scale.set(1 + (1 - t) * 0.1, 1 - (1 - t) * 0.15, 1 + (1 - t) * 0.1);
    }
    this.applyLegCycle(group, Math.sin(ctx.elapsed * 20), 0.6);
    this.applyArmSwing(group, Math.cos(ctx.elapsed * 20), 0.5);
  }

  // ── Pounce: forward lunge — body dips then launches ─────

  private applyPounce(group: THREE.Group, ctx: AnimationContext, _delta: number): void {
    const t = Math.min(ctx.elapsed / 0.3, 1);
    const body = group.getObjectByName(PART_NAMES.body);
    if (body) {
      const baseY = (body.userData['baseY'] as number) ?? 0.65;
      const windUp = t < 0.2 ? t / 0.2 : 1;
      const launch = t >= 0.2 ? (t - 0.2) / 0.8 : 0;
      body.position.y = baseY - windUp * 0.12 + launch * 0.2;
      body.rotation.x = 0.3 - launch * 0.15;
      body.scale.set(1 - windUp * 0.08 + launch * 0.08, 1 + windUp * 0.1 - launch * 0.1, 1);
    }
    const head = group.getObjectByName(PART_NAMES.head);
    if (head) head.rotation.x = t < 0.2 ? -0.15 : 0.1;
    this.applyLegCycle(group, Math.sin(ctx.elapsed * 16), 0.45);
    this.applyArmSwing(group, Math.cos(ctx.elapsed * 16), 0.4);
  }

  // ── Caught: pop-up bounce → comedic spin + shrink ─────────

  private applyCaught(group: THREE.Group, ctx: AnimationContext, _delta: number): void {
    const totalDuration = 0.6;
    const bounceDuration = 0.40; // initial pop-up phase
    const t = ctx.elapsed / totalDuration; // normalised 0..1 over 0.6s

    if (ctx.elapsed < bounceDuration) {
      // Phase 1: quick upward pop + squash-stretch
      const bt = ctx.elapsed / bounceDuration; // 0..1 within bounce
      const bounce = Math.sin(bt * Math.PI); // peaks at 0.5
      const body = group.getObjectByName(PART_NAMES.body);
      if (body) {
        const baseY = (body.userData['baseY'] as number) ?? 0.65;
        body.position.y = baseY + bounce * 0.5;
        // Squash horizontally, stretch vertically at peak
        body.scale.set(1 - bounce * 0.2, 1 + bounce * 0.3, 1 - bounce * 0.2);
      }
    } else {
      // Phase 2: spin + shrink (original behaviour)
      group.rotation.y += 0.3;
      const shrinkT = (ctx.elapsed - bounceDuration) / (totalDuration - bounceDuration);
      const scale = Math.max(0, 1 - shrinkT);
      group.scale.set(scale, scale, scale);
    }
  }

  // ── Death: fall over sideways ────────────────────────────

  private applyDeath(group: THREE.Group, ctx: AnimationContext, _delta: number): void {
    const t = Math.min(ctx.elapsed / 0.5, 1);
    group.rotation.z = t * (Math.PI / 2);
    // Sink via body pivot to avoid overriding world position
    const body = group.getObjectByName(PART_NAMES.body);
    if (body) {
      const baseY = (body.userData['baseY'] as number) ?? 0.65;
      body.position.y = baseY - t * 0.3;
    }
  }

  // ── Shared part animators ────────────────────────────────

  private applyLegCycle(group: THREE.Group, sinPhase: number, amplitude: number): void {
    const lLeg = group.getObjectByName(PART_NAMES.leftLeg);
    const rLeg = group.getObjectByName(PART_NAMES.rightLeg);
    if (lLeg) lLeg.rotation.x = sinPhase * amplitude;
    if (rLeg) rLeg.rotation.x = -sinPhase * amplitude;
    // Feet are children of leg pivots — they follow automatically
  }

  private applyArmSwing(group: THREE.Group, cosPhase: number, amplitude: number): void {
    const lArm = group.getObjectByName(PART_NAMES.leftArm);
    const rArm = group.getObjectByName(PART_NAMES.rightArm);
    if (lArm) lArm.rotation.x = cosPhase * amplitude;
    if (rArm) rArm.rotation.x = -cosPhase * amplitude;
  }

  private applyEarBounce(group: THREE.Group, sinPhase: number, amplitude: number): void {
    const lEar = group.getObjectByName(PART_NAMES.leftEar);
    const rEar = group.getObjectByName(PART_NAMES.rightEar);
    if (lEar) lEar.rotation.x = sinPhase * amplitude;
    if (rEar) rEar.rotation.x = -sinPhase * amplitude;

    // Wings (owl) — gentle flap
    const lWing = group.getObjectByName(PART_NAMES.leftWing);
    const rWing = group.getObjectByName(PART_NAMES.rightWing);
    if (lWing) lWing.rotation.z = -Math.abs(sinPhase) * amplitude * 2;
    if (rWing) rWing.rotation.z = Math.abs(sinPhase) * amplitude * 2;
  }

  private resetLegs(group: THREE.Group): void {
    const lLeg = group.getObjectByName(PART_NAMES.leftLeg);
    const rLeg = group.getObjectByName(PART_NAMES.rightLeg);
    if (lLeg) lLeg.rotation.x = 0;
    if (rLeg) rLeg.rotation.x = 0;
  }

  private resetArms(group: THREE.Group): void {
    const lArm = group.getObjectByName(PART_NAMES.leftArm);
    const rArm = group.getObjectByName(PART_NAMES.rightArm);
    if (lArm) lArm.rotation.x = 0;
    if (rArm) rArm.rotation.x = 0;
  }

  private applyIdleEarFlick(group: THREE.Group, ctx: AnimationContext): void {
    const lEar = group.getObjectByName(PART_NAMES.leftEar);
    const rEar = group.getObjectByName(PART_NAMES.rightEar);
    const flick = Math.sin(ctx.phase * 3.7) > 0.92 ? 0.15 : 0;
    if (lEar) lEar.rotation.x = flick;
    if (rEar) rEar.rotation.x = -flick;
  }

  private prepareFrame(ctx: AnimationContext, position: Vec3, prevPos: Vec3, delta: number): void {
    ctx.footstepTriggered = false;
    ctx.speed = this.calculateSpeed(position, prevPos, delta);
  }

  private calculateSpeed(position: Vec3, prevPos: Vec3, delta: number): number {
    const dx = position.x - prevPos.x;
    const dz = position.z - prevPos.z;
    return Math.sqrt(dx * dx + dz * dz) / Math.max(delta, 0.001);
  }

  private transitionState(group: THREE.Group, ctx: AnimationContext, newState: AnimationState): void {
    if (newState === ctx.state) return;
    this.resetTerminalTransforms(group, ctx.state);
    ctx.state = newState;
    ctx.elapsed = 0;
    ctx.phase = 0;
  }

  private resetTerminalTransforms(group: THREE.Group, state: AnimationState): void {
    this.resetCaughtTransform(group, state);
    this.resetDeathTransform(group, state);
    this.resetDashTransform(group, state);
  }

  private resetCaughtTransform(group: THREE.Group, state: AnimationState): void {
    if (state !== 'caught') return;
    group.scale.set(1, 1, 1);
  }

  private resetDeathTransform(group: THREE.Group, state: AnimationState): void {
    if (state !== 'death') return;
    group.rotation.z = 0;
  }

  private resetDashTransform(group: THREE.Group, state: AnimationState): void {
    if (state !== 'dash') return;
    const body = group.getObjectByName(PART_NAMES.body);
    if (body) {
      body.rotation.x = 0;
      body.scale.set(1, 1, 1);
    }
  }

  private applyState(group: THREE.Group, ctx: AnimationContext, delta: number): void {
    this.animationAppliers[ctx.state](group, ctx, delta);
  }

  private advanceLocomotionPhase(
    ctx: AnimationContext,
    delta: number,
    cycleSpeed: number,
  ): { sinPhase: number; cosPhase: number } {
    ctx.prevPhase = ctx.phase;
    ctx.phase += delta * cycleSpeed;
    this.triggerFootstepIfNeeded(ctx);
    return { sinPhase: Math.sin(ctx.phase), cosPhase: Math.cos(ctx.phase) };
  }

  private triggerFootstepIfNeeded(ctx: AnimationContext): void {
    if (Math.sin(ctx.prevPhase) * Math.sin(ctx.phase) >= 0) return;
    ctx.footstepTriggered = true;
  }
}

type AnimationApplier = (
  group: THREE.Group,
  ctx: AnimationContext,
  delta: number,
) => void;
