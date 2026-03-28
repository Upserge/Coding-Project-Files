import * as THREE from 'three';
import { createBodyMatcap, createSurfaceMatcap } from './character-material.factory';
import { buildFox } from './hider-fox.builder';
import { buildRabbit } from './hider-rabbit.builder';
import { buildDeer } from './hider-deer.builder';
import { buildFrog } from './hider-frog.builder';
import { buildOwl } from './hider-owl.builder';
import { buildSnake } from './hider-snake.builder';
import { buildPig } from './hider-pig.builder';
import { buildChameleon } from './hider-chameleon.builder';

/**
 * Dispatches to the per-animal hider builder.
 * Each hider has a unique silhouette.
 * Uses skeletal hierarchy: root -> bodyPivot -> headPivot / tailPivot; legs at root.
 */
export function buildHiderMesh(
  group: THREE.Group,
  color: number,
  belly: number,
  animal: string,
): void {
  const mat = createBodyMatcap(color);
  const bellyMat = createSurfaceMatcap(belly);
  const buildAnimal = HIDER_BUILDERS[animal] ?? buildChameleon;
  buildAnimal(group, mat, bellyMat, color);
}

const HIDER_BUILDERS: Record<string, typeof buildFox> = {
  fox: buildFox,
  rabbit: buildRabbit,
  deer: buildDeer,
  frog: buildFrog,
  owl: buildOwl,
  snake: buildSnake,
  pig: buildPig,
  chameleon: buildChameleon,
};
