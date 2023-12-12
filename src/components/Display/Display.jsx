import React, { useEffect, useRef, useState } from "react";
import { Canvas, invalidate, useThree } from "@react-three/fiber";
import {
	OrbitControls,
	SoftShadows,
	Stage,
	Center,
	OrthographicCamera,
	Environment,
	CameraControls,
	Resize,
} from "@react-three/drei";
import * as THREE from "three";
import { Bounds } from "../../utils/Bounds";

function CustomBounds() {
	const bounds = useBounds();
	const {
		camera,
		size: { width, height },
	} = useThree();

	useEffect(() => {
		console.log(bounds.getSize());

		const { box, distance } = bounds.getSize();
		const newPosition = camera.position
			.clone()
			.normalize()
			.multiplyScalar(distance);
		// bounds.moveTo(newPosition).lookAt(new THREE.Vector3())
		const camMatrix4 = new THREE.Matrix4()
			.lookAt(newPosition, new THREE.Vector3(), camera.up)
			.setPosition(newPosition);
		camera.applyMatrix4(camMatrix4);

		camera.near = distance / 100;
		camera.far = distance * 100;
		camera.updateProjectionMatrix();

		let maxHeight = 0,
			maxWidth = 0;
		const vertices = [
			new THREE.Vector3(box.min.x, box.min.y, box.min.z),
			new THREE.Vector3(box.min.x, box.max.y, box.min.z),
			new THREE.Vector3(box.min.x, box.min.y, box.max.z),
			new THREE.Vector3(box.min.x, box.max.y, box.max.z),
			new THREE.Vector3(box.max.x, box.max.y, box.max.z),
			new THREE.Vector3(box.max.x, box.max.y, box.min.z),
			new THREE.Vector3(box.max.x, box.min.y, box.max.z),
			new THREE.Vector3(box.max.x, box.min.y, box.min.z),
		];

		// Transform the center and each corner to camera space
		for (const v of vertices) {
			v.applyMatrix4(camMatrix4);
			maxHeight = Math.max(maxHeight, Math.abs(v.y));
			maxWidth = Math.max(maxWidth, Math.abs(v.x));
		}
		maxHeight *= 2;
		maxWidth *= 2;
		const zoomForHeight = (camera.top - camera.bottom) / maxHeight;
		const zoomForWidth = (camera.right - camera.left) / maxWidth;

		camera.zoom = Math.min(zoomForHeight, zoomForWidth) / 1.4;

		// bounds.to({position: newPosition, target: new THREE.Vector3()})
		// const newPosition = new THREE.Vector3().copy(...camera.position)
		// .normalize().multiplyScalar(bounds.getSize().distance)
		console.log(distance);
		console.log(newPosition);
		console.log(camera.position);
		// camera.position.set(newPosition.toArray())
		// const newPosition = initPosition.d

		// const aabb = bounds.getSize().box

		// camera.zoom = Math.min(
		// 	width / (aabb.max.x - aabb.min.x),
		// 	height / (aabb.max.y - aabb.min.y)
		// );
		// camera.updateProjectionMatrix();
		// invalidate();
	}, []);
}

function Display(props) {
	const dispRef = useRef();
	const lightRef = useRef();
	const lightRef2 = useRef();
	// console.log(props.initCameraPosition);

	return (
		<div ref={dispRef} className='w-[100%] h-[100%] bg-white'>
			<Canvas
				gl={{ preserveDrawingBuffer: false, localClippingEnabled: true }}
				dpr={props.dpr}
				orthographic={true}
				camera={{ fov: 45, position: props.initCameraPosition }}
			>
				{/* <Bounds fit clip margin={1.4} fixedOrientation> */}
				{/* <Bounds fixedOrientation> */}
				{props.children}
				{/* </Bounds> */}

				<ambientLight intensity={0.3} />
				<pointLight
					ref={lightRef}
					position={[0, 0, 0]}
					intensity={100}
				/>
				<pointLight
					ref={lightRef2}
					position={[0, 1, 0]}
					intensity={100}
				/>

				<OrbitControls
					enablePan={false}
					enableDamping={true}
					makeDefault
					onChange={(e) => {
						if (!e) return;
						const camera = e.target.object;
						// console.log(camera.position)
						const radius = camera.position.length();

						if (lightRef.current) {
							lightRef.current.position.set(-10, 0, 0);
							lightRef.current.position.add(camera.position);
							lightRef.current.intensity = 1 * radius * radius;
						}

						if (lightRef2.current) {
							lightRef2.current.position.set(10, 0, 0);
							lightRef2.current.position.add(camera.position);
							lightRef2.current.intensity = 1 * radius * radius;
						}
					}}
				/>
				{/* <Environment preset="city" /> */}
			</Canvas>
		</div>
	);
}

Display.defaultProps = {
	dpr: 1,
	initCameraPosition: [0.0, 0.0, 1.0],
};

export default Display;
