import { Stack, Button} from "@mantine/core";
import { useEffect, useState } from "react";
import DropdownContent from "../Dropdown/DropdownContent";
import DropdownButton from "../Dropdown/DropdownButton";
import { useAppContext } from "../AppLayout";
import * as THREE from 'three';
import { CustomMesh, OcsData } from "../ObjectColorSolid";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const boxStyle = {
    width: 250,
    height: 250,
    margin: 'auto'
};

export default function Slice() {
    const [open, setOpen] = useState(false);
    const [sliceData, setSliceData] = useState<OcsData>({geometry: new THREE.BufferGeometry(), vertexShader: '', fragmentShader: ''});
    const { slicePlane, sliceSwitch } = useAppContext()

    useEffect(() => {
        // Skip the first initial render 
        console.log(sliceSwitch)
        if (sliceSwitch > 0) { 
            const params = new URLSearchParams({
                a: slicePlane.a.toString(),
                b: slicePlane.b.toString(),
                c: slicePlane.c.toString(),
                d: slicePlane.d.toString(),

            });
            console.log(params.toString())
            
            fetch(`http://localhost:5000/compute_ocs_slice?${params.toString()}`)
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch slice data');
                    return response.json();
                })
                .then(data => {
                    const geometry = new THREE.BufferGeometry();
                    geometry.setAttribute('position', new THREE.Float32BufferAttribute(data.vertices.flat(), 3));
                    // geometry.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals.flat(), 3));
                    geometry.setAttribute('color', new THREE.Float32BufferAttribute(data.colors.flat(), 3));
                    geometry.setIndex(data.indices.flat());
                    geometry.translate(-0.5, -0.5, -0.5);
                    
                    console.log(geometry.getAttribute('position'))
                    console.log(geometry.index)
                    setSliceData({
                        geometry,
                        vertexShader: data.vertexShader,
                        fragmentShader: data.fragmentShader
                    });
                })
                .catch(error => console.error('Error fetching data:', error));
            }
    }, [sliceSwitch])

    return (
        <div>
            <DropdownButton open={open} setOpen={setOpen} leftDropdown={true}></DropdownButton>
            <DropdownContent open={open} width={300}>
                <div style={boxStyle}> {/* Needed to wrap around the canvas to provide a specified width/height */}
                    { sliceData && (
                        /*TODO: Fix the lookat, or center the mesh...*/
                        <Canvas camera={{ position: [0, 0, 1] }}>
                            {/* <mesh geometry={sliceData.geometry}>
                                <meshBasicMaterial color="green" wireframe={false} />
                            </mesh> */}
                            <CustomMesh
                                geometry={sliceData.geometry}
                                vertexShader={sliceData.vertexShader}
                                fragmentShader={sliceData.fragmentShader}
                                scale={5}
                            /> 
                            {/* <mesh>
                                <boxGeometry></boxGeometry>
                                <meshBasicMaterial></meshBasicMaterial>
                            </mesh> */}
                            <OrbitControls target={[0, 0, 0]} />
                        </Canvas>
                    )}
                </div>
            </DropdownContent>
        </div>
    )
}