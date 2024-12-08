import { Stack, Button} from "@mantine/core";
import { useEffect, useState } from "react";
import DropdownContent from "../Dropdown/DropdownContent";
import DropdownButton from "../Dropdown/DropdownButton";
import { useAppContext } from "../AppLayout";
import * as THREE from 'three';
import { CustomMesh, OcsData, getGridPositions, UpdateCamera } from "../ObjectColorSolid";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

const boxStyle = {
    width: 250,
    height: 250,
    margin: 'auto'
};

export default function Slice() {
    const [open, setOpen] = useState(false);
    const [sliceDataArray, setSliceDataArray] = useState<OcsData[]>([]);
    const { slicePlane, sliceSwitch, entries, fetchTrigger } = useAppContext()

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
                        geometry.translate(-0.5, -0.5, -0.5);

                        newSliceDataArray.push({
                            geometry,
                            vertexShader: data.vertexShader,
                            fragmentShader: data.fragmentShader
                        });
                    })     
                    setSliceDataArray(newSliceDataArray)  
                    console.log(newSliceDataArray)        
                })
                .catch(error => console.error('Error fetching data:', error));
            }
    }, [sliceSwitch])

    const gridPositions = getGridPositions(sliceDataArray)
    return (
        <div>
            <DropdownButton open={open} setOpen={setOpen} leftDropdown={true}></DropdownButton>
            <DropdownContent open={open} width={300}>
                <div style={boxStyle}> {/* Needed to wrap around the canvas to provide a specified width/height */}
                    {!!sliceDataArray && 
                    <Canvas orthographic
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
                    >
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
                            /> 
                        })}
                        <OrbitControls target={[0, 0, 0]} />
                    </Canvas>
                    }
                        
                </div>
            </DropdownContent>
        </div>
    )
}
