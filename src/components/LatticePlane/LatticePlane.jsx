import * as THREE from "three";
import { Line, Plane } from "@react-three/drei";
import * as mathjs from "mathjs";
import { useRef } from "react";
import UnitCell from "../UnitCell/UnitCell";
import uuid from "react-uuid";

function LatticePlane({
	basis,
	recipBasis,
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


	// const recipBasis = mathjs.transpose(mathjs.inv(basis));
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
	const aVec = new THREE.Vector3().fromArray(basis[0])
	const bVec = new THREE.Vector3().fromArray(basis[1])
	const cVec = new THREE.Vector3().fromArray(basis[2])

	const centerShiftVec = new THREE.Vector3().fromArray(centerShift)
	const aCenterShift = planeNorm100.dot(centerShiftVec);
	const bCenterShift = planeNorm010.dot(centerShiftVec);
	const cCenterShift = planeNorm001.dot(centerShiftVec);
	const aSpacing = planeNorm100.dot(aVec);
	const bSpacing = planeNorm010.dot(bVec);
	const cSpacing = planeNorm001.dot(cVec);

	// console.log("SPACINGS = ", aSpacing, bSpacing, cSpacing)


	// const normMillerIndex = new THREE.Vector3().fromArray(millerIndex).normalize().toArray()

	const pad = 0.05

	const clippingPlanes = [
		new THREE.Plane(planeNorm100,  -((aSpacing * cellBounds.a[0]) + aCenterShift) + pad),
		new THREE.Plane(planeNorm010,  -((bSpacing * cellBounds.b[0]) + bCenterShift) + pad),
		new THREE.Plane(planeNorm001,  -((cSpacing * cellBounds.c[0]) + cCenterShift) + pad),
		new THREE.Plane(planeNorm100.clone().multiplyScalar(-1), ((aSpacing * cellBounds.a[1]) + aCenterShift) + pad),
		new THREE.Plane(planeNorm010.clone().multiplyScalar(-1), ((bSpacing * cellBounds.b[1]) + bCenterShift) + pad),
		new THREE.Plane(planeNorm001.clone().multiplyScalar(-1), ((cSpacing * cellBounds.c[1]) + cCenterShift) + pad),
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
					<meshPhysicalMaterial
						attach='material'
						color={color}
						opacity={alpha}
						transparent={true}
						depthWrite={true}
						side={THREE.DoubleSide}
						flatShading={true}
						roughness={1.0}
						metalness={0.0}
						// reflectivity={0.5}
						// clearcoat={0.5}
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
