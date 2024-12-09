import { Stack, Button, Flex} from "@mantine/core";
import { useEffect, useState } from "react";
import DropdownContent from "../Dropdown/DropdownContent";
import DropdownButton from "../Dropdown/DropdownButton";
import { useAppContext } from "../AppLayout";
import * as THREE from 'three';
import { CustomMesh, OcsData, getGridPositions, UpdateCamera } from "../ObjectColorSolid";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { Geometry } from "tabler-icons-react";

const boxStyle = {
    width: 250,
    height: 250,
    margin: 'auto'
};

export default function Slice() {
    const [open, setOpen] = useState(false);
    const [sliceDataArray, setSliceDataArray] = useState<OcsData[]>([]);
    const { sliceVisible, setSliceVisible, setSliceDimension, slicePlane, sliceSwitch, entries, fetchTrigger } = useAppContext()

    const [dimensions, setDimensions] = useState({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    
    useEffect(() => {
    const handleResize = () => {
        setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
        });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
    }, []);
    
    const aspect = dimensions.width / dimensions.height;

    useEffect(() => {
        // Skip the first initial render 
        console.log(fetchTrigger)
        if (sliceSwitch > 0) {   
            if (entries.length === 0) return; 
            const params = new URLSearchParams({
                a: slicePlane.a.toString(),
                b: slicePlane.b.toString(),
                c: slicePlane.c.toString(),
                d: slicePlane.d.toString(),
                num_ocs: entries.length.toString()
            });

            console.log(params.toString())   
            fetch(`http://localhost:5050/compute_ocs_slice?${params.toString()}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch slice data');
                    return response.json();
                })
                .then(dataArray => {
                    const newSliceDataArray = []
                    
                    dataArray.forEach((data: any, index: number) => {
                        const geometry = new THREE.BufferGeometry();
                        geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.vertices.flat(), 3));
                        // geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals.flat(), 3));
                        geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors.flat(), 3));
                        geometry.setIndex(data.indices.flat());
                        //geometry.translate(0, 1, 0);
                        newSliceDataArray.push({
                            geometry,
                            vertexShader: data.vertexShader,
                            fragmentShader: data.fragmentShader
                        });
                    })     

                    setSliceDataArray(newSliceDataArray)  
                    console.log(newSliceDataArray)  
                    setOpen(true)      
                })
                .catch(error => console.error('Error fetching data:', error));
            }
    }, [sliceSwitch])

    const LookAtTarget = () => {
        const { camera } = useThree();
      
        useEffect(() => {
          camera.lookAt(0, 0, 0); // Look at the origin
        }, [camera]);
      
        return null;
    };

    const gridPositions = getGridPositions(sliceDataArray)
    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "3%" }}>
            <Button
                        variant="gray"
                        onClick={() => {
                            setSliceDimension(2)
                            setSliceVisible(!sliceVisible)
                        }}
                        style={{width: "100px"}}
                    >
                        2D Slice
            </Button>
            <div style={{ backgroundColor: '#c6c7cc'}}> {/* Needed to wrap around the canvas to provide a specified width/height */}
                {!!sliceDataArray && 
                <Canvas orthographic
                camera={{
                position: [0, 0, 1],
                zoom: 0.5,
                near: 0.001,
                far: 10000,
                top: 8,
                bottom: -8,
                left: window.innerWidth / window.innerHeight * -8,
                right: window.innerWidth / window.innerHeight * 8,
                }}
                >
                    <LookAtTarget />
                    <UpdateCamera />
                    {sliceDataArray.map((sliceData, index) => {
                        /*TODO: Fix the lookat, or center the mesh...*/
                        return <CustomMesh
                            key={index} // FIXME: shouldn't generally be an index
                            geometry={sliceData.geometry}
                            vertexShader={sliceData.vertexShader}
                            fragmentShader={sliceData.fragmentShader}
                            rotationMatrix={new THREE.Matrix4()}
                            scale={5}
                            center={gridPositions[index]}
                            index={index}
                            isSlice={true}
                        /> 
                    })}
                    <OrbitControls 
                        target={[0, 0, 0]} 
                         enableRotate={false} // Disable rotation
                        enableZoom={true}    // Enable zoom
                        enablePan={true}     // Enable pan
                        zoomSpeed={1.0}
                        panSpeed={1.0}/>
                </Canvas>
                }   
            </div>
        </div>
    )
}
