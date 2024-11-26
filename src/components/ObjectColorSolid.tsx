import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from './AppLayout';
import { Button, FileInput, localStorageColorSchemeManager } from '@mantine/core';
import { vec3 } from 'three/webgpu';

const CustomShaderMaterial = shaderMaterial(
  { col: new THREE.Color(0xff00ff) },
  '',
  ''
);

extend({ CustomShaderMaterial });

export function CustomMesh({ geometry, vertexShader, fragmentShader, center }) {
  const meshRef = useRef();
  const { clock } = useThree();

  const material = new CustomShaderMaterial();
  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;

  useFrame(() => {
    if (meshRef.current) {
      material.uniforms.col.value.setHSL(clock.getElapsedTime() % 1, 1, 0.5);
      const point = new THREE.Vector3(...center)
      // if (meshRef.current) {
      //   //meshRef.current.position.sub(point);
      //   // Add slow rotation
      //   meshRef.current.rotation.y += 0.01; // Rotate around Y-axis
      //   meshRef.current.rotation.x += 0.005; // Rotate around X-axis
      //   meshRef.current.rotation.z += 0.003; // Rotate around Z-axis
      //   //meshRef.current.position.add(point); 
      // }
    }
  });

  return <mesh ref={meshRef} scale={0.5} geometry={geometry} material={material} />;
}

export type OcsData = {
  geometry: THREE.BufferGeometry,
  vertexShader: String,
  fragmentShader: String,
}

// Implement the moving slice
function MovingYSlice() {
  const sliceRef = useRef()
  const { positionY } = useAppContext()

  useFrame(() => {
    if (sliceRef) sliceRef.current.position.y = positionY 
  })

  return (
    <mesh ref={sliceRef} position={[0, positionY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial color="black" wireframe={true} />
    </mesh>
  )
}

function UpdateCamera() {
  const { camera, size } = useThree();

  useEffect(() => {
      const updateCamera = () => {
          const aspect = size.width / size.height;
          camera.left = aspect * -1;
          camera.right = aspect * 1;
          camera.top = 1;
          camera.bottom = -1;
          camera.updateProjectionMatrix();
      };
      updateCamera();
  }, [camera, size]);

  return null;
}

export default function ObjectColorSolid() {
  const [ocsData, setOcsData] = useState<OcsData>({geometry: new THREE.BufferGeometry(), vertexShader: '', fragmentShader: ''});
  const [ocs2Data, setOcs2Data] = useState<OcsData>({geometry: new THREE.BufferGeometry(), vertexShader: '', fragmentShader: ''});
  // Pass in relevant global state
  const { 

    // for generating OCS
    spectralPeaks,
    activeCones,
    omitBetaBand,
    isMaxBasis,
    wavelengthSampleResolution,

    // for spectra graph
    setConeResponses,
    setWavelengths,

    submitSwitch, 
    wavelengthBounds, 
    sliceDimension,
    sliceVisible,
    setSliceVisible,
    sliceSwitch,
    setSliceSwitch,
    setPositionY
  } = useAppContext();

  // When necessary, load in the OCS
  useEffect(() => {
    const params = new URLSearchParams({
      minWavelength: wavelengthBounds.min.toString(),
      maxWavelength: wavelengthBounds.max.toString(),
      omitBetaBand: omitBetaBand.toString(),
      isMaxBasis: isMaxBasis.toString(),
      wavelengthSampleResolution: wavelengthSampleResolution.toString(),
      peakWavelength1: spectralPeaks.peakWavelength1.toString(),
      peakWavelength2: spectralPeaks.peakWavelength2.toString(),
      peakWavelength3: spectralPeaks.peakWavelength3.toString(),
      peakWavelength4: spectralPeaks.peakWavelength4.toString(),
      isCone1Active: activeCones.isCone1Active.toString(),
      isCone2Active: activeCones.isCone2Active.toString(),
      isCone3Active: activeCones.isCone3Active.toString(),
      isCone4Active: activeCones.isCone4Active.toString()
    });
    console.log("================================================================================")
    console.log(params.toString());
    console.log("================================================================================")

    fetch(`http://localhost:5000/get_ocs_data?${params.toString()}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(data => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.vertices.flat(), 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals.flat(), 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors.flat(), 3));
        geometry.setIndex(data.indices.flat());
        geometry.translate(-0.5, -0.5, -0.5);

        const geometry2 = geometry.clone()
        geometry2.translate(1.5, 0, 0)

        setOcsData({
          geometry,
          vertexShader: data.vertexShader,
          fragmentShader: data.fragmentShader
        });
        

        setOcs2Data({
          geometry: geometry2,
          vertexShader: data.vertexShader,
          fragmentShader: data.fragmentShader
        });

        
        setWavelengths(data.wavelengths.flat())
        setConeResponses({
          coneResponse1: data.s_response.flat(),
          coneResponse2: data.m_response.flat(),
          coneResponse3: data.l_response.flat(),
          coneResponse4: data.q_response.flat(),
        })
      })
      .catch(error => console.error('Error fetching data:', error));
  }, [submitSwitch]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas 
        orthographic 
        camera={{    
            position: [0.43, 0.3, 0.4],
            zoom: 1,
            near: 0.001,
            far: 10000,
            top: 4,
            bottom: -4,
            left: window.innerWidth / window.innerHeight* -4,
            right: window.innerWidth / window.innerHeight * 4
        }} 
        // camera={{ position: [0.43, 0.3, 0.4], fov: 60 }}
        onMouseMove={(e) => {
          // Mouse position -> normalized device coordinates * 2
          const [smallestY, largestY] = [-0.3, 0.3]
          const y = (-(e.clientY / window.innerHeight) * 2 + 1) * 0.7
          setPositionY(Math.min(largestY, Math.max(smallestY, y)))
        }}  
        onPointerDown={() => {
            if (sliceVisible) {
              setSliceVisible(false)
              setSliceSwitch(sliceSwitch + 1) // Trigger update in the slice display
            }
          }
        }
      >
        <UpdateCamera />
        {sliceDimension == 2 && sliceVisible && (
          <MovingYSlice></MovingYSlice>
        )}
        {ocsData && (
          <CustomMesh 
            // key={submitSwitch}
            geometry={ocsData.geometry}
            vertexShader={ocsData.vertexShader}
            fragmentShader={ocsData.fragmentShader}
            center={[0, 0, 0]}
          />
        )}
        {/* {ocs2Data && (
          <CustomMesh 
            // key={submitSwitch}
            geometry={ocs2Data.geometry}
            vertexShader={ocs2Data.vertexShader}
            fragmentShader={ocs2Data.fragmentShader}
            center={[1.5, 0, 0]}
          />
        )} */}
        <OrbitControls target={[0, 0, 0]} />
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
}
