import { expect, it } from 'vitest';
import * as THREE from 'three';
import { createPlanetBatches } from '../src/galaxy/batches';

it('batches preserve world transforms, filtering and exact picking after culling changes', () => {
  const scene = new THREE.Scene(), geometry = new THREE.SphereGeometry(1, 8, 6), material = new THREE.MeshBasicMaterial();
  const group = new THREE.Group(), a = new THREE.Mesh(geometry, material), b = new THREE.Mesh(geometry, material);
  group.position.set(0, 0, -12); group.add(a); a.scale.setScalar(2);
  b.position.set(1000, 0, -12); scene.add(group, b);
  const batches = createPlanetBatches(scene, [a, b]);
  const camera = new THREE.PerspectiveCamera(55, 1, 1, 100);
  camera.updateMatrixWorld(); scene.updateMatrixWorld(true); batches.sync(camera);
  const batch = scene.children.find(object => object instanceof THREE.InstancedMesh) as THREE.InstancedMesh;
  expect(batch.count).toBe(1);
  const matrix = new THREE.Matrix4(); batch.getMatrixAt(0, matrix);
  expect(matrix.equals(a.matrixWorld)).toBe(true);
  const ray = new THREE.Raycaster(); ray.setFromCamera(new THREE.Vector2(0, 0), camera);
  expect(ray.intersectObject(a, false)[0]?.object).toBe(a);
  group.visible = false; batches.sync(camera);
  expect(batch.count).toBe(0);
  group.visible = true; b.position.x = 3; scene.updateMatrixWorld(true); batches.sync(camera);
  expect(batch.count).toBe(2);
  batches.dispose();
  expect(scene.children.includes(batch)).toBe(false);
  geometry.dispose(); material.dispose();
});
