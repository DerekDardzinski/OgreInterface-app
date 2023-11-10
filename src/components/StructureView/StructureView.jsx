import React, {
	useEffect,
	useState,
	useContext,
	useRef,
	createElement,
	Children,
} from "react";
import Atom from "../Atom/Atom.jsx";
import Bond from "../Bond/Bond.jsx";
import Display from "../Display/Display.jsx";
import UnitCell from "../UnitCell/UnitCell.jsx";
import DisplayCard from "../DisplayCard/DisplayCard.jsx";
import { BasisVectors } from "../BasisVectors/BasisVectors.jsx";
import { GizmoHelper } from "../BasisVectors/GizmoHelper.jsx";
import { SpotLight, Stage } from "@react-three/drei";
import { invalidate, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import uuid from 'react-uuid'; 
// import { get, post } from "../../utils/requests.js";

// Electron Inter Process Communication and dialog
// const { ipcRenderer } = window.require('electron');
// import { IpcRenderer } from "electron";

// Dynamically generated TCP (open) port between 3000-3999
const { ipcRenderer } = window;
const port = ipcRenderer.sendSync("get-port-number");

function CameraRig(props) {
	const currentView = props.view;
	const currentViewData = props.viewData[currentView];
	const newUp = currentViewData.up;
	const newPosition = new THREE.Vector3().fromArray(currentViewData.lookAt);
	const zeroVec = new THREE.Vector3(0.0, 0.0, 0.0);
	const initCameraPosition = useThree((state) => state.camera.position);
	const radius = initCameraPosition.distanceTo(zeroVec);
	useFrame((state) => {
		const cameraPosition = new THREE.Vector3().add(state.camera.position);
		const endPosition = new THREE.Vector3().add(newPosition);
		endPosition.multiplyScalar(radius);
		if (props.animate) {
			state.camera.position.lerp(endPosition, 0.25);
			state.camera.lookAt(0, 0, 0);
			state.camera.up.set(newUp[0], newUp[1], newUp[2]);
			if (cameraPosition.angleTo(endPosition) < 0.01) {
				props.setAnimateView({ view: props.view, animate: false });
			}
			invalidate();
		}
	});
}

function ScreenShot(props) {
	const { gl, scene, camera } = useThree();
	if (props.takeScreenShot) {
		gl.render(scene, camera);
		const screenshot = gl.domElement.toDataURL();
		const createE1 = document.createElement('a');
		createE1.href = screenshot;
		createE1.download = "structure_view"
		createE1.click();
		createE1.remove();
		props.setTakeScreenShot(false);
		invalidate();
	}
}

function Button(props) {
	const btnClassName =
		"btn btn-neutral focus:btn-accent rounded-2xl w-[100%] h-[100%]";
	const divClassName = "aspect-square";

	return (
		<div className={divClassName}>
			<button
				onClick={() => {
					props.setAnimateView({ view: props.label, animate: true });
				}}
				className={btnClassName}
			>
				{props.label}
			</button>
		</div>
	);
}

function StructureView(props) {
	// const structureData = props.structureData;
	const [atoms, setAtoms] = useState([]);
	const [bonds, setBonds] = useState([]);
	const [unitCell, setUnitCell] = useState([]);
	const [basis, setBasis] = useState([
		[1.0, 0.0, 0.0],
		[0.0, 1.0, 0.0],
		[0.0, 0.0, 1.0],
	]);
	const [centerShift, setCenterShift] = useState([0.0, 0.0, 0.0]);
	const [viewData, setViewData] = useState({
		a: {
			lookAt: [1.0, 0.0, 0.0],
			up: [0.0, 1.0, 0.0],
		},
		b: {
			lookAt: [1.0, 0.0, 0.0],
			up: [0.0, 1.0, 0.0],
		},
		c: {
			lookAt: [1.0, 0.0, 0.0],
			up: [0.0, 1.0, 0.0],
		},
		"a*": {
			lookAt: [1.0, 0.0, 0.0],
			up: [0.0, 1.0, 0.0],
		},
		"b*": {
			lookAt: [1.0, 0.0, 0.0],
			up: [0.0, 1.0, 0.0],
		},
		"c*": {
			lookAt: [1.0, 0.0, 0.0],
			up: [0.0, 1.0, 0.0],
		},
	});
	const [animateView, setAnimateView] = useState({
		view: "a",
		animate: false,
	});
	const [takeScreenShot, setTakeScreenShot] = useState(false);

	useEffect(() => {
		fetch(`http://localhost:${port}/api/structure_to_three`, {
			method: "POST",
			body: props.structureData.structure,
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error("Bad Response");
				}
				return res.json();
			})
			.then((data) => {
				setAtoms(
					data.atoms.map((props, i) => <Atom key={uuid()} {...props} />)
				);
				setBonds(
					data.bonds.map((props, i) => <Bond key={uuid()} {...props} />)
				);
				setUnitCell(
					data.unitCell.map((props, i) => (
						<UnitCell key={uuid()} {...props} />
					))
				);
				setCenterShift(data.centerShift);
				setBasis(data.basis);
				setViewData(data.viewData);
			})
			.catch((err) => {
				console.error(err);
			});
	}, [props.structureData]);

	let toshow;
	if (atoms.length > 0) {
		toshow = (
			<Display>
				<group position={centerShift}>
					{atoms}
					{bonds}
					{unitCell}
				</group>

				<GizmoHelper alignment='bottom-left' margin={[60, 60]}>
					<ambientLight intensity={2.0} />
					<BasisVectors
						basis={basis}
						axisColors={["red", "green", "blue"]}
						labelColor='black'
					/>
				</GizmoHelper>
				<CameraRig
					view={animateView.view}
					setAnimateView={setAnimateView}
					viewData={viewData}
					animate={animateView.animate}
				/>
				<ScreenShot
					takeScreenShot={takeScreenShot}
					setTakeScreenShot={setTakeScreenShot}
				/>
			</Display>
		);
	} else {
		toshow = <></>;
	}

	const bottomButtons = (
		<div className='grid grid-cols-6 flex-auto justify-center items-center my-4 mx-12 gap-2'>
			<Button label={"a"} setAnimateView={setAnimateView} />
			<Button label={"b"} setAnimateView={setAnimateView} />
			<Button label={"c"} setAnimateView={setAnimateView} />
			<Button label={"a*"} setAnimateView={setAnimateView} />
			<Button label={"b*"} setAnimateView={setAnimateView} />
			<Button label={"c*"} setAnimateView={setAnimateView} />
		</div>
	);

	let labelElements = [];
	props.structureData.labelData.forEach((v) => {
		const props = {key: uuid(), ...v[1]}
		labelElements.push(createElement(v[0], props, v[2]));
	});

	const label = createElement(
		"span",
		{ className: "inline-block w-[100%] text-center" },
		labelElements
	);

	const topRow = (
		<div className='grid grid-cols-6 flex-auto justify-center items-center gap-4 mx-4'>
			<div className='col-span-5 flex-auto justify-center items-center'>
				{label}
			</div>
			<div className='col-span-1'>
				<button
					onClick={() => {
						setTakeScreenShot(true);
					}}
					className='btn btn-neutral btn-outline focus:btn-accent focus:btn-outline rounded-2xl w-[100%] h-[70%]'
				>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='24'
						height='24'
						fill='currentColor'
						className=''
						viewBox='0 0 16 16'
					>
						<path d='M10.5 8.5a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0z' />
						<path d='M2 4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1.172a2 2 0 0 1-1.414-.586l-.828-.828A2 2 0 0 0 9.172 2H6.828a2 2 0 0 0-1.414.586l-.828.828A2 2 0 0 1 3.172 4H2zm.5 2a.5.5 0 1 1 0-1 .5.5 0 0 1 0 1zm9 2.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0z' />
					</svg>
				</button>
			</div>
		</div>
	);

	return (
		<DisplayCard
			topContents={topRow}
			bottomContents={bottomButtons}
		>
			{toshow}
		</DisplayCard>
	);
}

export default StructureView;
