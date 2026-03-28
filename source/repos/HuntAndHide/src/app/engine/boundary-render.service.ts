import { inject, Injectable } from '@angular/core';
import * as THREE from 'three';
import { PlayerState, Vec3 } from '../models/player.model';
import { MapService } from '../services/map.service';

/**
 * BoundaryRenderService manages the semi-transparent boundary walls
 * around the jungle map, including proximity-based fade and pulse animation.
 */
@Injectable({ providedIn: 'root' })
export class BoundaryRenderService {
  private readonly mapService = inject(MapService);

  private boundaryGroup?: THREE.Group;
  private boundaryMaterial?: THREE.MeshBasicMaterial;
  private boundaryPulse = 0;
  private boundaryProximity = 0;

  private readonly baseOpacity = 0.12;
  private readonly amplitude = 0.08;
  private readonly proximityThreshold = 12;
  private readonly minOpacity = 0.02;

  init(scene: THREE.Scene): void {
    this.createBoundary(scene);
  }

  dispose(scene: THREE.Scene): void {
    if (!this.boundaryGroup) return;
    scene.remove(this.boundaryGroup);
    this.boundaryGroup.traverse((c: any) => {
      if (c.geometry) c.geometry.dispose();
      if (c.material) c.material.dispose();
    });
    this.boundaryGroup = undefined;
    this.boundaryMaterial = undefined;
  }

  tick(delta: number): void {
    if (!this.boundaryMaterial || !this.boundaryGroup) return;
    this.boundaryPulse += delta;
    const pulse = this.baseOpacity + Math.sin(this.boundaryPulse * 2) * this.amplitude;
    const opacity = this.minOpacity + (pulse - this.minOpacity) * this.boundaryProximity;
    this.boundaryMaterial.opacity = Math.max(0, Math.min(1, opacity));
  }

  updateProximity(localPos: Vec3 | null): void {
    if (!localPos) { this.boundaryProximity = 0; return; }
    const map = this.mapService.getMap('jungle');
    const distToEdgeX = map.width / 2 - Math.abs(localPos.x);
    const distToEdgeZ = map.depth / 2 - Math.abs(localPos.z);
    const nearest = Math.min(distToEdgeX, distToEdgeZ);
    const t = (this.proximityThreshold - nearest) / this.proximityThreshold;
    this.boundaryProximity = Math.max(0, Math.min(1, t));
  }

  private createBoundary(scene: THREE.Scene): void {
    const map = this.mapService.getMap('jungle');
    const halfW = map.width / 2;
    const halfD = map.depth / 2;
    const thickness = 1.2;
    const height = 3.0;
    const extra = 1.0;

    this.boundaryGroup = new THREE.Group();
    this.boundaryMaterial = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: this.baseOpacity,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    });

    const wallGeoH = new THREE.BoxGeometry(map.width + thickness * 2 + extra, height, thickness);
    const wallGeoV = new THREE.BoxGeometry(thickness, height, map.depth + thickness * 2 + extra);

    const north = new THREE.Mesh(wallGeoH, this.boundaryMaterial);
    north.position.set(0, height / 2, -halfD - thickness / 2 - extra / 2);
    this.boundaryGroup.add(north);

    const south = new THREE.Mesh(wallGeoH, this.boundaryMaterial);
    south.position.set(0, height / 2, halfD + thickness / 2 + extra / 2);
    this.boundaryGroup.add(south);

    const west = new THREE.Mesh(wallGeoV, this.boundaryMaterial);
    west.position.set(-halfW - thickness / 2 - extra / 2, height / 2, 0);
    this.boundaryGroup.add(west);

    const east = new THREE.Mesh(wallGeoV, this.boundaryMaterial);
    east.position.set(halfW + thickness / 2 + extra / 2, height / 2, 0);
    this.boundaryGroup.add(east);

    this.boundaryGroup.traverse((c: any) => { c.renderOrder = 999999; });
    scene.add(this.boundaryGroup);
  }
}
