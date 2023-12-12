import * as THREE from "three";
import { Line, Plane } from "@react-three/drei";
import * as mathjs from "mathjs";
import { useRef } from "react";
import UnitCell from "../UnitCell/UnitCell";
import uuid from "react-uuid";

function LatticePlane({
	basis,
	millerIndex,
	color,
	alpha,
	shiftAlongNorm,
	cellBounds,
	centerShift,
}) {
	// const add_vecs = (vec1, vec2) => new THREE.Vector3().addVectors(vec1, vec2);
	const getNorm = (millerIndex, recipBasis) =>  new THREE.Vector3().fromArray(
		mathjs.add(
			mathjs.multiply(recipBasis[0], millerIndex[0]),
			mathjs.multiply(recipBasis[1], millerIndex[1]),
			mathjs.multiply(recipBasis[2], millerIndex[2]),
		)
	).normalize()
	// add_vecs(
	// 	add_vecs(
	// 		aStar.clone().multiplyScalar(h),
	// 		bStar.clone().multiplyScalar(k)
	// 	),
	// 	cStar.clone().multiplyScalar(l)
	// )
	// 	.normalize()


	const recipBasis = mathjs.transpose(mathjs.inv(basis));
	const recipBasisMatrix = mathjs.matrix(recipBasis);
	const recipMetricTensor = mathjs.multiply(
		recipBasisMatrix,
		mathjs.transpose(recipBasisMatrix)
	);
	const hkl = mathjs.matrix([millerIndex]);
	const dhkl =
		1 /
		mathjs.sqrt(
			mathjs
				.multiply(
					hkl,
					mathjs.multiply(recipMetricTensor, mathjs.transpose(hkl))
				)
				.subset(mathjs.index(0, 0))
		);

	const planeNormHKL = getNorm(millerIndex, recipBasis);

	const planeNorm100 = new THREE.Vector3().fromArray(recipBasis[0]).normalize()
	const planeNorm010 = new THREE.Vector3().fromArray(recipBasis[1]).normalize()
	const planeNorm001 = new THREE.Vector3().fromArray(recipBasis[2]).normalize()
	const aDist = new THREE.Vector3().fromArray(basis[0]).length()
	const bDist = new THREE.Vector3().fromArray(basis[1]).length()
	const cDist = new THREE.Vector3().fromArray(basis[2]).length()
	const centerShiftVec = new THREE.Vector3().fromArray(centerShift)
	const aShift = planeNorm100.dot(centerShiftVec);
	const bShift = planeNorm010.dot(centerShiftVec);
	const cShift = planeNorm001.dot(centerShiftVec);

	// const normMillerIndex = new THREE.Vector3().fromArray(millerIndex).normalize().toArray()

	const pad = 0.1

	const clippingPlanes = [
		new THREE.Plane(planeNorm100, ((-aDist * cellBounds.a[0]) - aShift) + pad),
		new THREE.Plane(planeNorm100.clone().multiplyScalar(-1), ((aDist * cellBounds.a[1]) + aShift) + pad),
		new THREE.Plane(planeNorm010, ((-bDist * cellBounds.b[0]) - aShift) + pad),
		new THREE.Plane(planeNorm010.clone().multiplyScalar(-1), ((bDist * cellBounds.b[1]) + bShift) + pad),
		new THREE.Plane(planeNorm001, ((-cDist * cellBounds.c[0]) - cShift) + pad),
		new THREE.Plane(planeNorm001.clone().multiplyScalar(-1), ((cDist * cellBounds.c[1]) + cShift) + pad),
	]

	let initOrientation = new THREE.Vector3().fromArray([0.0, 0.0, 1.0]);
	let quat = new THREE.Quaternion().setFromUnitVectors(
		initOrientation,
		planeNormHKL
	);

	const normShift = planeNormHKL.clone().multiplyScalar(dhkl * (1 + shiftAlongNorm));

	return (
		<group position={normShift}>
			<group quaternion={quat}>
				{/* Lattice plane being big is causing issues */}
				<Plane args={[5000, 5000, 10, 10]}> 
					<meshStandardMaterial
						attach='material'
						color={color}
						opacity={alpha}
						transparent={true}
						depthWrite={true}
						side={THREE.DoubleSide}
						flatShading={true}
						roughness={0.9}
						metalness={0.5}
						reflectivity={0.5}
						clearcoat={0.5}
						clippingPlanes={clippingPlanes}
					/>
				</Plane>
			</group>
		</group>
	);
}

LatticePlane.defaultProps = {
	lineWidth: 2,
	shiftAlongNorm: 0.0,
	shift: [0.0, 0.0, 0.0],
	color: "grey",
	alpha: 0.3,
};

export default LatticePlane;
