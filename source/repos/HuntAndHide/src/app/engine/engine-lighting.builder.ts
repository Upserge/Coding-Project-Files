import * as THREE from 'three';
import { buildEnvironmentMap } from './mesh/environment-light.builder';
import { TimeOfDayService } from './animation/time-of-day.service';

export interface EngineLighting {
  sunLight: THREE.DirectionalLight;
  ambientLight: THREE.AmbientLight;
}

export function buildEngineLighting(
  scene: THREE.Scene,
  timeOfDay: TimeOfDayService,
): EngineLighting {
  const ambientLight = buildAmbient();
  scene.add(ambientLight);

  const sunLight = buildSun();
  scene.add(sunLight);
  scene.add(sunLight.target);
  scene.add(buildFill());

  applyEnvironmentMap(scene);
  timeOfDay.init(scene, sunLight, ambientLight);

  return { sunLight, ambientLight };
}

export function buildAmbient(): THREE.AmbientLight {
  return new THREE.AmbientLight(0xe8edd8, 0.4);
}

export function buildSun(): THREE.DirectionalLight {
  const sun = new THREE.DirectionalLight(0xfff4d6, 0.72);
  sun.position.set(60, 100, 40);
  sun.castShadow = true;
  configureSunShadow(sun);
  return sun;
}

function configureSunShadow(sun: THREE.DirectionalLight): void {
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 400;
  sun.shadow.camera.left = -120;
  sun.shadow.camera.right = 120;
  sun.shadow.camera.top = 120;
  sun.shadow.camera.bottom = -120;
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.radius = 3;
}

function buildFill(): THREE.DirectionalLight {
  const fill = new THREE.DirectionalLight(0xc7ddd6, 0.34);
  fill.position.set(-15, 20, -10);
  return fill;
}

function applyEnvironmentMap(scene: THREE.Scene): void {
  scene.environment = buildEnvironmentMap();
  scene.environmentIntensity = 0.34;
}
