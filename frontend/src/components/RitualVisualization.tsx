import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { ARButton, XR, Controllers, Hands } from '@react-three/xr';
import { OrbitControls, Environment, Text } from '@react-three/drei';
import * as THREE from 'three';

// Types for ritual data and props
interface RitualData {
  id: string;
  name: string;
  culturalOrigin: string;
  modelUrl: string;
  instructions: string[];
}

interface RitualVisualizationProps {
  ritual: RitualData;
  onComplete: () => void;
}

// 3D Model Component for Ritual Artifact
const RitualArtifact = ({ modelUrl }: { modelUrl: string }) => {
  const ref = useRef<THREE.Mesh>(null!);
  
  useFrame((state, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5;
    }
  });

  return (
    <mesh ref={ref} scale={[0.5, 0.5, 0.5]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="gold" />
      {/* In production, replace with actual model loader */}
      <Text position={[0, 0.6, 0]} fontSize={0.2} color="black">
        {modelUrl ? 'Artifact Model' : 'Placeholder'}
      </Text>
    </mesh>
  );
};

// Interactive Ritual Guide Component
const RitualGuide = ({ instructions }: { instructions: string[] }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < instructions.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  return (
    <group position={[2, 1, 0]}>
      <Text fontSize={0.3} color="white" onClick={handleNext}>
        Step {currentStep + 1}: {instructions[currentStep]}
      </Text>
      <Text position={[0, -0.3, 0]} fontSize={0.2} color="gray">
        Click to proceed
      </Text>
    </group>
  );
};

// Main Ritual Visualization Component
const RitualVisualization: React.FC<RitualVisualizationProps> = ({ ritual, onComplete }) => {
  const [isARSupported, setIsARSupported] = useState(false);

  useEffect(() => {
    // Check for WebXR support
    navigator.xr?.isSessionSupported('immersive-ar').then((supported) => {
      setIsARSupported(supported);
    });
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'black' }}>
      {isARSupported && <ARButton sessionInit={{ requiredFeatures: ['hit-test'] }} />}
      <Canvas>
        <XR>
          <Controllers />
          <Hands />
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <RitualArtifact modelUrl={ritual.modelUrl} />
          <RitualGuide instructions={ritual.instructions} />
          <Environment preset="sunset" />
          <OrbitControls />
          <Text position={[0, 2, 0]} fontSize={0.5} color="white">
            {ritual.name} - {ritual.culturalOrigin}
          </Text>
        </XR>
      </Canvas>
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '20px', 
        color: 'white', 
        background: 'rgba(0,0,0,0.7)', 
        padding: '10px',
        borderRadius: '5px'
      }}>
        <p>AR Mode: {isARSupported ? 'Supported' : 'Not Supported'}</p>
        <button 
          onClick={onComplete} 
          style={{ 
            background: 'gold', 
            border: 'none', 
            padding: '5px 10px', 
            cursor: 'pointer',
            borderRadius: '3px'
          }}
        >
          Complete Ritual
        </button>
      </div>
    </div>
  );
};

export default RitualVisualization;
