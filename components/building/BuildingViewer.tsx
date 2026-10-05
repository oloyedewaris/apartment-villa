"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { loadVoltaUus7Materials } from "@/lib/three/volta-uus-7-materials";
import type { Apartment } from "@/lib/types";
import { Loader } from "@/components/ui/Loader";

interface BuildingViewerProps {
  apartments: Apartment[];
  visibleNumbers: Set<string>;
  selectableNumbers: Set<string>;
  filtersActive: boolean;
  hoveredNumber: string | null;
  focusedNumber: string | null;
  onHover(number: string | null): void;
  onSelect(number: string): void;
}

interface ModelUnit {
  number: string;
  meshes: THREE.Mesh[];
  center: THREE.Vector3;
}

export function BuildingViewer(props: BuildingViewerProps) {
  const host = useRef<HTMLDivElement>(null);
  const propsRef = useRef(props);
  const unitsRef = useRef<ModelUnit[]>([]);
  const repaintRef = useRef(() => {});
  const refreshTargetsRef = useRef(() => {});
  const focusUnitRef = useRef((_number: string | null) => {});
  propsRef.current = props;

  useEffect(() => {
    repaintRef.current();
    refreshTargetsRef.current();
  }, [props.visibleNumbers, props.filtersActive, props.hoveredNumber]);

  useEffect(() => {
    focusUnitRef.current(props.focusedNumber);
  }, [props.focusedNumber]);

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let disposed = false;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    container.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdae4da);
    scene.add(new THREE.HemisphereLight(0xe8f0fa, 0x443b35, 1.05));
    const camera = new THREE.PerspectiveCamera(31, 1, 0.1, 2000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI / 2;

    const colors = {
      idle: new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
      filtered: new THREE.MeshBasicMaterial({ color: 0xf4ece6, transparent: true, opacity: 0.58, depthWrite: false }),
      hover: new THREE.MeshBasicMaterial({ color: 0xe7a07e, transparent: true, opacity: 0.6, depthWrite: false, depthTest: false }),
    };
    let renderFrames = 1;
    let desiredDistance: number | undefined;
    let previousFrameTime = performance.now();
    let cameraTransition:
      | {
          startedAt: number;
          startAngle: number;
          angleChange: number;
          distance: number;
          startPolarAngle: number;
          endPolarAngle: number;
          startTarget: THREE.Vector3;
          endTarget: THREE.Vector3;
        }
      | undefined;

    focusUnitRef.current = (number) => {
      if (!number) {
        cameraTransition = undefined;
        return;
      }
      const unit = unitsRef.current.find((candidate) => candidate.number === number);
      if (!unit) return;

      const buildingTarget = controls.target;
      const cameraOffset = camera.position.clone().sub(buildingTarget);
      const distance = cameraOffset.length();
      const startAngle = Math.atan2(cameraOffset.x, cameraOffset.z);
      const startPolarAngle = Math.acos(THREE.MathUtils.clamp(cameraOffset.y / distance, -1, 1));
      const unitOffsetX = unit.center.x - buildingTarget.x;
      const unitOffsetZ = unit.center.z - buildingTarget.z;
      const endAngle = Math.atan2(unitOffsetX, unitOffsetZ);
      const angleChange = Math.atan2(Math.sin(endAngle - startAngle), Math.cos(endAngle - startAngle));
      const endPolarAngle = Math.PI / 2;
      cameraTransition = {
        startedAt: performance.now(),
        startAngle,
        angleChange,
        distance,
        startPolarAngle,
        endPolarAngle,
        startTarget: controls.target.clone(),
        endTarget: unit.center.clone(),
      };
      renderFrames = Math.max(renderFrames, 1);
    };

    const onWheel = (event: WheelEvent) => {
      if (!controls.enabled) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      cameraTransition = undefined;

      const currentDistance = camera.position.distanceTo(controls.target);
      const deltaMultiplier = event.deltaMode === WheelEvent.DOM_DELTA_LINE ? 16 : event.deltaMode === WheelEvent.DOM_DELTA_PAGE ? container.clientHeight : 1;
      const delta = THREE.MathUtils.clamp(event.deltaY * deltaMultiplier, -240, 240);
      desiredDistance = THREE.MathUtils.clamp((desiredDistance ?? currentDistance) * Math.exp(delta * 0.001), controls.minDistance, controls.maxDistance);
      renderFrames = Math.max(renderFrames, 1);
    };
    renderer.domElement.addEventListener("wheel", onWheel, { capture: true, passive: false });

    repaintRef.current = () => {
      const current = propsRef.current;
      for (const unit of unitsRef.current) {
        const visible = current.visibleNumbers.has(unit.number);
        const material = unit.number === current.hoveredNumber ? colors.hover : !visible && current.filtersActive ? colors.filtered : colors.idle;
        unit.meshes.forEach((mesh) => {
          mesh.material = material;
          mesh.renderOrder = material === colors.hover ? 11 : 3;
        });
      }
      renderFrames = Math.max(renderFrames, 1);
    };

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let selectableMeshes: THREE.Mesh[] = [];
    refreshTargetsRef.current = () => {
      const selectableNumbers = propsRef.current.selectableNumbers;
      selectableMeshes = unitsRef.current.filter((unit) => selectableNumbers.has(unit.number)).flatMap((unit) => unit.meshes);
    };
    let dragStart: { pointerId: number; x: number; y: number } | null = null;
    let suppressClick = false;
    function pick(event: PointerEvent) {
      const bounds = renderer.domElement.getBoundingClientRect();
      pointer.set(((event.clientX - bounds.left) / bounds.width) * 2 - 1, -((event.clientY - bounds.top) / bounds.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObjects(selectableMeshes, false)[0]?.object.userData.unitNumber as string | undefined;
    }

    renderer.domElement.onpointerdown = (event) => {
      dragStart = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
      suppressClick = false;
    };
    renderer.domElement.onpointermove = (event) => {
      if (dragStart?.pointerId === event.pointerId && Math.hypot(event.clientX - dragStart.x, event.clientY - dragStart.y) > 5) {
        suppressClick = true;
      }
      const number = pick(event) || null;
      renderer.domElement.style.cursor = number ? "pointer" : "grab";
      if (number !== propsRef.current.hoveredNumber) propsRef.current.onHover(number);
    };
    renderer.domElement.onpointerup = () => {
      dragStart = null;
    };
    renderer.domElement.onpointercancel = () => {
      dragStart = null;
      suppressClick = true;
    };
    renderer.domElement.onpointerleave = () => propsRef.current.onHover(null);
    renderer.domElement.onclick = (event) => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      const number = pick(event);
      if (number) propsRef.current.onSelect(number);
    };

    const resize = () => {
      const width = container.clientWidth,
        height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
      renderFrames = Math.max(renderFrames, 1);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    let materialLibrary: Awaited<ReturnType<typeof loadVoltaUus7Materials>> | undefined;
    let sceneRoot: THREE.Group | undefined;
    async function initialize() {
      const loadedMaterials = await loadVoltaUus7Materials(renderer);
      materialLibrary = loadedMaterials;
      scene.environment = loadedMaterials.environment;
      const draco = new DRACOLoader().setDecoderPath("/vendor/draco/");
      const root = (await new GLTFLoader().setDRACOLoader(draco).loadAsync("/volta-uus-7/building.glb")).scene;
      draco.dispose();
      if (disposed) return;
      sceneRoot = root;

      const apartmentMeshes = new Map<string, THREE.Mesh[]>();
      root.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        const match = /^(?:apartment_|apt_)(\d+)/i.exec(object.name);
        if (match) {
          const number = String(Number(match[1]));
          const meshes = apartmentMeshes.get(number) || [];
          meshes.push(object);
          apartmentMeshes.set(number, meshes);
          object.userData.unitNumber = number;
          return;
        }
        object.material = loadedMaterials.materialFor(object.name);
      });

      scene.add(root);
      root.updateWorldMatrix(true, true);
      unitsRef.current = props.apartments
        .map((unit) => {
          const meshes = apartmentMeshes.get(String(Number(unit.number_num))) || [];
          const center = new THREE.Vector3();
          if (meshes.length) {
            const bounds = new THREE.Box3();
            meshes.forEach((mesh) => bounds.expandByObject(mesh));
            bounds.getCenter(center);
          }
          return { number: String(Number(unit.number_num)), meshes, center };
        })
        .filter((unit) => unit.meshes.length > 0);
      refreshTargetsRef.current();
      const box = new THREE.Box3().setFromObject(root),
        center = box.getCenter(new THREE.Vector3()),
        size = box.getSize(new THREE.Vector3()),
        radius = size.length() / 2;
      controls.target.set(center.x, center.y - size.y * 0.08, center.z);
      const direction = new THREE.Vector3(0.72, 1.48, 1.48).normalize();
      const distance = radius * 3.05;
      camera.position.copy(controls.target).addScaledVector(direction, distance);
      controls.minDistance = radius * 0.46;
      controls.maxDistance = distance;
      camera.near = radius / 150;
      camera.far = radius * 20;
      camera.updateProjectionMatrix();
      controls.update();
      repaintRef.current();
      focusUnitRef.current(propsRef.current.focusedNumber);
      container.querySelector(".building-loading")?.remove();
    }

    initialize().catch((error) => {
      console.error("Unable to initialize building viewer", error);
      const loading = container.querySelector(".building-loading");
      if (loading) loading.textContent = "The building model could not be loaded.";
    });
    let viewerVisible = true;
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      viewerVisible = entry.isIntersecting;
      if (viewerVisible) renderFrames = Math.max(renderFrames, 1);
    });
    visibilityObserver.observe(container);
    renderer.setAnimationLoop((time) => {
      if (!viewerVisible || document.hidden) return;
      const deltaTime = Math.min((time - previousFrameTime) / 1000, 0.05);
      previousFrameTime = time;
      if (cameraTransition) {
        const progress = THREE.MathUtils.clamp((performance.now() - cameraTransition.startedAt) / 520, 0, 1);
        const eased = progress * progress * (3 - 2 * progress);
        const angle = cameraTransition.startAngle + cameraTransition.angleChange * eased;
        const polarAngle = THREE.MathUtils.lerp(cameraTransition.startPolarAngle, cameraTransition.endPolarAngle, eased);
        controls.target.lerpVectors(cameraTransition.startTarget, cameraTransition.endTarget, eased);
        const horizontalDistance = Math.sin(polarAngle) * cameraTransition.distance;
        camera.position.set(
          controls.target.x + Math.sin(angle) * horizontalDistance,
          controls.target.y + Math.cos(polarAngle) * cameraTransition.distance,
          controls.target.z + Math.cos(angle) * horizontalDistance,
        );
        camera.lookAt(controls.target);
        renderFrames = Math.max(renderFrames, 1);
        if (progress >= 1) cameraTransition = undefined;
      }
      if (desiredDistance !== undefined && !cameraTransition) {
        const offset = camera.position.clone().sub(controls.target);
        const currentDistance = offset.length();
        const nextDistance = THREE.MathUtils.damp(currentDistance, desiredDistance, 15, deltaTime);
        camera.position.copy(controls.target).addScaledVector(offset.normalize(), nextDistance);
        renderFrames = Math.max(renderFrames, 1);
        if (Math.abs(nextDistance - desiredDistance) < 0.01) {
          camera.position.copy(controls.target).addScaledVector(offset, desiredDistance);
          desiredDistance = undefined;
        }
      }
      const controlsChanged = controls.update();
      if (!controlsChanged && renderFrames <= 0) return;
      renderer.render(scene, camera);
      renderFrames -= 1;
    });

    return () => {
      disposed = true;
      observer.disconnect();
      visibilityObserver.disconnect();
      renderer.setAnimationLoop(null);
      renderer.domElement.removeEventListener("wheel", onWheel, true);
      controls.dispose();
      sceneRoot?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      materialLibrary?.dispose();
      Object.values(colors).forEach((material) => material.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [props.apartments]);

  return (
    <div className="building-viewer" ref={host}>
      <div className="building-loading">
        <Loader />
      </div>
      <span className="building-hint">Drag to rotate · scroll to zoom · select an apartment</span>
    </div>
  );
}
