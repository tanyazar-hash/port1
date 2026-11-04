import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshTransmissionMaterial, Stars } from '@react-three/drei';
import { Suspense, useRef } from 'react';
import * as THREE from 'three';

const ease = (a: number, b: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

function Sculpture({ entered, storyProgress, scrollProgress, hero = false }: { entered: boolean; storyProgress?: number; scrollProgress: number; hero?: boolean }) {
  const mesh = useRef<THREE.Mesh>(null);
  useFrame(({ pointer, clock, camera }, delta) => {
    if (!mesh.current) return;
    const story = storyProgress !== undefined;
    const t = story && Number.isFinite(storyProgress) ? Math.max(0, Math.min(1, storyProgress!)) : 0;
    const chapterTwo = ease(0.22, 0.52, t);
    const chapterThree = ease(0.56, 0.88, t);
    const dive = ease(0.82, 1, t);
    mesh.current.rotation.y += delta * (story ? 0.13 + approach * 0.22 : entered ? 0.22 : 0.12);
    mesh.current.rotation.x = THREE.MathUtils.damp(mesh.current.rotation.x, story ? 0.18 + chapterTwo * 0.4 - chapterThree * 0.2 : pointer.y * 0.24, 2, delta);
    mesh.current.rotation.z = THREE.MathUtils.damp(mesh.current.rotation.z, story ? -chapterTwo * 0.35 + chapterThree * 0.5 : pointer.x * -0.16, 2, delta);
    const scale = story ? 0.8 + chapterTwo * 0.16 + chapterThree * 0.2 : hero ? 0.68 : entered ? 1.1 : 0.9;
    mesh.current.scale.setScalar(THREE.MathUtils.damp(mesh.current.scale.x, scale, 3, delta));
    mesh.current.position.y = Math.sin(clock.elapsedTime * 0.6) * 0.06 + (story ? chapterTwo * 0.2 - chapterThree * 0.35 : Math.min(1, scrollProgress / 12) * 0.25);
    mesh.current.position.x = story ? THREE.MathUtils.damp(mesh.current.position.x, 1.5 - chapterTwo * 0.55 + chapterThree * 0.3, 2.5, delta) : 0;
    const targetZ = story ? 8.6 - chapterTwo * 0.8 - chapterThree * 1.1 - dive * 0.7 : 7.8;
    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 2.5, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, story ? -0.5 + chapterTwo * 0.25 - chapterThree * 0.25 : hero ? 1.35 : 0, 2, delta);
    camera.lookAt(hero ? 0.45 : story ? 0.4 : 0, 0, 0);
  });
  return <Float speed={1.1} floatIntensity={0.24} rotationIntensity={0.08}>
    <mesh ref={mesh} rotation={[0.4, 0, 0.3]}>
      <torusKnotGeometry args={[1.18, 0.35, 240, 24, 2, 3]} />
      <MeshTransmissionMaterial backside samples={3} resolution={256} transmission={0.72} thickness={0.7} roughness={0.15} chromaticAberration={0.1} anisotropy={0.2} distortion={0.12} distortionScale={0.2} temporalDistortion={0.08} color="#b8cfc7" metalness={0.35} />
    </mesh>
  </Float>;
}

export default function Scene({ entered, scrollProgress = 0, storyProgress, hero = false }: { entered: boolean; scrollProgress?: number; storyProgress?: number; hero?: boolean }) {
  return <Canvas dpr={[1, 1.5]} camera={{ position: [hero ? 1.35 : 0, 0, 7.8], fov: 43 }} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}>
    <color attach="background" args={['#101216']} />
    <fog attach="fog" args={['#101216', 8, 18]} />
    <ambientLight intensity={1.4} />
    <pointLight position={[-4, 3, 3]} intensity={32} color="#658f91" />
    <pointLight position={[4, -2, 2]} intensity={25} color="#e1eee8" />
    <pointLight position={[0, 4, -3]} intensity={18} color="#34545c" />
    <Suspense fallback={null}><Sculpture entered={entered} scrollProgress={scrollProgress} storyProgress={storyProgress} hero={hero} /><Stars radius={40} depth={30} count={350} factor={2} saturation={0.25} fade speed={0.25} /></Suspense>
  </Canvas>;
}
