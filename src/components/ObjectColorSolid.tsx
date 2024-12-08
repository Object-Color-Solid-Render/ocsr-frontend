import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from './AppLayout';
import { Button } from '@mantine/core';
import { EntryParams } from './SpectraInputs'; // Ensure EntryParams is imported
import { useDrag } from '@use-gesture/react';

// Define custom shader material with uniforms
const CustomShaderMaterial = shaderMaterial(
  { col: new THREE.Color(0xff00ff) }, // Uniforms
  '',  // Vertex shader placeholder
  ''   // Fragment shader placeholder
);

// Extend to make the material available in JSX
extend({ CustomShaderMaterial });

// Type definition for CustomMesh props
type CustomMeshProps = {
  geometry: THREE.BufferGeometry;
  vertexShader: string;
  fragmentShader: string;
  center: number[];
  rotationMatrix: THREE.Matrix4;
};

// Component to render a custom mesh with shader material
export function CustomMesh({ geometry, vertexShader, fragmentShader, center, rotationMatrix }: CustomMeshProps & { rotationMatrix: THREE.Matrix4 }) {
  const meshRef = useRef<THREE.Mesh>();
  const { clock } = useThree();

  // Create material instance and set shaders
  const material = new CustomShaderMaterial();
  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;

  useFrame(() => {
    if (meshRef.current) {
      // Update uniform color over time
      material.uniforms.col.value.setHSL(clock.getElapsedTime() % 1, 1, 0.5);
      meshRef.current.matrix.copy(rotationMatrix);
    }
  });

  return (
    <group position={center}>
      <mesh ref={meshRef} scale={0.5} geometry={geometry} material={material} />
      <axesHelper args={[1]} />
    </group>
  );
}

// Type definitions for data structures
export type OcsData = {
  geometry: THREE.BufferGeometry;
  vertexShader: string;
  fragmentShader: string;
};

export type EntryParams = {
  wavelengthBounds: { min: number; max: number };
  omitBetaBand: boolean;
  isMaxBasis: boolean;
  wavelengthSampleResolution: number;
  spectralPeaks: {
    peakWavelength1: number;
    peakWavelength2: number;
    peakWavelength3: number;
    peakWavelength4: number;
  };
  activeCones: {
    isCone1Active: boolean;
    isCone2Active: boolean;
    isCone3Active: boolean;
    isCone4Active: boolean;
  };
};

// Component to implement the moving Y slice
function MovingYSlice() {
  const sliceRef = useRef<THREE.Mesh>();
  const { positionY } = useAppContext();

  useFrame(() => {
    if (sliceRef.current) {
      sliceRef.current.position.y = positionY;
    }
  });

  return (
    <mesh ref={sliceRef} position={[0, positionY, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.5, 0.5]} />
      <meshBasicMaterial color="black" wireframe={true} />
    </mesh>
  );
}

// Component to update the camera on resize
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

// Main component to render the Object Color Solid
export default function ObjectColorSolid() {
  const [ocsDataArray, setOcsDataArray] = useState<OcsData[]>([]); // Changed to array to handle multiple geometries
  const [rotationMatrix, setRotationMatrix] = useState(new THREE.Matrix4());
  const [dragging, setDragging] = useState(false);
  const {
    fetchTrigger,
    setFetchTrigger,
    entries,
    setEntries,
    setConeResponses,
    setWavelengths,
    sliceDimension,
    sliceVisible,
    setSliceVisible,
    sliceSwitch,
    setSliceSwitch,
    setPositionY,
  } = useAppContext();

  // Add a default entry on component mount
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

  // Fetch OCS data when necessary
  useEffect(() => {
    if (entries.length === 0 || !fetchTrigger) return;

    const params = new URLSearchParams();

    entries.forEach((entry, index) => {
      params.append(`entries[${index}][minWavelength]`, entry.wavelengthBounds.min.toString());
      params.append(`entries[${index}][maxWavelength]`, entry.wavelengthBounds.max.toString());
      params.append(`entries[${index}][omitBetaBand]`, entry.omitBetaBand.toString());
      params.append(`entries[${index}][isMaxBasis]`, entry.isMaxBasis.toString());
      params.append(`entries[${index}][wavelengthSampleResolution]`, entry.wavelengthSampleResolution.toString());
      params.append(`entries[${index}][peakWavelength1]`, entry.spectralPeaks.peakWavelength1.toString());
      params.append(`entries[${index}][peakWavelength2]`, entry.spectralPeaks.peakWavelength2.toString());
      params.append(`entries[${index}][peakWavelength3]`, entry.spectralPeaks.peakWavelength3.toString());
      params.append(`entries[${index}][peakWavelength4]`, entry.spectralPeaks.peakWavelength4.toString());
      params.append(`entries[${index}][isCone1Active]`, entry.activeCones.isCone1Active.toString());
      params.append(`entries[${index}][isCone2Active]`, entry.activeCones.isCone2Active.toString());
      params.append(`entries[${index}][isCone3Active]`, entry.activeCones.isCone3Active.toString());
      params.append(`entries[${index}][isCone4Active]`, entry.activeCones.isCone4Active.toString());
    });

    fetch(`http://localhost:5050/get_ocs_data?${params.toString()}`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch data');
        return response.json();
      })
      .then(dataArray => {
        const newOcsDataArray = dataArray.map((data: any, index: number) => {
          // Create geometry from fetched data
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.vertices.flat(), 3));
          geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals.flat(), 3));
          geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors.flat(), 3));
          geometry.setIndex(data.indices.flat());

          return {
            geometry,
            vertexShader: data.vertexShader,
            fragmentShader: data.fragmentShader,
          } as OcsData;
        });

        setOcsDataArray(newOcsDataArray);

        // Update wavelengths and cone responses if needed
        // Assuming dataArray[0] has the required data
        setWavelengths(dataArray[0].wavelengths.flat());
        setConeResponses({
          coneResponse1: dataArray[0].s_response.flat(),
          coneResponse2: dataArray[0].m_response.flat(),
          coneResponse3: dataArray[0].l_response.flat(),
          coneResponse4: dataArray[0].q_response.flat(),
        });
      })
      .catch(error => console.error('Error fetching data:', error))
      .finally(() => setFetchTrigger(false));
  }, [fetchTrigger, entries, setConeResponses, setWavelengths, setFetchTrigger]);

  // Handle drag to rotate geometries
  const bind = useDrag(({ movement: [mx, my], memo = rotationMatrix }) => {
    const rotation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(my * 0.01, mx * 0.01, 0));
    setRotationMatrix(rotation.multiply(memo));
    return memo;
  });

  // Calculate grid positions for geometries
  const gridPositions = ocsDataArray.map((_, index) => {
    const cols = Math.ceil(Math.sqrt(ocsDataArray.length));
    const rows = Math.ceil(ocsDataArray.length / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    return [(col - (cols - 1) / 2) * 1.5, (row - (rows - 1) / 2) * 1.5, 0];
  });

  return (
    <div {...bind()} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Button to update the entry parameters */}
      {/* Canvas to render the 3D scene */}
      <Canvas
        orthographic
        camera={{
          position: [2.15, 1.5, 2.0],
          zoom: 1,
          near: 0.001,
          far: 10000,
          top: 4,
          bottom: -4,
          left: window.innerWidth / window.innerHeight * -4,
          right: window.innerWidth / window.innerHeight * 4,
        }}
        onMouseMove={e => {
          // Update the Y position of the slice based on mouse movement
          const [smallestY, largestY] = [-0.3, 0.3];
          const y = (-(e.clientY / window.innerHeight) * 2 + 1) * 0.7;
          setPositionY(Math.min(largestY, Math.max(smallestY, y)));
        }}
        onPointerDown={() => {
          // Toggle slice visibility on pointer down
          if (sliceVisible) {
            setSliceVisible(false);
            setSliceSwitch(sliceSwitch + 1);
          }
        }}
      >
        <UpdateCamera />
        {sliceDimension === 2 && sliceVisible && <MovingYSlice />}
        {ocsDataArray.map((ocsData, index) => (
          <CustomMesh
            key={index}
            geometry={ocsData.geometry}
            vertexShader={ocsData.vertexShader}
            fragmentShader={ocsData.fragmentShader}
            center={gridPositions[index]} // Use grid positions
            rotationMatrix={rotationMatrix}
          />
        ))}
        <OrbitControls target={[0, 0, 0]} />
        <axesHelper args={[5]} />
      </Canvas>
    </div>
  );
}
