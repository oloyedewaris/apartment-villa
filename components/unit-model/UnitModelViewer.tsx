"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { UnitAsset } from "@/lib/types";
import { Loader } from "@/components/ui/Loader";

function publicAssetPath(path: string) {
  return path.startsWith("./") ? path.slice(1) : path;
}

function panoramaForFloor(floor: number) {
  if (floor <= 6) return "/unit-assets/environments/view-20m-full.png";
  if (floor <= 8) return "/unit-assets/environments/view-27m-full.png";
  if (floor <= 10) return "/unit-assets/environments/view-34m-full.png";
  return "/unit-assets/environments/view-42m-full.png";
}

function materialKey(name: string) {
  return name
    .toLowerCase()
    .replace(/_collide|\.\d+|[-_]\d+$/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function loadTexture(loader: THREE.TextureLoader, path: string, renderer: THREE.WebGLRenderer) {
  const texture = await loader.loadAsync(publicAssetPath(path));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.flipY = false;
  texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
  return texture;
}

async function loadTextures(loader: THREE.TextureLoader, paths: string[], renderer: THREE.WebGLRenderer, concurrency = 6) {
  const textures = new Array<THREE.Texture>(paths.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, paths.length) }, async () => {
    while (nextIndex < paths.length) {
      const index = nextIndex++;
      textures[index] = await loadTexture(loader, paths[index], renderer);
    }
  });
  await Promise.all(workers);
  return textures;
}

function fallbackMaterial(name: string) {
  const key = materialKey(name);
  if (/glass|glaz/.test(key)) {
    return new THREE.MeshPhysicalMaterial({
      color: 0xf4fbff,
      transparent: true,
      opacity: 0.12,
      roughness: 0.035,
      reflectivity: 0.35,
      ior: 1.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }
  if (/gold|silver|handle|tap|hinge|drain|black/.test(key)) {
    return new THREE.MeshStandardMaterial({ color: /gold/.test(key) ? 0x8b7253 : 0x272725, metalness: 0.72, roughness: 0.25 });
  }
  if (/led/.test(key)) return new THREE.MeshBasicMaterial({ color: 0xfff4d6 });
  return new THREE.MeshStandardMaterial({ color: /cutline/.test(key) ? 0x8e8c89 : 0xe8e4de, roughness: 0.82 });
}

function fitCameraToModel(camera: THREE.PerspectiveCamera, controls: OrbitControls, model: THREE.Object3D) {
  const bounds = new THREE.Box3().setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z) * 0.72;

  controls.target.copy(center);
  controls.minDistance = radius * 0.45;
  controls.maxDistance = radius * 6;

  const openingDirection = new THREE.Vector3(0.15, 4, 0.15).normalize();
  camera.position.copy(center).addScaledVector(openingDirection, controls.maxDistance);
  controls.update();
}

function findWalkableFloorPoint(model: THREE.Object3D, blockers: THREE.Mesh[], fallback: THREE.Vector3) {
  let bestScore = -1;
  const bestPoint = fallback.clone();
  const triangles: Array<[THREE.Vector3, THREE.Vector3, THREE.Vector3]> = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const candidate = new THREE.Vector3();
  const blockerBounds = blockers.map((mesh) => new THREE.Box3().setFromObject(mesh));
  const floorBounds = new THREE.Box3();
  const boundsCenter = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  const scoreCandidate = () => {
    let clearance = Infinity;
    for (const box of blockerBounds) {
      const dx = Math.max(box.min.x - candidate.x, 0, candidate.x - box.max.x);
      const dz = Math.max(box.min.z - candidate.z, 0, candidate.z - box.max.z);
      clearance = Math.min(clearance, Math.hypot(dx, dz));
    }
    const centerDistance = Math.hypot(candidate.x - boundsCenter.x, candidate.z - boundsCenter.z);
    const score = clearance - centerDistance * 0.18;
    if (score <= bestScore) return;
    bestScore = score;
    bestPoint.copy(candidate);
  };

  model.traverse((object) => {
    if (!(object instanceof THREE.Mesh) || !/^floor$/i.test(object.name)) return;
    const position = object.geometry.getAttribute("position");
    const index = object.geometry.index;
    const triangleCount = index ? index.count / 3 : position.count / 3;
    for (let triangle = 0; triangle < triangleCount; triangle += 1) {
      const offset = triangle * 3;
      const ia = index ? index.getX(offset) : offset;
      const ib = index ? index.getX(offset + 1) : offset + 1;
      const ic = index ? index.getX(offset + 2) : offset + 2;
      a.fromBufferAttribute(position, ia).applyMatrix4(object.matrixWorld);
      b.fromBufferAttribute(position, ib).applyMatrix4(object.matrixWorld);
      c.fromBufferAttribute(position, ic).applyMatrix4(object.matrixWorld);
      triangles.push([a.clone(), b.clone(), c.clone()]);
      floorBounds.expandByPoint(a).expandByPoint(b).expandByPoint(c);
    }
  });

  const isInsideTriangle = (point: THREE.Vector3, triangle: [THREE.Vector3, THREE.Vector3, THREE.Vector3]) => {
    const [v1, v2, v3] = triangle;
    const denominator = (v2.z - v3.z) * (v1.x - v3.x) + (v3.x - v2.x) * (v1.z - v3.z);
    if (Math.abs(denominator) < 1e-7) return false;
    const alpha = ((v2.z - v3.z) * (point.x - v3.x) + (v3.x - v2.x) * (point.z - v3.z)) / denominator;
    const beta = ((v3.z - v1.z) * (point.x - v3.x) + (v1.x - v3.x) * (point.z - v3.z)) / denominator;
    const gamma = 1 - alpha - beta;
    return alpha >= 0 && beta >= 0 && gamma >= 0;
  };

  for (let xStep = 0; xStep < 32; xStep += 1) {
    for (let zStep = 0; zStep < 32; zStep += 1) {
      candidate.set(
        THREE.MathUtils.lerp(floorBounds.min.x, floorBounds.max.x, (xStep + 0.5) / 32),
        floorBounds.min.y,
        THREE.MathUtils.lerp(floorBounds.min.z, floorBounds.max.z, (zStep + 0.5) / 32),
      );
      if (!triangles.some((triangle) => isInsideTriangle(candidate, triangle))) continue;
      scoreCandidate();
    }
  }

  if (!triangles.length) {
    const bounds = new THREE.Box3().setFromObject(model);
    const downward = new THREE.Vector3(0, -1, 0);
    const floorRay = new THREE.Raycaster();
    for (let xStep = 0; xStep < 32; xStep += 1) {
      for (let zStep = 0; zStep < 32; zStep += 1) {
        const x = THREE.MathUtils.lerp(bounds.min.x, bounds.max.x, (xStep + 0.5) / 32);
        const z = THREE.MathUtils.lerp(bounds.min.z, bounds.max.z, (zStep + 0.5) / 32);
        floorRay.set(new THREE.Vector3(x, bounds.max.y + 1, z), downward);
        const floorHit = floorRay.intersectObject(model, true).find((hit) => hit.point.y <= bounds.min.y + 0.2);
        if (!floorHit) continue;
        candidate.copy(floorHit.point);
        scoreCandidate();
      }
    }
  }

  return bestPoint;
}

export function UnitModelViewer({ asset, floor, startInTour = false }: { asset: UnitAsset; floor: number; startInTour?: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const enterTour = useRef<() => void>(() => undefined);
  const leaveTour = useRef<() => void>(() => undefined);
  const setMovement = useRef<(direction: string, pressed: boolean) => void>(() => undefined);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [tourActive, setTourActive] = useState(false);

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let disposed = false;
    setStatus("loading");
    setTourActive(false);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f1e9);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x928578, 2.2));
    const sunlight = new THREE.DirectionalLight(0xfff3e5, 2);
    sunlight.position.set(-8, 15, 9);
    scene.add(sunlight);

    const camera = new THREE.PerspectiveCamera(24, 1, 0.05, 1000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.07;
    controls.minPolarAngle = 0.15;
    controls.maxPolarAngle = Math.PI / 2.02;
    controls.zoomSpeed = 1.2;

    const pressed = new Set<string>();
    const collisionMeshes: THREE.Mesh[] = [];
    const walkSurfaceMeshes: THREE.Mesh[] = [];
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const clock = new THREE.Clock();
    const overviewPosition = new THREE.Vector3();
    const overviewTarget = new THREE.Vector3();
    const tourPosition = new THREE.Vector3();
    const tourLookTarget = new THREE.Vector3();
    const modelCenter = new THREE.Vector3();
    const modelBounds = new THREE.Box3();
    let tourBackdrop: THREE.Mesh<THREE.CylinderGeometry, THREE.MeshBasicMaterial> | undefined;
    let tourPanorama: THREE.Texture | undefined;
    let modelTextures: THREE.Texture[] = [];
    let unitEnvironment: THREE.Texture | undefined;
    let tourBackdropPromise: Promise<void> | undefined;
    let tourRequest = 0;
    const destinationRing = new THREE.Mesh(
      new THREE.RingGeometry(0.21, 0.3, 48),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
        toneMapped: false,
      }),
    );
    destinationRing.rotation.x = -Math.PI / 2;
    destinationRing.renderOrder = 20;
    destinationRing.visible = false;
    scene.add(destinationRing);
    let tourEnabled = false;
    let yaw = 0;
    let pitch = 0;
    let dragging = false;
    let pointerMoved = false;
    let pointerX = 0;
    let pointerY = 0;
    let pointerDownX = 0;
    let pointerDownY = 0;
    let traveling = false;
    let travelStartedAt = 0;
    let travelDuration = 0;
    const travelFrom = new THREE.Vector3();
    const travelTo = new THREE.Vector3();

    const updateTourRotation = () => {
      camera.rotation.order = "YXZ";
      camera.rotation.set(pitch, yaw, 0);
    };

    const keyDirection = (key: string) => {
      const normalized = key.toLowerCase();
      if (normalized === "w" || normalized === "arrowup") return "forward";
      if (normalized === "s" || normalized === "arrowdown") return "backward";
      if (normalized === "a" || normalized === "arrowleft") return "left";
      if (normalized === "d" || normalized === "arrowright") return "right";
      return "";
    };

    const reservationFlowActive = () => document.body.classList.contains("reservation-flow-active");

    const onKeyDown = (event: KeyboardEvent) => {
      if (!tourEnabled || reservationFlowActive()) {
        pressed.clear();
        return;
      }
      const direction = keyDirection(event.key);
      if (!direction) return;
      event.preventDefault();
      traveling = false;
      destinationRing.visible = false;
      pressed.add(direction);
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const direction = keyDirection(event.key);
      if (direction) pressed.delete(direction);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (!tourEnabled) return;
      dragging = true;
      pointerMoved = false;
      pointerX = event.clientX;
      pointerY = event.clientY;
      pointerDownX = event.clientX;
      pointerDownY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const floorPointAt = (event: PointerEvent) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const normalMatrix = new THREE.Matrix3();
      const hit = raycaster.intersectObjects(walkSurfaceMeshes, false)[0];
      if (!hit?.face) return undefined;
      normalMatrix.getNormalMatrix(hit.object.matrixWorld);
      const normal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize();
      const namedFloor = /(floor|tiles)/i.test(hit.object.name);
      const nearFloorLevel = hit.point.y <= modelBounds.min.y + 0.35;
      return normal.y > 0.65 && (namedFloor || nearFloorLevel) ? hit.point : undefined;
    };
    const updateFloorDestination = (event: PointerEvent) => {
      const point = floorPointAt(event);
      destinationRing.visible = Boolean(point);
      renderer.domElement.style.cursor = point ? "pointer" : "grab";
      if (point) destinationRing.position.set(point.x, point.y + 0.018, point.z);
      return point;
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!tourEnabled) return;
      if (!dragging) {
        updateFloorDestination(event);
        return;
      }
      if (Math.hypot(event.clientX - pointerDownX, event.clientY - pointerDownY) > 5) pointerMoved = true;
      destinationRing.visible = false;
      renderer.domElement.style.cursor = "grabbing";
      yaw += (event.clientX - pointerX) * 0.004;
      pitch += (event.clientY - pointerY) * 0.003;
      pitch = THREE.MathUtils.clamp(pitch, -Math.PI * 0.47, Math.PI * 0.47);
      pointerX = event.clientX;
      pointerY = event.clientY;
      updateTourRotation();
    };
    const onPointerUp = (event: PointerEvent) => {
      const shouldTravel = tourEnabled && !pointerMoved && event.button === 0;
      dragging = false;
      if (renderer.domElement.hasPointerCapture(event.pointerId)) renderer.domElement.releasePointerCapture(event.pointerId);
      if (!shouldTravel) {
        updateFloorDestination(event);
        return;
      }
      const point = updateFloorDestination(event);
      if (!point) return;
      pressed.clear();
      travelFrom.copy(camera.position);
      travelTo.set(THREE.MathUtils.lerp(travelFrom.x, point.x, 0.8), point.y + 1.62, THREE.MathUtils.lerp(travelFrom.z, point.z, 0.8));
      const distance = travelFrom.distanceTo(travelTo);
      if (distance < 0.25) return;
      travelDuration = THREE.MathUtils.clamp(distance / 3, 0.38, 1.05) * 1000;
      travelStartedAt = performance.now();
      traveling = true;
    };
    const onPointerLeave = () => {
      if (!dragging) destinationRing.visible = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointercancel", onPointerUp);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const textureLoader = new THREE.TextureLoader();

    async function ensureTourBackdrop() {
      if (tourBackdrop) return;
      tourBackdropPromise ??= textureLoader.loadAsync(panoramaForFloor(floor)).then((panorama) => {
        if (disposed) {
          panorama.dispose();
          return;
        }
        tourPanorama = panorama;
        panorama.colorSpace = THREE.SRGBColorSpace;
        panorama.wrapS = THREE.RepeatWrapping;
        panorama.wrapT = THREE.ClampToEdgeWrapping;
        panorama.anisotropy = renderer.capabilities.getMaxAnisotropy();
        tourBackdrop = new THREE.Mesh(
          new THREE.CylinderGeometry(90, 90, 180, 192, 1, true),
          new THREE.MeshBasicMaterial({ map: panorama, side: THREE.BackSide, toneMapped: false }),
        );
        tourBackdrop.position.set(modelCenter.x, modelBounds.min.y + 1.62, modelCenter.z);
        tourBackdrop.visible = false;
        scene.add(tourBackdrop);
      });
      await tourBackdropPromise;
    }

    async function loadModel() {
      try {
        const textures = await loadTextures(textureLoader, asset.textures, renderer);
        modelTextures = textures;
        const atlas = asset.format === "atlas" ? textures[0] : undefined;
        const materialTextures = new Map<string, THREE.Texture>();

        if (!atlas) {
          asset.textures.forEach((path, index) => {
            const filename =
              path
                .split("/")
                .at(-1)
                ?.replace(/^[0-9a-f]{10}-/, "")
                .replace(/\.[^.]+$/, "") || "";
            materialTextures.set(materialKey(filename), textures[index]);
          });
        }

        if (asset.environment) {
          unitEnvironment = await loadTexture(textureLoader, asset.environment, renderer);
          unitEnvironment.mapping = THREE.EquirectangularReflectionMapping;
          scene.environment = unitEnvironment;
        }

        const model = (await new GLTFLoader().loadAsync(publicAssetPath(asset.model))).scene;
        let walkMarker: THREE.Mesh | undefined;
        model.traverse((object) => {
          if (!(object instanceof THREE.Mesh)) return;
          if (/enterwalk/i.test(object.name)) {
            walkMarker = object;
            object.visible = false;
            return;
          }
          walkSurfaceMeshes.push(object);
          if (/_collide/i.test(object.name) && !/(floor|tiles|aptglaz)/i.test(object.name)) collisionMeshes.push(object);
          if (atlas) {
            if (/aptglaz/i.test(object.name)) object.material = fallbackMaterial("glass");
            else {
              const bakedUv = object.geometry.getAttribute("uv1");
              if (bakedUv) object.geometry.setAttribute("uv", bakedUv);
              object.material = new THREE.MeshBasicMaterial({ map: atlas, toneMapped: false });
            }
            return;
          }
          const map = materialTextures.get(materialKey(object.name));
          object.material = map ? new THREE.MeshStandardMaterial({ map, roughness: 0.72 }) : fallbackMaterial(object.name);
        });

        if (disposed) return;
        scene.add(model);
        model.updateWorldMatrix(true, true);
        fitCameraToModel(camera, controls, model);
        modelBounds.setFromObject(model);
        modelBounds.getCenter(modelCenter);
        overviewPosition.copy(camera.position);
        overviewTarget.copy(controls.target);

        const markerCenter = walkMarker
          ? new THREE.Box3().setFromObject(walkMarker).getCenter(new THREE.Vector3())
          : findWalkableFloorPoint(model, collisionMeshes, modelCenter);
        tourPosition.set(markerCenter.x, modelBounds.min.y + 1.62, markerCenter.z);
        tourLookTarget.copy(modelCenter);
        tourLookTarget.y = tourPosition.y;
        if (tourLookTarget.distanceToSquared(tourPosition) < 0.16) tourLookTarget.x += 1;

        enterTour.current = async () => {
          const request = ++tourRequest;
          try {
            await ensureTourBackdrop();
          } catch (error) {
            console.warn("Unable to load the virtual-tour panorama", error);
          }
          if (disposed || request !== tourRequest) return;
          overviewPosition.copy(camera.position);
          overviewTarget.copy(controls.target);
          controls.enabled = false;
          tourEnabled = true;
          traveling = false;
          destinationRing.visible = false;
          if (tourBackdrop) tourBackdrop.visible = true;
          pressed.clear();
          camera.fov = 68;
          camera.near = 0.04;
          camera.position.copy(tourPosition);
          camera.lookAt(tourLookTarget);
          const euler = new THREE.Euler().setFromQuaternion(camera.quaternion, "YXZ");
          pitch = euler.x;
          yaw = euler.y;
          updateTourRotation();
          camera.updateProjectionMatrix();
          clock.getDelta();
          setTourActive(true);
        };
        leaveTour.current = () => {
          tourRequest += 1;
          tourEnabled = false;
          traveling = false;
          dragging = false;
          destinationRing.visible = false;
          if (tourBackdrop) tourBackdrop.visible = false;
          renderer.domElement.style.cursor = "grab";
          pressed.clear();
          camera.fov = 24;
          camera.near = 0.05;
          camera.position.copy(overviewPosition);
          controls.target.copy(overviewTarget);
          controls.enabled = true;
          controls.update();
          camera.updateProjectionMatrix();
          setTourActive(false);
        };
        setMovement.current = (direction, isPressed) => {
          if (isPressed) pressed.add(direction);
          else pressed.delete(direction);
        };
        setStatus("ready");
      } catch (error) {
        console.error("Unable to load unit model", error);
        if (!disposed) setStatus("error");
      }
    }

    loadModel();
    let viewerVisible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      viewerVisible = entry.isIntersecting;
    });
    visibilityObserver.observe(container);
    renderer.setAnimationLoop(() => {
      if (!viewerVisible || document.hidden) return;
      const delta = Math.min(clock.getDelta(), 0.05);
      if (tourEnabled) {
        if (traveling) {
          const progress = THREE.MathUtils.clamp((performance.now() - travelStartedAt) / travelDuration, 0, 1);
          const eased = progress * progress * (3 - 2 * progress);
          camera.position.lerpVectors(travelFrom, travelTo, eased);
          if (progress >= 1) {
            traveling = false;
            destinationRing.visible = false;
          }
        }
        if (reservationFlowActive()) pressed.clear();
        const forwardAmount = Number(pressed.has("forward")) - Number(pressed.has("backward"));
        const rightAmount = Number(pressed.has("right")) - Number(pressed.has("left"));
        if (forwardAmount || rightAmount) {
          const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).setY(0).normalize();
          const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize();
          const movement = forward.multiplyScalar(forwardAmount).addScaledVector(right, rightAmount).normalize();
          const distance = delta * 1.65;
          raycaster.set(camera.position, movement);
          raycaster.far = distance + 0.28;
          const blocked = raycaster.intersectObjects(collisionMeshes, false).length > 0;
          if (!blocked) {
            camera.position.addScaledVector(movement, distance);
            camera.position.x = THREE.MathUtils.clamp(camera.position.x, modelBounds.min.x + 0.2, modelBounds.max.x - 0.2);
            camera.position.z = THREE.MathUtils.clamp(camera.position.z, modelBounds.min.z + 0.2, modelBounds.max.z - 0.2);
          }
        }
      } else controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      tourRequest += 1;
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      renderer.setAnimationLoop(null);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointercancel", onPointerUp);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();
      tourPanorama?.dispose();
      unitEnvironment?.dispose();
      modelTextures.forEach((texture) => texture.dispose());
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [asset, floor]);

  useEffect(() => {
    if (status !== "ready") return;
    if (startInTour) {
      enterTour.current();
    } else {
      leaveTour.current();
    }
  }, [startInTour, status]);

  return (
    <div className={`unit-model${tourActive ? " is-tour-active" : ""}`} ref={host}>
      {status === "loading" && (
        <div className="model-state">
          <Loader />
        </div>
      )}
      {status === "error" && <div className="model-state">The interior model could not be loaded.</div>}
      {status === "ready" && !tourActive && (
        <button className="tour-button" type="button" onClick={() => enterTour.current()}>
          <span aria-hidden="true">↳</span> Virtual tour
        </button>
      )}
      {tourActive && (
        <>
          <button className="tour-exit" type="button" onClick={() => leaveTour.current()}>
            <span aria-hidden="true">←</span> Exit virtual tour
          </button>
          <div className="tour-movement" aria-label="Virtual tour movement controls">
            <button
              type="button"
              aria-label="Move forward"
              onPointerDown={() => setMovement.current("forward", true)}
              onPointerUp={() => setMovement.current("forward", false)}
              onPointerLeave={() => setMovement.current("forward", false)}
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Move left"
              onPointerDown={() => setMovement.current("left", true)}
              onPointerUp={() => setMovement.current("left", false)}
              onPointerLeave={() => setMovement.current("left", false)}
            >
              ←
            </button>
            <button
              type="button"
              aria-label="Move backward"
              onPointerDown={() => setMovement.current("backward", true)}
              onPointerUp={() => setMovement.current("backward", false)}
              onPointerLeave={() => setMovement.current("backward", false)}
            >
              ↓
            </button>
            <button
              type="button"
              aria-label="Move right"
              onPointerDown={() => setMovement.current("right", true)}
              onPointerUp={() => setMovement.current("right", false)}
              onPointerLeave={() => setMovement.current("right", false)}
            >
              →
            </button>
          </div>
        </>
      )}
      <span className="model-hint">{tourActive ? "Drag to look · WASD to move" : "Drag to rotate · scroll to zoom"}</span>
    </div>
  );
}
