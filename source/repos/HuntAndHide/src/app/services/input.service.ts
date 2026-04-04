import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Vec3 } from '../models/player.model';

type MovementAxis = 'x' | 'z';
type MovementBinding = {
  codes: readonly string[];
  axis: MovementAxis;
  delta: number;
};

const MOVE_BINDINGS: readonly MovementBinding[] = [
  { codes: ['KeyW', 'ArrowUp'], axis: 'z', delta: -1 },
  { codes: ['KeyS', 'ArrowDown'], axis: 'z', delta: 1 },
  { codes: ['KeyA', 'ArrowLeft'], axis: 'x', delta: -1 },
  { codes: ['KeyD', 'ArrowRight'], axis: 'x', delta: 1 },
];

/**
 * InputService captures keyboard state every frame and exposes
 * a normalized movement vector + sprint state. Runs outside Angular
 * zone so key events don't trigger change detection.
 */
@Injectable({ providedIn: 'root' })
export class InputService implements OnDestroy {

  // ── Readable state (polled each tick by GameLoopService) ──
  private readonly keysDown = new Set<string>();
  private _interactPressed = false;
  private _dashPressed = false;
  private _pouncePressed = false;

  private boundKeyDown = this.onKeyDown.bind(this);
  private boundKeyUp = this.onKeyUp.bind(this);
  private attached = false;

  constructor(private ngZone: NgZone) {}

  // ── Lifecycle ──────────────────────────────────────────────

  /** Call once when the game canvas is ready. */
  attach(): void {
    if (this.attached) return;
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('keydown', this.boundKeyDown);
      window.addEventListener('keyup', this.boundKeyUp);
    });
    this.attached = true;
  }

  detach(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    this.keysDown.clear();
    this.attached = false;
  }

  ngOnDestroy(): void {
    this.detach();
  }

  // ── Polling API (call once per tick) ───────────────────────

  /** Returns a unit-length (or zero) movement vector in the XZ plane. */
  getMovementVector(): Vec3 {
    return this.normalizeVector(this.readMovementVector());
  }

  isMoving(): boolean {
    return this.keysDown.has('KeyW') || this.keysDown.has('KeyS')
        || this.keysDown.has('KeyA') || this.keysDown.has('KeyD')
        || this.keysDown.has('ArrowUp') || this.keysDown.has('ArrowDown')
        || this.keysDown.has('ArrowLeft') || this.keysDown.has('ArrowRight');
  }

  /** True while the player holds Shift (sprint). */
  isSprinting(): boolean {
    return this.keysDown.has('ShiftLeft') || this.keysDown.has('ShiftRight');
  }

  /** Consume a one-shot F-key press (returns true once per press). */
  consumeInteract(): boolean {
    if (!this._interactPressed) return false;
    this._interactPressed = false;
    return true;
  }

  /** Consume a one-shot Space press for hider dash (returns true once per press). */
  consumeDash(): boolean {
    if (!this._dashPressed) return false;
    this._dashPressed = false;
    return true;
  }

  /** Consume a one-shot Q press for hunter pounce (returns true once per press). */
  consumePounce(): boolean {
    if (!this._pouncePressed) return false;
    this._pouncePressed = false;
    return true;
  }

  // ── Event handlers ─────────────────────────────────────────

  private onKeyDown(e: KeyboardEvent): void {
    this.keysDown.add(e.code);
    this._interactPressed ||= e.code === 'KeyF';
    this._dashPressed ||= e.code === 'Space';
    this._pouncePressed ||= e.code === 'KeyQ';
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
  }

  private readMovementVector(): Vec3 {
    return MOVE_BINDINGS.reduce(
      (vector: Vec3, binding: MovementBinding) => this.applyMovementBinding(vector, binding),
      { x: 0, y: 0, z: 0 },
    );
  }

  private applyMovementBinding(
    vector: Vec3,
    binding: MovementBinding,
  ): Vec3 {
    const active = binding.codes.some((code: string) => this.keysDown.has(code));
    return active ? this.offsetVector(vector, binding.axis, binding.delta) : vector;
  }

  private offsetVector(vector: Vec3, axis: MovementAxis, delta: number): Vec3 {
    return { ...vector, [axis]: vector[axis] + delta };
  }

  private normalizeVector(vector: Vec3): Vec3 {
    const length = Math.sqrt(vector.x * vector.x + vector.z * vector.z);
    if (!length) return vector;
    return { x: vector.x / length, y: 0, z: vector.z / length };
  }
}
