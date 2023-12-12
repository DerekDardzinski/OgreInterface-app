import * as THREE from "three";
import { Line } from "@react-three/drei";
import * as math from "mathjs";
import { useRef } from "react";
import UnitCell from "../UnitCell/UnitCell";
import uuid from "react-uuid";

function LatticePlane({
	basis,
	millerIndex,
	color,
	alpha,
	lineWidth,
	shift,
	shiftAlongNorm,
}) {
	let add_vecs = (vec1, vec2) => new THREE.Vector3().addVectors(vec1, vec2);

	const recipBasis = math.transpose(math.inv(basis));
    const recipBasisMatrix = math.matrix(recipBasis)
    const recipMetricTensor = math.multiply(recipBasisMatrix, math.transpose(recipBasisMatrix))
    const hkl = math.matrix([millerIndex]);
    const dhkl = 1 / math.sqrt(math.multiply(hkl, math.multiply(recipMetricTensor, math.transpose(hkl))).subset(math.index(0, 0)))
	const h = millerIndex[0];
	const k = millerIndex[1];
	const l = millerIndex[2];
	const aVec = new THREE.Vector3().fromArray(basis[0]);
	const bVec = new THREE.Vector3().fromArray(basis[1]);
	const cVec = new THREE.Vector3().fromArray(basis[2]);

	const aStarVec = new THREE.Vector3().fromArray(recipBasis[0]);
	const bStarVec = new THREE.Vector3().fromArray(recipBasis[1]);
	const cStarVec = new THREE.Vector3().fromArray(recipBasis[2]);

	const normVec = add_vecs(
		add_vecs(
			aStarVec.clone().multiplyScalar(h),
			bStarVec.clone().multiplyScalar(k)
		),
		cStarVec.clone().multiplyScalar(l)
	).normalize().multiplyScalar(dhkl);

	const normShift = normVec.clone().multiplyScalar(shiftAlongNorm);
	const shiftVec = new THREE.Vector3().fromArray(shift);

	let aIntercept;
	let bIntercept;
	let cIntercept;
	if (h != 0) {
		aIntercept = 1 / h;
	} else {
		aIntercept = 0;
	}

	if (k != 0) {
		bIntercept = 1 / k;
	} else {
		bIntercept = 0;
	}

	if (l != 0) {
		cIntercept = 1 / l;
	} else {
		cIntercept = 0;
	}

	const intercepts = [aIntercept, bIntercept, cIntercept];
	const nZeros = intercepts.filter((v) => v === 0).length;

	let coords
	let vertex_coords
	let indices
	let normals
	let points

	const aPoint = aVec.clone().multiplyScalar(aIntercept);
	const bPoint = bVec.clone().multiplyScalar(bIntercept);
	const cPoint = cVec.clone().multiplyScalar(cIntercept);

	if (nZeros == 2) {
		if (aIntercept != 0) {
			vertex_coords = [
				aPoint.toArray(),
				add_vecs(aPoint, bVec).toArray(),
				add_vecs(add_vecs(aPoint, bVec), cVec).toArray(),
				add_vecs(aPoint, cVec).toArray(),
			];
		} else if (bIntercept != 0) {
			vertex_coords = [
				bPoint.toArray(),
				add_vecs(bPoint, aVec).toArray(),
				add_vecs(add_vecs(bPoint, aVec), cVec).toArray(),
				add_vecs(bPoint, cVec).toArray(),
			];
		} else if (cIntercept != 0) {
			vertex_coords = [
				cPoint.toArray(),
				add_vecs(cPoint, aVec).toArray(),
				add_vecs(add_vecs(cPoint, aVec), bVec).toArray(),
				add_vecs(cPoint, bVec).toArray(),
			];
		}
		indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
	} else if (nZeros == 1) {
		if (aIntercept == 0) {
			vertex_coords = [
				bPoint.toArray(),
				cPoint.toArray(),
				add_vecs(cPoint, aVec).toArray(),
				add_vecs(bPoint, aVec).toArray(),
			];
		} else if (bIntercept == 0) {
			vertex_coords = [
				aPoint.toArray(),
				cPoint.toArray(),
				add_vecs(cPoint, bVec).toArray(),
				add_vecs(aPoint, bVec).toArray(),
			];
		} else if (cIntercept == 0) {
			vertex_coords = [
				aPoint.toArray(),
				bPoint.toArray(),
				add_vecs(bPoint, cVec).toArray(),
				add_vecs(aPoint, cVec).toArray(),
			];
		}

		indices = new Uint16Array([0, 1, 2, 0, 2, 3]);
	} else {
		vertex_coords = [aPoint.toArray(), bPoint.toArray(), cPoint.toArray()];
		indices = new Uint16Array([0, 1, 2]);
	}

	vertex_coords = vertex_coords.map((x) =>
		add_vecs(
			add_vecs(new THREE.Vector3().fromArray(x), normShift),
			shiftVec
		).toArray()
	);
	coords = new Float32Array([].concat(...vertex_coords));
	points = vertex_coords.concat(vertex_coords[0]);
	normals = new Float32Array(
		[].concat(...new Array(vertex_coords.length).fill(normVec.toArray()))
	);

	return (
		<>
			<mesh>
				<bufferGeometry
					attach='geometry'
					onUpdate={(self) => self.computeVertexNormals()}
				>
					<bufferAttribute
						attach='attributes-position'
						array={coords}
						count={coords.length / 3}
						itemSize={3}
					/>
					<bufferAttribute
						attach='attributes-normal'
						array={normals}
						count={normals.length / 3}
						itemSize={3}
					/>
					<bufferAttribute
						attach='index'
						array={indices}
						count={indices.length}
						itemSize={1}
					/>
				</bufferGeometry>

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
				/>
			</mesh>
			<Line
                key={uuid()}
				points={points}
				color={color}
				lineWidth={lineWidth}
                transparent={true}
                opacity={alpha}
			/>
		</>
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
