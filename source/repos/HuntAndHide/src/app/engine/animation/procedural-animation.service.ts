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
 * Designed for a drop-in replacement with AnimationMixer (Option B) later —
 * the public API (`tick`) stays the same; internals swap to clip playback.
 */
@Injectable({ providedIn: 'root' })
export class ProceduralAnimationService {

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
   */
  tick(
    uid: string,
    group: THREE.Group,
    position: Vec3,
    prevPos: Vec3,
    delta: number,
    isAlive: boolean,
  ): void {
    const ctx = this.getContext(uid);

    // Derive speed from position delta
    const dx = position.x - prevPos.x;
    const dz = position.z - prevPos.z;
    ctx.speed = Math.sqrt(dx * dx + dz * dz) / Math.max(delta, 0.001);

    // State transitions
    const newState = this.resolveState(ctx, isAlive);
    if (newState !== ctx.state) {
      ctx.state = newState;
      ctx.elapsed = 0;
      ctx.phase = 0;
    }
    ctx.elapsed += delta;

    // Apply the animation for current state
    switch (ctx.state) {
      case 'idle':   this.applyIdle(group, ctx, delta);   break;
      case 'walk':   this.applyWalk(group, ctx, delta);   break;
      case 'run':    this.applyRun(group, ctx, delta);    break;
      case 'caught': this.applyCaught(group, ctx, delta); break;
      case 'death':  this.applyDeath(group, ctx, delta);  break;
      default:       this.applyIdle(group, ctx, delta);
    }
  }

  // ── State resolution ─────────────────────────────────────

  private resolveState(ctx: AnimationContext, isAlive: boolean): AnimationState {
    if (!isAlive) return 'death';
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

    // Breathing: gentle body scale pulse
    if (body) {
      body.scale.y = 1.15 + Math.sin(ctx.phase) * 0.02;
    }

    // Slight head bob
    if (head) {
      head.rotation.z = Math.sin(ctx.phase * 0.7) * 0.03;
    }

    // Tail wag (slow)
    if (tail) {
      tail.rotation.z = Math.sin(ctx.phase * 1.2) * 0.1;
    }

    // Reset legs to rest pose
    this.resetLegs(group);
    this.resetArms(group);
  }

  // ── Walk: bouncy step cycle ──────────────────────────────

  private applyWalk(group: THREE.Group, ctx: AnimationContext, delta: number): void {
    const cycleSpeed = 8;
    ctx.phase += delta * cycleSpeed;

    const sinPhase = Math.sin(ctx.phase);
    const cosPhase = Math.cos(ctx.phase);

    // Body bounce (up/down bob)
    const body = group.getObjectByName(PART_NAMES.body);
    if (body) {
      body.position.y = 0.65 + Math.abs(sinPhase) * 0.06;
      body.rotation.z = sinPhase * 0.03;
    }

    // Head bob (opposite phase for charming sway)
    const head = group.getObjectByName(PART_NAMES.head);
    if (head) {
      head.position.y += Math.abs(sinPhase) * 0.04;
      head.rotation.z = -sinPhase * 0.04;
    }

    // Leg cycle
    this.applyLegCycle(group, sinPhase, 0.3);

    // Arm swing
    this.applyArmSwing(group, cosPhase, 0.2);

    // Tail wag (synced with walk)
    const tail = group.getObjectByName(PART_NAMES.tail);
    if (tail) {
      tail.rotation.z = sinPhase * 0.15;
    }

    // Ear bounce
    this.applyEarBounce(group, sinPhase, 0.06);
  }

  // ── Run: faster, exaggerated walk ────────────────────────

  private applyRun(group: THREE.Group, ctx: AnimationContext, delta: number): void {
    const cycleSpeed = 14;
    ctx.phase += delta * cycleSpeed;

    const sinPhase = Math.sin(ctx.phase);
    const cosPhase = Math.cos(ctx.phase);

    const body = group.getObjectByName(PART_NAMES.body);
    if (body) {
      body.position.y = 0.65 + Math.abs(sinPhase) * 0.1;
      body.rotation.x = 0.12; // lean forward
      body.rotation.z = sinPhase * 0.05;
    }

    const head = group.getObjectByName(PART_NAMES.head);
    if (head) {
      head.position.y += Math.abs(sinPhase) * 0.06;
    }

    this.applyLegCycle(group, sinPhase, 0.5);
    this.applyArmSwing(group, cosPhase, 0.35);

    const tail = group.getObjectByName(PART_NAMES.tail);
    if (tail) {
      tail.rotation.z = sinPhase * 0.25;
      tail.rotation.x += cosPhase * 0.1;
    }

    this.applyEarBounce(group, sinPhase, 0.1);
  }

  // ── Caught: comedic spin + shrink ────────────────────────

  private applyCaught(group: THREE.Group, ctx: AnimationContext, _delta: number): void {
    const t = ctx.elapsed / 0.6; // normalised 0..1 over 0.6s
    group.rotation.y += 0.3;
    const scale = Math.max(0, 1 - t);
    group.scale.set(scale, scale, scale);
  }

  // ── Death: fall over sideways ────────────────────────────

  private applyDeath(group: THREE.Group, ctx: AnimationContext, _delta: number): void {
    const t = Math.min(ctx.elapsed / 0.5, 1);
    group.rotation.z = t * (Math.PI / 2);
    group.position.y = -t * 0.3;
  }

  // ── Shared part animators ────────────────────────────────

  private applyLegCycle(group: THREE.Group, sinPhase: number, amplitude: number): void {
    const lLeg = group.getObjectByName(PART_NAMES.leftLeg);
    const rLeg = group.getObjectByName(PART_NAMES.rightLeg);
    if (lLeg) lLeg.rotation.x = sinPhase * amplitude;
    if (rLeg) rLeg.rotation.x = -sinPhase * amplitude;

    const lFoot = group.getObjectByName(PART_NAMES.leftFoot);
    const rFoot = group.getObjectByName(PART_NAMES.rightFoot);
    if (lFoot) lFoot.position.z = 0.06 + sinPhase * amplitude * 0.3;
    if (rFoot) rFoot.position.z = 0.06 - sinPhase * amplitude * 0.3;
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
}
