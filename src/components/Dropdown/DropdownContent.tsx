import { Paper, Collapse, ActionIcon } from "@mantine/core";
import React, { Dispatch, SetStateAction } from "react";
import { IconX } from "@tabler/icons-react";

type DropdownContentProps = {
    children: React.ReactNode,
    open: boolean,
    setOpen?: Dispatch<SetStateAction<boolean>>,
    width?: number,
    height?: number,
    xButton?: boolean,
    opacity?: number,
    isWhite?: boolean,
}

const paperStyle = (open: boolean, width: number, isWhite: boolean) => {
    return { 
        width: open ? width : 0, // Collapses the div
        // height: open ? height : 0,
        borderRadius: 10, // Full circular shape
        zIndex: 999,
        transition: 'width 0.7s ease',
        backgroundColor: isWhite? "rgba(255, 255, 255, 1)" : "rgba(0, 0, 0, 0.2)",
        padding: '5%',
    }
}

export default function DropdownContent({ children, open, setOpen=() => {}, width=200, xButton=false, isWhite=false } : DropdownContentProps) {
    return <>
        <Paper
            shadow="xl"
            style={paperStyle(open, width, isWhite)}
        >
            <Collapse 
                in={open}
            >
                { xButton && 
                    <ActionIcon
                        onClick={()=> { setOpen(false) }}
                        style={{
                            backgroundColor: "rgba(255, 255, 255, 1)",
                            color: "rgba(0, 0, 0, 1)",
                        }}
                        >
                            <IconX size={20} stroke={1.4}></IconX>
                    </ActionIcon> 
                }
                {children}
            </Collapse>
        </Paper>
        </>
}