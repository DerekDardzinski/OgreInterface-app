import React, { useRef } from "react";
import { Line } from "@react-three/drei";
import * as mathjs from "mathjs"

function UnitCell({basis, shift}) {
    const ref = useRef()

	const points = [
		shift,  
		mathjs.add(shift, basis[0]),  
		mathjs.add(shift, basis[0], basis[1]),  
		mathjs.add(shift, basis[1]),  
		shift,   
		mathjs.add(shift, basis[2]),  
		mathjs.add(shift, basis[0], basis[2]),  
		mathjs.add(shift, basis[0]),  
		mathjs.add(shift, basis[0], basis[2]),  
		mathjs.add(shift, basis[0], basis[1], basis[2]),  
		mathjs.add(shift, basis[0], basis[1]),  
		mathjs.add(shift, basis[0], basis[1], basis[2]),  
		mathjs.add(shift, basis[1], basis[2]),  
		mathjs.add(shift, basis[1]),  
		mathjs.add(shift, basis[1], basis[2]),  
		mathjs.add(shift, basis[2]),  

	]
	return (
		<mesh ref={ref} >
			<Line points={points} color={"black"} lineWidth={3} />
		</mesh>
	);
}

UnitCell.defaultProps = {
	basis: [[1.0, 0.0, 0.0], [0.0, 1.0, 0.0], [0.0, 0.0, 1.0]],
	shift: [0, 0, 0]
}

export default UnitCell;
