"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { Loader } from "@/components/ui/Loader";

export function VoltaUnitModelViewer({ modelPath }: { modelPath: string }) {
  const host = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    if (!host.current) return;
    const container = host.current;
    let disposed = false;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    container.prepend(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f2ed);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9288, 2.4));
    const light = new THREE.DirectionalLight(0xffffff, 2.2);
    light.position.set(6, 12, 8);
    scene.add(light);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.01, 2000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.maxPolarAngle = Math.PI / 2.02;

    let root: THREE.Group | undefined;
    const draco = new DRACOLoader().setDecoderPath("/vendor/draco/");
    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / Math.max(height, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();

    async function initialize() {
      root = (await new GLTFLoader().setDRACOLoader(draco).loadAsync(modelPath)).scene;
      if (disposed) return;
      root.traverse((object) => {
        if (/centerpoint/i.test(object.name)) object.visible = false;
        if (!(object instanceof THREE.Mesh)) return;
        object.material = Array.isArray(object.material) ? object.material.map((material) => material.clone()) : object.material.clone();
      });
      scene.add(root);
      root.updateWorldMatrix(true, true);
      const bounds = new THREE.Box3().setFromObject(root);
      const center = bounds.getCenter(new THREE.Vector3());
      const size = bounds.getSize(new THREE.Vector3());
      const radius = Math.max(size.x, size.y, size.z) * 0.58;
      controls.target.copy(center);
      controls.minDistance = Math.max(radius * 0.8, 0.5);
      controls.maxDistance = Math.max(radius * 5, 5);
      camera.position.copy(center).add(new THREE.Vector3(radius * 0.2, radius * 3.2, radius * 0.3));
      camera.near = Math.max(radius / 500, 0.01);
      camera.far = Math.max(radius * 30, 100);
      camera.updateProjectionMatrix();
      controls.update();
      setStatus("ready");
    }

    initialize().catch((error) => {
      console.error("Unable to load the Uus-Volta unit model", error);
      if (!disposed) setStatus("error");
    });
    renderer.setAnimationLoop(() => {
      controls.update();
      renderer.render(scene, camera);
    });

    return () => {
      disposed = true;
      observer.disconnect();
      renderer.setAnimationLoop(null);
      controls.dispose();
      draco.dispose();
      root?.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => material.dispose());
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [modelPath]);

  return (
    <div className="unit-model volta-unit-model" ref={host}>
      {status === "loading" && (
        <div className="model-state">
          <Loader />
        </div>
      )}
      {status === "error" && <div className="model-state">The 3D view could not be loaded.</div>}
      <span className="model-hint">Drag to rotate · scroll to zoom</span>
    </div>
  );
}
