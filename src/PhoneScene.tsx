import { Suspense, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type Props = { progress: MutableRefObject<number>; reduced: boolean };

function Phone({ progress, reduced }: Props) {
  const gltf = useGLTF('/phone.glb');
  const root = useRef<THREE.Group>(null);
  const { object, portraitRotation } = useMemo(() => {
    // Normalize the actual Blender mesh axes rather than guessing a 90° angle.
    // Longest dimension = height, middle = width, shortest = thickness.
    const original = gltf.scene.children[0] || gltf.scene;
    const copy = original.clone(true);
    const bounds = new THREE.Box3().setFromObject(copy);
    const center = bounds.getCenter(new THREE.Vector3());
    const size = bounds.getSize(new THREE.Vector3());
    copy.position.sub(center);
    const axes = [
      { axis: new THREE.Vector3(1, 0, 0), size: size.x },
      { axis: new THREE.Vector3(0, 1, 0), size: size.y },
      { axis: new THREE.Vector3(0, 0, 1), size: size.z },
    ].sort((a, b) => b.size - a.size);
    const vertical = axes[0].axis;
    const horizontal = axes[1].axis;
    const depth = new THREE.Vector3().crossVectors(horizontal, vertical).normalize();
    const basis = new THREE.Matrix4().makeBasis(horizontal, vertical, depth);
    // Bounding-box axes tell us portrait vs landscape, but not which end is top.
    // This particular Blender export has its camera module at the bottom after
    // axis alignment. Turn the mesh 180° in its screen plane to put cameras on top.
    const portraitRotation = new THREE.Quaternion()
      .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
      .multiply(new THREE.Quaternion().setFromRotationMatrix(basis).invert());
    return { object: copy, portraitRotation };
  }, [gltf]);

  useFrame(({ clock, viewport }, delta) => {
    if (!root.current) return;
    const p = progress.current;
    const compact = viewport.width < 6;
    // Portrait orientation is applied to the mesh itself below.
    // The outer group only makes small tilts and spins around the upright axis.
    const fall = p * p * (3 - 2 * p);
    const wobble = reduced ? 0 : Math.sin(clock.elapsedTime * 0.75 + p * 12) * 0.075;
    const x = (compact ? 0.18 : 1.45) + Math.sin(p * Math.PI * 3.4) * (compact ? 0.23 : 0.5);
    const y = (compact ? 0.58 : 0.62) - fall * (compact ? 0.48 : 0.72) + wobble;
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, x, 3.2, delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, y, 3.2, delta);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, -0.25 + p * Math.PI * 4, 3.2, delta);
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, -0.12 + Math.sin(p * Math.PI * 4) * 0.17, 3.2, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, 0.08 + Math.sin(p * Math.PI * 4) * 0.13, 3.2, delta);
    const scale = (compact ? 15.2 : 23.5) * (1 + Math.sin(p * Math.PI) * 0.09);
    root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, scale, 3.4, delta));
  });

  return <group ref={root} position={[1.5, 0.4, 0]}>
    <group quaternion={portraitRotation}><primitive object={object}/></group>
  </group>;
}

export default function PhoneScene(props: Props) {
  return <Canvas dpr={[1, 1.75]} camera={{ position: [0, 0, 8], fov: 42 }} gl={{ alpha: true, antialias: true, powerPreference: 'high-performance' }}>
    <ambientLight intensity={2.25}/>
    <hemisphereLight args={['#ffffff', '#6d737d', 2.4]}/>
    <directionalLight position={[3, 5, 6]} intensity={3.8} color="#ffffff"/>
    <directionalLight position={[-5, 0, -4]} intensity={3.1} color="#9aa4b3"/>
    <pointLight position={[-3, -3, 4]} intensity={75} color="#c9d2df"/>
    <Suspense fallback={null}><Phone {...props}/></Suspense>
  </Canvas>;
}
