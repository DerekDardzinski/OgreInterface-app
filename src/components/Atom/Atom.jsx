import React, { useRef } from "react";
import { Sphere } from "@react-three/drei";
import * as THREE from "three";

function Atom(props) {
    const ref = useRef()
	return (
		<mesh ref={ref} position={props.position}>
			<Sphere args={[props.radius, 32, 32]}>
				<meshStandardMaterial
					attach='material'
					color={props.color}
					depthWrite={true}
					side={THREE.DoubleSide}
					flatShading={false}
					roughness={0.9}
					metalness={0.0}
					reflectivity={0.0}
					clearcoat={0.0}
					opacity={1.0}
					transparent={false}
				/>
			</Sphere>
		</mesh>
	);
}

Atom.defaultProps = {
	position: [0.0, 0.0, 0.0],
	radius: 1.0,
	color: "#000000",
};

export default Atom;
