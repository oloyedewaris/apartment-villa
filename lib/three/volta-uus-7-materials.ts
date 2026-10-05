import * as THREE from "three";

const textureNames = [
  "basic",
  "bush",
  "bush_03",
  "bush_alpha",
  "concrete",
  "env",
  "facade",
  "floor",
  "furniture",
  "general",
  "landscape",
  "main",
  "planters",
  "rooftop",
  "stone",
  "tree09",
  "tree09a",
  "wood",
] as const;

const materialTexture: Record<string, (typeof textureNames)[number]> = {
  MAIN: "main",
  ROOFTOP: "rooftop",
  GENERAL: "general",
  PLANTERS: "planters",
  FURNITURE: "furniture",
  WOOD: "wood",
  FACADE: "facade",
  STONE: "stone",
  CONCRETE: "concrete",
  FLOOR: "floor",
  LANDSCAPE: "landscape",
};

export async function loadVoltaUus7Materials(renderer: THREE.WebGLRenderer) {
  const loader = new THREE.TextureLoader();
  const textures = new Map<string, THREE.Texture>();

  await Promise.all(
    textureNames.map(async (name) => {
      const texture = await loader.loadAsync(`/volta-uus-7/textures/${name}.jpg`);
      texture.colorSpace = name.endsWith("a") || name === "bush_alpha" ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      texture.flipY = false;
      texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      textures.set(name, texture);
    }),
  );

  const materials = new Map<string, THREE.Material>();
  for (const [meshName, textureName] of Object.entries(materialTexture)) {
    materials.set(meshName, new THREE.MeshBasicMaterial({ map: textures.get(textureName), toneMapped: false }));
  }
  materials.set(
    "TREE",
    new THREE.MeshBasicMaterial({
      map: textures.get("tree09"),
      alphaMap: textures.get("tree09a"),
      alphaTest: 0.28,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      toneMapped: false,
    }),
  );
  materials.set(
    "GLASS",
    new THREE.MeshPhysicalMaterial({
      color: 0xa8bdc4,
      transparent: true,
      opacity: 0.38,
      roughness: 0.12,
      metalness: 0.02,
      depthWrite: false,
    }),
  );
  materials.set("FRAMES", new THREE.MeshBasicMaterial({ color: 0x242927, toneMapped: false }));
  const fallback = new THREE.MeshBasicMaterial({ map: textures.get("basic"), toneMapped: false });
  const environment = textures.get("env")!;
  environment.mapping = THREE.EquirectangularReflectionMapping;

  return {
    environment,
    materialFor(meshName: string) {
      if (/^TREE/i.test(meshName)) return materials.get("TREE")!;
      return materials.get(meshName.toUpperCase()) ?? fallback;
    },
    dispose() {
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      fallback.dispose();
    },
  };
}
