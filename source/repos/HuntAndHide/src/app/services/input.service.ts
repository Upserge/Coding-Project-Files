import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Vec3 } from '../models/player.model';

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
    let x = 0;
    let z = 0;

    if (this.keysDown.has('KeyW') || this.keysDown.has('ArrowUp'))    z -= 1;
    if (this.keysDown.has('KeyS') || this.keysDown.has('ArrowDown'))  z += 1;
    if (this.keysDown.has('KeyA') || this.keysDown.has('ArrowLeft'))  x -= 1;
    if (this.keysDown.has('KeyD') || this.keysDown.has('ArrowRight')) x += 1;

    // Normalize so diagonals aren't faster
    const length = Math.sqrt(x * x + z * z);
    if (length > 0) {
      x /= length;
      z /= length;
    }

    return { x, y: 0, z };
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
    if (this._interactPressed) {
      this._interactPressed = false;
      return true;
    }
    return false;
  }

  // ── Event handlers ─────────────────────────────────────────

  private onKeyDown(e: KeyboardEvent): void {
    this.keysDown.add(e.code);
    if (e.code === 'KeyF') this._interactPressed = true;
  }

  private onKeyUp(e: KeyboardEvent): void {
    this.keysDown.delete(e.code);
  }
}
