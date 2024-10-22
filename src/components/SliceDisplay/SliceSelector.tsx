import { Stack, Button} from "@mantine/core";
import { useState } from "react";
import DropdownContent from "../Dropdown/DropdownContent";
import DropdownButton from "../Dropdown/DropdownButton";
import { useAppContext } from "../AppLayout";

const boxStyle = {

};

export default function SliceSelector() {
    const [open, setOpen] = useState(false);
    const { sliceDimension, setSliceDimension, sliceVisible, setSliceVisible } = useAppContext();

    return (
        <div>
            <DropdownButton open={open} setOpen={setOpen} leftDropdown={true}></DropdownButton>
            <DropdownContent open={open} width={150}>
                <Stack gap="m">
                    <Button
                        variant="white"
                        onClick={() => {
                            setSliceDimension(1)
                            setSliceVisible(true)
                        }}
                        style={boxStyle}
                    >
                        1D Ray
                    </Button>
                    <Button
                        variant="white"
                        onClick={() => {
                            setSliceDimension(2)
                            setSliceVisible(true)
                        }}
                        style={boxStyle}
                    >
                        2D Slice
                    </Button>
                    <Button
                        variant="white"
                        onClick={() => {
                            setSliceDimension(3)
                            setSliceVisible(true)
                        }}
                        style={boxStyle}
                    >
                        3D Chunk
                    </Button>

                    <Button 
                        variant="white"
                        onClick={() => {
                            setSliceVisible(false)
                        }}>
                        Unselect
                    </Button>
                </Stack>
            </DropdownContent>
        </div>
    )
}