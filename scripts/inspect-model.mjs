import { readFile } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

globalThis.ProgressEvent ??= class ProgressEvent {};
const file = process.argv[2];
if (!file) throw new Error("Pass a GLB path to inspect.");
const data = await readFile(file);
const gltf = await new GLTFLoader().parseAsync(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength), "");
gltf.scene.updateWorldMatrix(true, true);
const bounds = new THREE.Box3().setFromObject(gltf.scene);
const meshes = gltf.scene.getObjectsByProperty("isMesh", true);
const markers = meshes
  .filter((mesh) => /enterwalk/i.test(mesh.name))
  .map((mesh) => {
    const markerBounds = new THREE.Box3().setFromObject(mesh);
    return {
      name: mesh.name,
      position: mesh.getWorldPosition(new THREE.Vector3()).toArray(),
      center: markerBounds.getCenter(new THREE.Vector3()).toArray(),
      size: markerBounds.getSize(new THREE.Vector3()).toArray(),
    };
  });
console.log(
  JSON.stringify(
    {
      meshes: meshes.length,
      names: meshes.map((mesh) => mesh.name),
      markers,
      min: bounds.min.toArray(),
      max: bounds.max.toArray(),
      size: bounds.getSize(new THREE.Vector3()).toArray(),
    },
    null,
    2,
  ),
);
