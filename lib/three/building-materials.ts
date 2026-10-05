import * as THREE from "three";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";

const textureNames =
  `aterrace awhitewalls billboard_001 billboard_002 bins bronze bterracefurn bush03 bush03a gardenboxes grassbase grasspaving groundfloor k4planters k4stuff lobbystuff outdoorarmchair outdoorsofa outdoortable paving planters playground playgroundplanters playgroundsurface podiumconc podiumfacade pots road seats shadowa soil steps terrace toweraceiling toweraconcrete towerafacade towerafloor towerawalls towerbconcrete towerbfacade towerbfloor towerbwalls tree002 tree002a tree003 tree003a tree004 tree004a tree005 tree005a tree006 tree006a tree007 tree007a tree009 tree009a tree012 tree012a tree08 tree08a tree10 tree10a`.split(
    " ",
  );

const alphaTexturePattern = /^(tree002a|tree003a|tree004a|tree005a|tree006a|tree007a|tree009a|tree012a|tree08a|tree10a|bush03a|shadowa)$/;

export function buildingTextureKey(meshName: string) {
  const normalized = meshName
    .toLowerCase()
    .replace(/_\d+$/, "")
    .replace(/[^a-z0-9]/g, "");
  const aliases: Record<string, string> = { table: "outdoortable", stuff: "k4stuff", shadow: "shadowa", buildingpodium: "groundfloor" };
  if (aliases[normalized]) return aliases[normalized];

  const exact = textureNames.find((name) => !name.endsWith("a") && name.replace(/_/g, "") === normalized);
  if (exact) return exact;
  if (normalized.includes("billboard001")) return "billboard_001";
  if (normalized.includes("billboard002")) return "billboard_002";
  if (normalized.includes("playgroundplanter")) return "playgroundplanters";
  if (normalized.includes("playgroundsurface")) return "playgroundsurface";
  if (normalized.includes("playground")) return "playground";
  if (normalized.includes("grass")) return normalized.includes("paving") ? "grasspaving" : "grassbase";
  if (normalized.includes("podiumconc")) return "podiumconc";
  if (normalized.includes("podiumfacade")) return "podiumfacade";
  if (normalized.includes("podiumglaz") || normalized === "glass" || normalized === "frames") return null;

  return textureNames.find((name) => !name.endsWith("a") && normalized.startsWith(name.replace(/_/g, ""))) || null;
}

function fallbackMaterial(meshName: string) {
  const name = meshName.toLowerCase();
  if (name.includes("glass") || name.includes("glaz")) {
    return new THREE.MeshPhysicalMaterial({
      color: 0x91a9bf,
      transparent: true,
      opacity: 0.46,
      roughness: 0.08,
      metalness: 0.04,
      depthWrite: false,
      envMapIntensity: 1.25,
    });
  }
  if (name.includes("frame")) return new THREE.MeshBasicMaterial({ color: 0x202220, toneMapped: false });
  const color = name.includes("tree") || name.includes("bush") ? 0x566a3b : name.includes("road") ? 0x292a2b : 0x30312f;
  return new THREE.MeshBasicMaterial({ color, toneMapped: false });
}

export async function loadBuildingMaterials(renderer: THREE.WebGLRenderer) {
  const loader = new KTX2Loader().setTranscoderPath("/vendor/basis/").detectSupport(renderer);
  const textures = new Map<string, THREE.Texture>();

  await Promise.all(
    textureNames.map(async (name) => {
      try {
        const texture = await loader.loadAsync(`/textures/${name}.ktx2`);
        texture.colorSpace = alphaTexturePattern.test(name) ? THREE.NoColorSpace : THREE.SRGBColorSpace;
        texture.flipY = false;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textures.set(name, texture);
      } catch (error) {
        console.warn(`Unable to load building texture ${name}`, error);
      }
    }),
  );

  const materials = new Map<string, THREE.Material>();
  for (const name of textureNames) {
    if (name.endsWith("a") || name === "shadowa") continue;
    const map = textures.get(name);
    if (!map) continue;
    const alphaMap = textures.get(`${name}a`);
    const billboard = name === "billboard_001" || name === "billboard_002";
    const cutout = billboard || Boolean(alphaMap) || /tree|bush|grass/.test(name);
    materials.set(
      name,
      new THREE.MeshBasicMaterial({
        map,
        alphaMap: alphaMap || null,
        transparent: cutout,
        alphaTest: billboard ? 0.025 : cutout ? 0.32 : 0,
        side: cutout ? THREE.DoubleSide : THREE.FrontSide,
        depthTest: !billboard,
        depthWrite: !cutout,
        toneMapped: false,
      }),
    );
  }
  const shadow = textures.get("shadowa");
  if (shadow)
    materials.set(
      "shadowa",
      new THREE.MeshBasicMaterial({ color: 0x241f1c, alphaMap: shadow, transparent: true, opacity: 0.5, depthWrite: false, toneMapped: false }),
    );
  const environment = await new THREE.TextureLoader().loadAsync("/textures/env.jpg");
  environment.mapping = THREE.EquirectangularReflectionMapping;
  environment.colorSpace = THREE.SRGBColorSpace;

  return {
    environment,
    materialFor(meshName: string) {
      const key = buildingTextureKey(meshName);
      return (key && materials.get(key)) || fallbackMaterial(meshName);
    },
    dispose() {
      materials.forEach((material) => material.dispose());
      textures.forEach((texture) => texture.dispose());
      environment.dispose();
      loader.dispose();
    },
  };
}
