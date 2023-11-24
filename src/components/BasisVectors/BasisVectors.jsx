import * as React from "react";
import { useThree } from "@react-three/fiber";
import { Hud, Cylinder, Stage, Text, Sphere } from "@react-three/drei";
import { useGizmoContext } from "./GizmoHelper.jsx";
import { CanvasTexture } from "three";
import * as THREE from "three";

function Axis({ scale = [0.8, 0.05, 0.05], color, rotation }) {
	return (
		<group rotation={rotation}>
			<mesh position={[0.4, 0, 0]}>
				<boxGeometry args={scale} />
				<meshStandardMaterial color={color} />
			</mesh>
		</group>
	);
}

function AxisHead({
	onClick,
	font,
	disabled,
	arcStyle,
	label,
	labelColor,
	axisHeadScale = 1,
	...props
}) {
	const gl = useThree((state) => state.gl);
	const texture = React.useMemo(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 64;
		canvas.height = 64;

		const context = canvas.getContext("2d");
		context.beginPath();
		context.arc(32, 32, 16, 0, 2 * Math.PI);
		context.closePath();
		context.fillStyle = arcStyle;
		context.fill();

		if (label) {
			context.font = font;
			context.textAlign = "center";
			context.fillStyle = labelColor;
			context.fillText(label, 32, 41);
		}
		return new CanvasTexture(canvas);
	}, [arcStyle, label, labelColor, font]);

	const [active, setActive] = React.useState(false);
	const scale = (label ? 1 : 0.75) * (active ? 1.2 : 1) * axisHeadScale;
	const handlePointerOver = (e) => {
		e.stopPropagation();
		setActive(true);
	};
	const handlePointerOut = (e) => {
		e.stopPropagation();
		setActive(false);
	};
	return (
		<sprite
			scale={scale}
			onPointerOver={!disabled ? handlePointerOver : undefined}
			onPointerOut={!disabled ? onClick || handlePointerOut : undefined}
			{...props}
		>
			<spriteMaterial
				map={texture}
				map-anisotropy={gl.capabilities.getMaxAnisotropy() || 1}
				alphaTest={0.3}
				opacity={label ? 1 : 0.75}
				toneMapped={false}
			/>
		</sprite>
	);
}

function AxisCylinder(props) {
	const ref = React.useRef();
	let toPosition = new THREE.Vector3().fromArray(props.toPosition);
	let fromPosition = new THREE.Vector3().fromArray(props.fromPosition);
	let axisVector = new THREE.Vector3().subVectors(toPosition, fromPosition);
	let normAxisVector = new THREE.Vector3()
		.add(axisVector)
		.divideScalar(axisVector.length());
	let initOrientation = new THREE.Vector3().fromArray([0.0, 1.0, 0.0]);
	let axisCenter = new THREE.Vector3()
		.addVectors(toPosition, fromPosition)
		.multiplyScalar(0.5);
	let quat = new THREE.Quaternion().setFromUnitVectors(
		initOrientation,
		normAxisVector
	);
	let radius = 0.1;

	return (
		<mesh ref={ref}>
			<group position={axisCenter.toArray()}>
				<group quaternion={quat}>
					<Cylinder
						args={[radius, radius, axisVector.length(), 32, 1]}
					>
						<meshPhysicalMaterial
							attach='material'
							color={props.color}
							depthWrite={true}
							side={THREE.DoubleSide}
							flatShading={false}
							roughness={0.6}
							metalness={0.0}
							reflectivity={0.0}
							clearcoat={0.0}
						/>
					</Cylinder>
				</group>
			</group>
		</mesh>
	);
}

function AxisHeadCone(props) {
	const ref = React.useRef();
	let toPosition = new THREE.Vector3().fromArray(props.toPosition);
	let fromPosition = new THREE.Vector3().fromArray(props.fromPosition);
	let axisVector = new THREE.Vector3().subVectors(toPosition, fromPosition);
	let normAxisVector = new THREE.Vector3()
		.add(axisVector)
		.divideScalar(axisVector.length());
	let initOrientation = new THREE.Vector3().fromArray([0.0, 1.0, 0.0]);
	let axisCenter = new THREE.Vector3()
		.addVectors(toPosition, fromPosition)
		.multiplyScalar(0.5);
	let quat = new THREE.Quaternion().setFromUnitVectors(
		initOrientation,
		normAxisVector
	);
	let radius = 0.1;

	return (
		<mesh ref={ref}>
			<group position={axisCenter.toArray()}>
				<group quaternion={quat}>
					<Cylinder
						args={[1.75 * radius, 0, axisVector.length(), 32, 1]}
					>
						<meshPhysicalMaterial
							attach='material'
							color={props.color}
							depthWrite={true}
							side={THREE.DoubleSide}
							flatShading={false}
							roughness={0.6}
							metalness={0.0}
							reflectivity={0.0}
							clearcoat={0.0}
						/>
					</Cylinder>
				</group>
			</group>
		</mesh>
	);
}

function AxisLabel(props) {
	const ref = React.useRef();
	const gl = useThree((state) => state.gl);

	const texture = React.useMemo(() => {
		const canvas = document.createElement("canvas");
		canvas.width = 64;
		canvas.height = 64;

		const context = canvas.getContext("2d");

		context.font = "45px Inter var, Arial, sans-serif";
		context.textAlign = "center";
		context.fillStyle = props.color;
		context.fillText(props.label, 32, 41);

		return new CanvasTexture(canvas);
	}, [props.label, props.color]);

	const [active, setActive] = React.useState(false);
	const scale = 1;
	const { tweenCamera } = useGizmoContext();
	// const handlePointerOver = (e) => {
	// 	e.stopPropagation();
	// 	setActive(true);
	// };
	// const handlePointerOut = (e) => {
	// 	e.stopPropagation();
	// 	setActive(false);
	// };
	// const handlePointerDown = (e) => {
    //     const p = new THREE.Vector3().add(e.object.position)
    //     // const euler = new THREE.Euler(-Math.PI / 2, 0, -Math.PI / 2, 'XYZ')
    //     // p.applyEuler(euler)
	// 	tweenCamera(p);
	// 	e.stopPropagation();
	// };

	return (
		<sprite
			position={props.position}
			scale={scale}
			// onPointerOver={handlePointerOver}
			// onPointerOut={handlePointerOut}
			// onPointerDown={handlePointerDown}
		>
			<spriteMaterial
				map={texture}
				map-anisotropy={gl.capabilities.getMaxAnisotropy() || 1}
				alphaTest={0.3}
				toneMapped={false}
			/>
		</sprite>
	);
}

export const BasisVectors = ({
	// disabled = false,
	// font = "24px Inter var, Arial, sans-serif",
	axisColors = ["#ff2060", "#20df80", "#2080ff"],
	labels = ["a", "b", "c"],
	// onClick,
	...props
}) => {
	const basis = props.basis;
	// const { tweenCamera } = useGizmoContext();
	let axes = [];
	let axesHeads = [];
	let axesLabels = [];
	basis.forEach((vec, i) => {
		const coneEnd = new THREE.Vector3()
			.fromArray(vec)
			.multiplyScalar(1.35)
			.toArray();
		const labelPosition = new THREE.Vector3()
			.fromArray(vec)
			.multiplyScalar(1.8)
			.toArray();
		axes.push(
			<AxisCylinder
                key={i}
				toPosition={vec}
				fromPosition={[0.0, 0.0, 0.0]}
				color={axisColors[i]}
			/>
		);
		axesHeads.push(
			<AxisHeadCone
                key={i}
				toPosition={vec}
				fromPosition={coneEnd}
				color={axisColors[i]}
			/>
		);
		axesLabels.push(
			<AxisLabel
                key={i}
				position={labelPosition}
				label={labels[i]}
				color={axisColors[i]}
			/>
		);
	});

	return (
		<group scale={25} {...props}>
			<Sphere args={[0.225, 32, 32]}>
				<meshStandardMaterial
					attach='material'
					color={"grey"}
				/>
			</Sphere>
			{axes}
			{axesHeads}
			{axesLabels}
		</group>
	);
};
