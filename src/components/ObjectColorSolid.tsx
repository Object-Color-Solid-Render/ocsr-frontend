import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from './AppLayout';
import { Button } from '@mantine/core';

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
    }
  });

  return <mesh ref={meshRef} scale={0.5} geometry={geometry} material={material} />;
}

export type OcsData = {
  geometry: THREE.BufferGeometry,
  vertexShader: String,
  fragmentShader: String,
}

export type EntryParams = {
  wavelengthBounds: { min: number, max: number },
  omitBetaBand: boolean,
  isMaxBasis: boolean,
  wavelengthSampleResolution: number,
  spectralPeaks: {
    peakWavelength1: number,
    peakWavelength2: number,
    peakWavelength3: number,
    peakWavelength4: number,
  },
  activeCones: {
    isCone1Active: boolean,
    isCone2Active: boolean,
    isCone3Active: boolean,
    isCone4Active: boolean,
  }
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
  const { fetchTrigger, setFetchTrigger, entries, setEntries } = useAppContext();
  // Pass in relevant global state
  const { 
    setConeResponses,
    setWavelengths,
    sliceDimension,
    sliceVisible,
    setSliceVisible,
    sliceSwitch,
    setSliceSwitch,
    setPositionY
  } = useAppContext();

  // Add a default entry on start
  useEffect(() => {
    const defaultEntry = {
      wavelengthBounds: { min: 390, max: 700 },
      omitBetaBand: true,
      isMaxBasis: false,
      wavelengthSampleResolution: 20,
      spectralPeaks: {
        peakWavelength1: 455,
        peakWavelength2: 543,
        peakWavelength3: 566,
        peakWavelength4: 560,
      },
      activeCones: {
        isCone1Active: true,
        isCone2Active: true,
        isCone3Active: true,
        isCone4Active: false,
      }
    };
    setEntries([defaultEntry]);
    setFetchTrigger(true);
  }, [setFetchTrigger, setEntries]);

  // When necessary, load in the OCS
  useEffect(() => {
    if (entries.length === 0 || !fetchTrigger) return;
    
    console.log("fetching OCS data")

    const firstEntry = entries[0];
    const params = new URLSearchParams({
      minWavelength: firstEntry.wavelengthBounds.min.toString(),
      maxWavelength: firstEntry.wavelengthBounds.max.toString(),
      omitBetaBand: firstEntry.omitBetaBand.toString(),
      isMaxBasis: firstEntry.isMaxBasis.toString(),
      wavelengthSampleResolution: firstEntry.wavelengthSampleResolution.toString(),
      peakWavelength1: firstEntry.spectralPeaks.peakWavelength1.toString(),
      peakWavelength2: firstEntry.spectralPeaks.peakWavelength2.toString(),
      peakWavelength3: firstEntry.spectralPeaks.peakWavelength3.toString(),
      peakWavelength4: firstEntry.spectralPeaks.peakWavelength4.toString(),
      isCone1Active: firstEntry.activeCones.isCone1Active.toString(),
      isCone2Active: firstEntry.activeCones.isCone2Active.toString(),
      isCone3Active: firstEntry.activeCones.isCone3Active.toString(),
      isCone4Active: firstEntry.activeCones.isCone4Active.toString()
    });
    
    console.log("fetching OCS data with params", params.toString())

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
      .catch(error => console.error('Error fetching data:', error))
      .finally(() => setFetchTrigger(false));
  }, [fetchTrigger, entries]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Button onClick={() => {
        setEntries((prevEntries) => {
          const newEntries = [...prevEntries];
          newEntries[0] = {
            ...newEntries[0],
            wavelengthBounds: { min: 400, max: 700 },
            spectralPeaks: {
              peakWavelength1: 460,
              peakWavelength2: 550,
              peakWavelength3: 580,
              peakWavelength4: 600,
            },
          };
          return newEntries;
        });
        setFetchTrigger(true);
      }}>Update Entry</Button>
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
        onMouseMove={(e) => {
          const [smallestY, largestY] = [-0.3, 0.3]
          const y = (-(e.clientY / window.innerHeight) * 2 + 1) * 0.7
          setPositionY(Math.min(largestY, Math.max(smallestY, y)))
        }}  
        onPointerDown={() => {
            if (sliceVisible) {
              setSliceVisible(false)
              setSliceSwitch(sliceSwitch + 1)
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
            geometry={ocsData.geometry}
            vertexShader={ocsData.vertexShader}
            fragmentShader={ocsData.fragmentShader}
            center={[0, 0, 0]}
          />
        )}
        <OrbitControls target={[0, 0, 0]} />
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
}
