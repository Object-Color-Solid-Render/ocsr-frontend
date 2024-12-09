import { Stack, Button, Flex} from "@mantine/core";
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
        <Flex
        align="flex-start" 
        direction="row" 
        gap = 'md'
        >
            <DropdownButton open={open} setOpen={setOpen} leftDropdown={true}></DropdownButton>
        </Flex>
    )
}