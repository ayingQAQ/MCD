import * as THREE from 'three';

/** Proxy meshes retain exact picking/transforms; only shared instance batches are drawn. */
export function createPlanetBatches(scene: THREE.Scene, sources: THREE.Mesh[]) {
  const groups = new Map<string, THREE.Mesh[]>();
  for (const mesh of sources) {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    const key = `${mesh.geometry.uuid}:${materials.map(material => material.uuid).join(':')}`;
    const group = groups.get(key) ?? []; group.push(mesh); groups.set(key, group);
    mesh.visible = false;
  }
  const batches = [...groups.values()].map(members => {
    const first = members[0], mesh = new THREE.InstancedMesh(first.geometry, first.material, members.length);
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    // Individual instances are culled below, so a stale aggregate bound cannot hide a planet.
    mesh.frustumCulled = false; scene.add(mesh);
    return { mesh, members };
  });
  const frustum = new THREE.Frustum(), projection = new THREE.Matrix4();
  return {
    sync(camera: THREE.Camera) {
      frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
      for (const { mesh, members } of batches) {
        let count = 0, changed = false;
        const target = mesh.instanceMatrix.array;
        for (const source of members) {
          if (!source.parent?.visible || !frustum.intersectsObject(source)) continue;
          const matrix = source.matrixWorld.elements, offset = count * 16;
          for (let i = 0; i < 16; i++) {
            const value = Math.fround(matrix[i]);
            if (target[offset + i] !== value) { target[offset + i] = value; changed = true; }
          }
          count++;
        }
        mesh.count = count; mesh.visible = count > 0;
        if (changed) mesh.instanceMatrix.needsUpdate = true;
      }
    },
    dispose() { for (const { mesh } of batches) { scene.remove(mesh); mesh.dispose(); } },
  };
}
