import { Suspense, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

type Props = { progress: MutableRefObject<number>; reduced: boolean };

function Phone({ progress, reduced }: Props) {
  const gltf = useGLTF('/phone.glb');
  const root = useRef<THREE.Group>(null);
  const object = useMemo(() => {
    // The original export contains two coincident copies; show one.
    const original = gltf.scene.children[0] || gltf.scene;
    const copy = original.clone(true);
    const center = new THREE.Box3().setFromObject(copy).getCenter(new THREE.Vector3());
    copy.position.sub(center);
    return copy;
  }, [gltf]);

  useFrame(({ clock, viewport }, delta) => {
    if (!root.current) return;
    const p = progress.current;
    const compact = viewport.width < 6;
    // The GLB exporter already converts Blender's axes to glTF coordinates.
    // The old -90deg correction turned the phone upside down; keep its native orientation.
    // A slow, curved fall: vertical travel, sideways drift, a tumbling spin,
    // and a brief acceleration through each section.
    const fall = p * p * (3 - 2 * p);
    const wobble = reduced ? 0 : Math.sin(clock.elapsedTime * 0.75 + p * 12) * 0.075;
    const x = (compact ? 0.18 : 1.45) + Math.sin(p * Math.PI * 3.4) * (compact ? 0.23 : 0.5);
    const y = (compact ? 0.62 : 0.72) - fall * (compact ? 1.25 : 2.15) + wobble;
    root.current.position.x = THREE.MathUtils.damp(root.current.position.x, x, 3.2, delta);
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, y, 3.2, delta);
    root.current.rotation.y = THREE.MathUtils.damp(root.current.rotation.y, -0.25 + p * Math.PI * 4.3, 3.2, delta);
    root.current.rotation.z = THREE.MathUtils.damp(root.current.rotation.z, -0.18 + p * Math.PI * 1.4 + Math.sin(p * Math.PI * 6) * 0.2, 3.2, delta);
    root.current.rotation.x = THREE.MathUtils.damp(root.current.rotation.x, 0.12 + Math.sin(p * Math.PI * 3.2) * 0.38, 3.2, delta);
    const scale = (compact ? 15.2 : 23.5) * (1 + Math.sin(p * Math.PI) * 0.09);
    root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, scale, 3.4, delta));
  });

  return <group ref={root} position={[1.5, 0.4, 0]}>
    <primitive object={object}/>
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
