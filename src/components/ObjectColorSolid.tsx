import React, { useRef, useEffect, useState } from 'react';
import { Canvas, useFrame, extend, useThree } from '@react-three/fiber';
import { OrbitControls, shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useAppContext } from './AppLayout';
import { Loader, Modal } from '@mantine/core'; // Import Loader and Modal components from Mantine
import { OCSData } from './OCSContext';
import { useDrag } from '@use-gesture/react';
import { Vector3 } from 'three';

// Define custom shader material with uniforms
const CustomShaderMaterial = shaderMaterial(
  { col: new THREE.Color(0xff00ff) }, // Uniforms
  '',  // Vertex shader placeholder
  '',   // Fragment shader placeholder
);

// Extend to make the material available in JSX
extend({ CustomShaderMaterial });

// Type definition for CustomMesh props
type CustomMeshProps = {
  geometry: THREE.BufferGeometry;
  vertexShader: string;
  fragmentShader: string;
  center: Vector3;
  rotationMatrix: THREE.Matrix4;
  index: number;
  isSlice?: boolean;
};

// Component to render a custom mesh with shader material
export function CustomMesh({ geometry, vertexShader, fragmentShader, center, rotationMatrix, index, isSlice=false}: CustomMeshProps & { rotationMatrix: THREE.Matrix4 }) {
  const meshRef = useRef<THREE.Mesh>();
  const { setSelectedEntryIndex, sliceDimension, sliceVisible } = useAppContext();

  // Create material instance and set shaders
  const material = new CustomShaderMaterial();
  material.vertexShader = vertexShader;
  material.fragmentShader = fragmentShader;
  material.side = THREE.DoubleSide;

  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.matrixAutoUpdate = false;
      meshRef.current.matrix.copy(rotationMatrix);
      meshRef.current.updateMatrixWorld(true);
    }
  }, [rotationMatrix]);

  const _basePosition = new THREE.Vector3();
  const baseQuaternion = new THREE.Quaternion();
  const _baseScale = new THREE.Vector3();

  rotationMatrix.decompose(_basePosition, baseQuaternion, _baseScale);

  return (
    <group position={center}>
      <mesh
        ref={meshRef}
        scale={1}
        geometry={geometry}
        material={material}
        onClick={(event) => {
          event.stopPropagation();
          setSelectedEntryIndex(index);
        }}
      />
      {!isSlice && sliceDimension === 2 && sliceVisible && <MovingPlane baseQuaternion={baseQuaternion}></MovingPlane>}
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
  pigmentTemplateFunction: string;
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
  entryName: string; // Add entryName property
};

function MovingPlane( { baseQuaternion }: { baseQuaternion: THREE.Quaternion }) {
  const planeRef = useRef<THREE.Mesh | null>(null);
  const normalRef = useRef(new THREE.Vector3(-1, 1, 0).normalize()); // Initial normal vector
  const { slicePlane, setSlicePlane } = useAppContext()

  // Mouse position (normalized to -1 to 1 range)
  const mousePosition = useRef({ x: 0, y: 0 });

  // Listen for mouse movement and store normalized coordinates
  const handleMouseMove = (event) => {
    mousePosition.current.x = (event.clientX / window.innerWidth) * 2 - 1; // Normalize X
    mousePosition.current.y = -(event.clientY / window.innerHeight) * 2 + 1; // Normalize Y
  };

  React.useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useFrame(() => {
    if (planeRef.current) {
      const mouse = mousePosition.current;

      // Calculate the new rotation axis and angle based on mouse movement
      const rotationAxis = new THREE.Vector3(1, 1, 1).normalize(); // Axis of rotation
      const angle = mouse.x * Math.PI * 2; // Map mouse X to rotation angle (adjust factor for sensitivity)

      // Create a quaternion for rotation around the axis. to apply to the current normal
      const rotationQuaternion = new THREE.Quaternion();
      rotationQuaternion.setFromAxisAngle(rotationAxis, angle);

      // Rotate the normal vector
      const rotatedNormal = normalRef.current.clone().applyQuaternion(rotationQuaternion).normalize();

      // Align the plane's default normal (0, 0, 1) to the rotated normal
      const dynamicQuaternion = new THREE.Quaternion();
      dynamicQuaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), rotatedNormal);
      setSlicePlane({
        a: rotatedNormal.x,
        b: rotatedNormal.y,
        c: rotatedNormal.z,
        d: slicePlane.d
      })

      const combinedQuaternion = baseQuaternion.clone().multiply(dynamicQuaternion)
      
      planeRef.current.quaternion.copy(combinedQuaternion);
    }
  });

  return (
    <mesh ref={planeRef} position={[0, 0, 0]}>
      <planeGeometry args={[1.7, 1.7]} />
      <meshStandardMaterial
        color="gray"
        transparent={true}
        opacity={0.5}
        side={THREE.DoubleSide} // Render both sides
      />
    </mesh>
  );
}

// Component to update the camera on resize
export function UpdateCamera() {
  const { camera, size } = useThree();
  const orthoCamera = camera as THREE.OrthographicCamera;
  useEffect(() => {
    const updateCamera = () => {
      const aspect = size.width / size.height;
      orthoCamera.left = aspect * -1;
      orthoCamera.right = aspect * 1;
      orthoCamera.top = 1;
      orthoCamera.bottom = -1;
      orthoCamera.updateProjectionMatrix();
    };
    updateCamera();
  }, [camera, size]);

  return null;
}

// Calculate grid positions for geometries
export const getGridPositions = (dataArray: OcsData[], spacing: number = 1.8) => { 
  return dataArray.map((_, index) => {
    const cols = Math.ceil(Math.sqrt(dataArray.length));
    const rows = Math.ceil(dataArray.length / cols);
    const col = index % cols;
    const row = Math.floor(index / cols);
    return new Vector3((col - (cols - 1) / 2) * spacing, (row - (rows - 1) / 2) * spacing, 0);
  });
}

// Main component to render the Object Color Solid
export default function ObjectColorSolid() {
  const [rotationMatrix, setRotationMatrix] = useState(new THREE.Matrix4());
  const [loading, setLoading] = useState(false); // State to manage loading
  const [error, setError] = useState<string | null>(null); // State to manage error messages
  const [errorDetails, setErrorDetails] = useState<string | null>(null); // State to manage detailed error messages
  const {
    fetchTrigger,
    setFetchTrigger,
    entries,
    setEntries,
    sliceVisible,
    setSliceVisible,
    sliceSwitch,
    setSliceSwitch,
    ocsDataArray,     // Get ocsDataArray from context
    setOcsDataArray,  // Get setOcsDataArray from context
  } = useAppContext();

  // Add a default entry on component mount
  useEffect(() => {
    const defaultEntry = {
      selectedSpecies: "Human (Trichromat)",
      entryName: "Human (Trichromat)",
      wavelengthBounds: { min: 390, max: 700 },
      omitBetaBand: true,
      isMaxBasis: false,
      pigmentTemplateFunction: 'Lamb',
      wavelengthSampleResolution: 20,
      spectralPeaks: {
        peakWavelength1: 421,
        peakWavelength2: 543,
        peakWavelength3: 560,
        peakWavelength4: 566,
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

    setLoading(true); // Set loading to true when fetching starts
    setError(null); // Reset error state
    setErrorDetails(null); // Reset detailed error state

    const params = new URLSearchParams();

    entries.forEach((entry, index) => {
      params.append(`entries[${index}][minWavelength]`, entry.wavelengthBounds.min.toString());
      params.append(`entries[${index}][maxWavelength]`, entry.wavelengthBounds.max.toString());
      params.append(`entries[${index}][omitBetaBand]`, entry.omitBetaBand.toString());
      params.append(`entries[${index}][isMaxBasis]`, entry.isMaxBasis.toString());
      params.append(`entries[${index}][pigmentTemplateFunction]`, entry.pigmentTemplateFunction.toString());
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
        if (!response.ok) throw new Error("GG");
        return response.json();
      })
      .then(dataArray => {
        const newOcsDataArray = dataArray.map((data: any) => {
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
            wavelengths: data.wavelengths.flat(),
            coneResponses: {
              coneResponse1: data.s_response.flat(),
              coneResponse2: data.m_response.flat(),
              coneResponse3: data.l_response.flat(),
              coneResponse4: data.q_response.flat(),
            },
          } as OCSData;
        });

        setOcsDataArray(newOcsDataArray); // Use context's setOcsDataArray
      })
      .catch(error => {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data from the server. Please try again later.');
        setErrorDetails(error.message); // Set detailed error message
      })
      .finally(() => {
        setFetchTrigger(false);
        setLoading(false); // Set loading to false when fetching ends
      });
  }, [fetchTrigger, entries, setFetchTrigger, setOcsDataArray]);

  // Handle drag to rotate geometries
  const bind = useDrag(({ movement: [mx, my], memo = rotationMatrix, dragging }) => {
    if (dragging) {
      const rotation = new THREE.Matrix4().makeRotationFromEuler(new THREE.Euler(my * 0.01, mx * 0.01, 0));
      setRotationMatrix(rotation.multiply(memo));
    }
    return memo;
  });

  const gridPositions = getGridPositions(ocsDataArray)
  return (
    // @ts-ignore
    <div { ...bind() } style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          zIndex: 1000 // Ensure the loading UI is on top
        }}>
          <Loader size="lg" color="gray" />
          <p style={{ marginTop: '8px', color: '#555', fontSize: '14px' }}>Loading...</p>
        </div>
      )}
      <Modal
        opened={!!error}
        onClose={() => setError(null)}
        title="Error"
      >
        <p>{error}</p>
        {errorDetails && <pre>{errorDetails}</pre>}
      </Modal>
      {/* Canvas to render the 3D scene */}
      <Canvas
        orthographic
        camera={{
          position: [0, 0, 3.0],
          zoom: 0.5,
          near: 0.001,
          far: 10000,
          top: 8,
          bottom: -8,
          left: window.innerWidth / window.innerHeight * -8,
          right: window.innerWidth / window.innerHeight * 8,
        }}
        onPointerDown={() => {
          if (sliceVisible) {
            setSliceVisible(false)
            setSliceSwitch(sliceSwitch + 1) // Trigger update in the slice display
          }
        }}
      >
        <UpdateCamera />
        {ocsDataArray.map((ocsData, index) => (
          <CustomMesh
            key={index} // FIXME: shouldn't generally be an index
            index={index} 
            geometry={ocsData.geometry}
            vertexShader={ocsData.vertexShader}
            fragmentShader={ocsData.fragmentShader}
            center={gridPositions[index]} // Use grid positions
            rotationMatrix={rotationMatrix}
          />
        ))}
        <OrbitControls 
                        target={[0, 0, 0]} 
                         enableRotate={false} // Disable rotation
                        enableZoom={true}    // Enable zoom
                        enablePan={true}     // Enable pan
                        zoomSpeed={1.0}
                        panSpeed={1.0}/>
      </Canvas>
    </div>
  );
}
