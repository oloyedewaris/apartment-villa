import { readFile } from "node:fs/promises";

const file = process.argv[2];
if (!file) throw new Error("Pass a GLB path to inspect.");

const data = await readFile(file);
if (data.toString("utf8", 0, 4) !== "glTF") throw new Error("The input is not a binary glTF file.");

const chunkLength = data.readUInt32LE(12);
const chunkType = data.toString("utf8", 16, 20);
if (chunkType !== "JSON") throw new Error("The first GLB chunk is not JSON.");

const gltf = JSON.parse(data.toString("utf8", 20, 20 + chunkLength));
console.log(
  JSON.stringify(
    {
      asset: gltf.asset,
      extensionsUsed: gltf.extensionsUsed,
      scenes: gltf.scenes,
      nodes: gltf.nodes?.map((node, index) => ({ index, name: node.name, mesh: node.mesh, children: node.children })),
      meshes: gltf.meshes?.map((mesh, index) => ({ index, name: mesh.name, primitives: mesh.primitives?.length })),
      materials: gltf.materials?.map((material, index) => ({ index, name: material.name })),
      images: gltf.images,
      textures: gltf.textures,
    },
    null,
    2,
  ),
);
