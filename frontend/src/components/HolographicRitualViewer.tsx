import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useGesture } from '@use-gesture/react';
import { useThree } from '@react-three/fiber';
import { Canvas, useFrame } from '@react-three/fiber';
import { HapticFeedback } from '../utils/hapticFeedback';
import { SpatialAudio } from '../utils/spatialAudio';
import './HolographicRitualViewer.css';

interface HolographicRitualViewerProps {
  ritualData: {
    geometry: string;
    energyFlow: number[];
    auraColors: string[];
    sacredSymbols: string[];
  };
  onInteraction: (type: string, data: any) => void;
}

interface RitualObject3D extends THREE.Object3D {
  energyPulse?: number;
  auraIntensity?: number;
}

const HolographicRitualViewer: React.FC<HolographicRitualViewerProps> = ({ ritualData, onInteraction }) => {
  const [isImmersive, setIsImmersive] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const hapticFeedback = useRef<HapticFeedback | null>(null);
  const spatialAudio = useRef<SpatialAudio | null>(null);

  useEffect(() => {
    // Initialize haptic feedback for multi-sensory experience
    hapticFeedback.current = new HapticFeedback();
    spatialAudio.current = new SpatialAudio();

    // Check for WebXR support for immersive holographic display
    if ('xr' in navigator) {
      navigator.xr?.isSessionSupported('immersive-vr').then((supported) => {
        setIsImmersive(supported);
      });
    }

    return () => {
      hapticFeedback.current?.cleanup();
      spatialAudio.current?.cleanup();
    };
  }, []);

  const RitualScene = () => {
    const { camera } = useThree();
    const ritualMesh = useRef<RitualObject3D>(null!);

    useFrame((_, delta) => {
      if (ritualMesh.current) {
        // Animate energy flow for holographic effect
        ritualMesh.current.energyPulse = (ritualMesh.current.energyPulse || 0) + delta * 0.5;
        ritualMesh.current.scale.setScalar(0.8 + Math.sin(ritualMesh.current.energyPulse) * 0.2);
        ritualMesh.current.rotation.y += delta * 0.1;

        // Update aura intensity
        ritualMesh.current.auraIntensity = Math.sin(Date.now() * 0.001) * 0.5 + 0.5;
      }
    });

    // Gesture recognition for spatial interaction
    const bind = useGesture({
      onDrag: ({ movement: [mx, my] }) => {
        if (ritualMesh.current) {
          ritualMesh.current.rotation.x = my * 0.01;
          ritualMesh.current.rotation.y = mx * 0.01;
          onInteraction('drag', { x: mx, y: my });
          hapticFeedback.current?.trigger('light');
        }
      },
      onPinch: ({ da: [d] }) => {
        if (ritualMesh.current) {
          ritualMesh.current.scale.setScalar(d * 0.5);
          onInteraction('pinch', { scale: d });
          hapticFeedback.current?.trigger('medium');
        }
      },
    });

    return (
      <group ref={ritualMesh} {...bind()}>
        <mesh>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial 
            color={ritualData.auraColors[0]} 
            wireframe={true} 
            transparent={true} 
            opacity={0.7} 
          />
        </mesh>
        {ritualData.sacredSymbols.map((symbol, index) => (
          <mesh key={index} position={[0, 0, index * 0.5 + 1]}>
            <planeGeometry args={[0.3, 0.3]} />
            <meshBasicMaterial color="white" transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
    );
  };

  return (
    <div ref={containerRef} className="holographic-ritual-viewer">
      <Canvas 
        camera={{ position: [0, 0, 5], fov: 60 }} 
        style={{ height: '100vh', width: '100vw' }}
        xr={isImmersive}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <RitualScene />
        <OrbitControls enableZoom={true} enablePan={false} />
      </Canvas>
      <div className="ritual-controls">
        <button onClick={() => onInteraction('reset', {})}>Reset Ritual</button>
        {isImmersive && <button onClick={() => navigator.xr?.requestSession('immersive-vr')}>Enter VR</button>}
      </div>
    </div>
  );
};

export default HolographicRitualViewer;
