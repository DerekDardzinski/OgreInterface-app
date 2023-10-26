import React, { useRef } from "react";
import { Line } from "@react-three/drei";

function UnitCell(props) {
    const ref = useRef()
	return (
		<mesh ref={ref} >
			<Line points={props.points} color={"black"} lineWidth={3} />
		</mesh>
	);
}

export default UnitCell;
