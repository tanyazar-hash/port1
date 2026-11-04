import { Canvas, useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const porcelain = {color:'#c7cfca',metalness:.42,roughness:.24};
const graphite = {color:'#273331',metalness:.8,roughness:.27};
const dark = {color:'#101a1b',metalness:.62,roughness:.22};
const steel = {color:'#7b8b87',metalness:.92,roughness:.2};

function Humanoid({interactive}:{interactive:boolean}){
  const head=useRef<THREE.Group>(null);
  const gaze=useRef<THREE.Group>(null);
  const torso=useRef<THREE.Group>(null);
  const cursor=useRef(new THREE.Vector2());
  useEffect(()=>{
    if(!interactive)return;
    const onMove=(event:PointerEvent)=>cursor.current.set((event.clientX/window.innerWidth)*2-1,1-(event.clientY/window.innerHeight)*2);
    window.addEventListener('pointermove',onMove,{passive:true});
    return()=>window.removeEventListener('pointermove',onMove);
  },[interactive]);
  useFrame(({clock},delta)=>{
    const x=interactive?THREE.MathUtils.clamp(cursor.current.x,-1,1):Math.sin(clock.elapsedTime*.45)*.22;
    const y=interactive?THREE.MathUtils.clamp(cursor.current.y,-1,1):Math.cos(clock.elapsedTime*.5)*.14;
    if(head.current){
      head.current.rotation.y=THREE.MathUtils.damp(head.current.rotation.y,x*.34,2.5,delta);
      head.current.rotation.x=THREE.MathUtils.damp(head.current.rotation.x,-y*.17,2.5,delta);
    }
    if(gaze.current){
      gaze.current.position.x=THREE.MathUtils.damp(gaze.current.position.x,x*.045,4,delta);
      gaze.current.position.y=THREE.MathUtils.damp(gaze.current.position.y,y*.04,4,delta);
    }
    if(torso.current)torso.current.position.y=Math.sin(clock.elapsedTime*.8)*.016;
  });
  return <group position={[0,-.25,0]}>
    <group ref={torso}>
      {/* Armoured shoulders and chest */}
      <mesh position={[0,-1.45,-.05]} scale={[1.58,.93,.72]}><sphereGeometry args={[1,48,32]}/><meshStandardMaterial {...graphite}/></mesh>
      <mesh position={[0,-1.23,.36]} scale={[1.27,.56,.29]}><sphereGeometry args={[1,48,32]}/><meshStandardMaterial {...porcelain}/></mesh>
      {[-1,1].map(side=><group key={side}>
        <mesh position={[side*1.31,-1.24,.04]} rotation={[0,0,side*.24]} scale={[.52,.69,.62]}><sphereGeometry args={[1,40,24]}/><meshStandardMaterial {...porcelain}/></mesh>
        <mesh position={[side*1.32,-1.55,.49]} rotation={[0,0,side*.28]}><torusGeometry args={[.31,.028,10,48]}/><meshStandardMaterial {...steel}/></mesh>
        <mesh position={[side*.43,-1.22,.61]} rotation={[0,0,side*.22]} scale={[.38,.36,.055]}><sphereGeometry args={[1,32,20]}/><meshStandardMaterial {...graphite}/></mesh>
        <mesh position={[side*.43,-1.22,.67]}><sphereGeometry args={[.055,16,12]}/><meshStandardMaterial color="#a6dfca" emissive="#6ccca6" emissiveIntensity={1.2}/></mesh>
        <mesh position={[side*.95,-.93,.08]} rotation={[0,0,side*.4]}><cylinderGeometry args={[.065,.065,.7,16]}/><meshStandardMaterial {...steel}/></mesh>
      </group>)}
      {/* Mechanical collar and neck */}
      <mesh position={[0,-.68,.03]}><cylinderGeometry args={[.37,.51,.52,32]}/><meshStandardMaterial {...dark}/></mesh>
      {[0,1,2,3].map(i=><mesh key={i} position={[0,-.5-i*.115,.05]}><torusGeometry args={[.32+i*.027,.025,10,48]}/><meshStandardMaterial {...steel}/></mesh>)}
      <mesh position={[0,-.87,.53]}><torusGeometry args={[.53,.055,12,64]}/><meshStandardMaterial {...steel}/></mesh>
      <mesh position={[0,-1.42,.63]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.22,.022,12,48]}/><meshStandardMaterial color="#a5e2cc" emissive="#65b89b" emissiveIntensity={.65}/></mesh>
    </group>
    <group ref={head} position={[0,.23,.05]}>
      {/* Human-proportioned cranial shell and facial plate */}
      <mesh position={[0,.1,-.09]} scale={[.73,.94,.66]}><sphereGeometry args={[1,64,48]}/><meshStandardMaterial {...porcelain}/></mesh>
      <mesh position={[0,-.3,.24]} scale={[.56,.62,.39]}><sphereGeometry args={[1,48,40]}/><meshStandardMaterial {...porcelain}/></mesh>
      <mesh position={[0,-.12,.57]} scale={[.51,.53,.09]}><sphereGeometry args={[1,48,32]}/><meshStandardMaterial color="#b5c2bc" metalness={.48} roughness={.3}/></mesh>
      {/* Cheek and jaw panel seams */}
      {[-1,1].map(side=><group key={side}>
        <mesh position={[side*.65,-.03,.02]} scale={[.13,.44,.35]}><sphereGeometry args={[1,32,24]}/><meshStandardMaterial {...graphite}/></mesh>
        <mesh position={[side*.67,-.03,.22]}><sphereGeometry args={[.13,24,16]}/><meshStandardMaterial {...steel}/></mesh>
        <mesh position={[side*.67,-.03,.325]}><cylinderGeometry args={[.045,.045,.025,16]}/><meshStandardMaterial {...dark}/></mesh>
        <mesh position={[side*.3,-.035,.649]} scale={[.19,.1,.045]}><sphereGeometry args={[1,32,16]}/><meshStandardMaterial {...dark}/></mesh>
      </group>)}
      <group ref={gaze} position={[0,0,.68]}>
        {[-.3,.3].map(x=><group key={x} position={[x,0,0]}>
          <mesh><sphereGeometry args={[.071,24,16]}/><meshStandardMaterial color="#d4fff0" emissive="#82dfbb" emissiveIntensity={2.2} toneMapped={false}/></mesh>
          <mesh position={[0,0,-.012]}><torusGeometry args={[.093,.012,8,32]}/><meshStandardMaterial {...steel}/></mesh>
        </group>)}
      </group>
      <mesh position={[0,-.26,.663]} scale={[.095,.19,.08]}><sphereGeometry args={[1,24,16]}/><meshStandardMaterial {...porcelain}/></mesh>
      <mesh position={[0,-.47,.575]}><boxGeometry args={[.2,.018,.022]}/><meshStandardMaterial {...graphite}/></mesh>
      <mesh position={[0,.79,-.1]} rotation={[0,0,Math.PI/2]}><torusGeometry args={[.46,.022,10,64,Math.PI]}/><meshStandardMaterial {...steel}/></mesh>
      <mesh position={[0,.87,-.09]} scale={[.35,.045,.27]}><sphereGeometry args={[1,32,16]}/><meshStandardMaterial {...steel}/></mesh>
    </group>
  </group>;
}

export default function CursorRobot({interactive=true}:{interactive?:boolean}){
  return <Canvas dpr={[1,1.5]} camera={{position:[0,.1,4.7],fov:40}} gl={{alpha:true,antialias:true,powerPreference:'low-power'}} style={{width:'100%',height:'100%'}}>
    <ambientLight intensity={1.6}/>
    <directionalLight position={[-4,5,5]} intensity={3.2} color="#f0f5ef"/>
    <directionalLight position={[3,2,-2]} intensity={3.8} color="#7caa96"/>
    <pointLight position={[2,-1,4]} intensity={18} color="#bdd8c5"/>
    <Humanoid interactive={interactive}/>
  </Canvas>;
}
