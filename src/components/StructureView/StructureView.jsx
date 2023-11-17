import React, {
	useEffect,
	useLayoutEffect,
	useState,
	useContext,
	useRef,
	createElement,
	Children,
	useMemo,
} from "react";
import Atom from "../Atom/Atom.jsx";
import Bond from "../Bond/Bond.jsx";
import Display from "../Display/Display.jsx";
import UnitCell from "../UnitCell/UnitCell.jsx";
import DisplayCard from "../DisplayCard/DisplayCard.jsx";
import { BasisVectors } from "../BasisVectors/BasisVectors.jsx";
import { GizmoHelper } from "../BasisVectors/GizmoHelper.jsx";
import { SpotLight, Stage, useBounds } from "@react-three/drei";
import { invalidate, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import uuid from "react-uuid";
import Graph from "graphology";
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
		// console.log(state)
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
		const createE1 = document.createElement("a");
		createE1.href = screenshot;
		createE1.download = "structure_view";
		createE1.click();
		createE1.remove();
		props.setTakeScreenShot(false);
		props.setDpr(1);
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

function ShowStructure({ viewGraph }) {
	const data = useMemo(() => {
		console.log("SHOWING STRUCTURE");
		const atoms = [];
		const bonds = [];
		viewGraph.forEachNode((node, attributes) => {
			if ((viewGraph.degree(node) > 0) | attributes.inCell) {
				atoms.push(
					<Atom
						key={uuid()}
						position={attributes.position}
						color={attributes.color}
						radius={attributes.radius}
					/>
				);
			}
		});

		viewGraph.forEachEdge(
			(
				edge,
				attributes,
				source,
				target,
				sourceAttributes,
				targetAttributes
			) => {
				attributes.bonds.forEach((bondProps, index) => {
					bonds.push(<Bond key={uuid()} {...bondProps} />);
				});
			}
		);

		return { atoms: atoms, bonds: bonds };
	}, [viewGraph]);

	return (
		<>
			{data.atoms}
			{data.bonds}
		</>
	);
}

function getViewGraph({ structureGraph, bondCutoffs }) {
	const newGraph = structureGraph.copy();

	structureGraph.forEachEdge(
		(
			edge,
			attributes,
			source,
			target,
			sourceAttributes,
			targetAttributes
		) => {
			if (
				attributes.bondLength > bondCutoffs[attributes.atomicNumberKey]
			) {
				newGraph.dropEdge(edge);
			}
		}
	);

	return newGraph;
}

function BoundsRefresher({ structureGraph, groupRef }) {
	const bounds = useBounds();
	useEffect(() => {
		// bounds.refresh().clip().fit();
		bounds.refresh(groupRef.current).clip().fit();
	}, [structureGraph]);
}

function Slider(props) {
	const species = props.bondKey.split("-");

	return (
		<div className='grid grid-cols-5 flex-auto'>
			<div className='col-span-1'>
				<span className='block h-[100%] w-[100%] text-center'>
					{props.bondKey}
				</span>
			</div>
			<div className='col-span-3 rounded-full'>
				<input
					type='range'
					min={0.0}
					max={6.0}
					defaultValue={props.bondCutoffs[props.bondKey]}
					step={0.01}
					className='outline outline-base outline-1 w-[100%] h-[0.5rem] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[0.75rem] [&::-webkit-slider-thumb]:w-[0.75rem] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-base-100 [&::-webkit-slider-thumb]:outline [&::-webkit-slider-thumb]:outline-base-content [&::-webkit-slider-thumb]:outline-1 [&::-webkit-slider-thumb]:top-[0rem] [&::-webkit-slider-thumb]:relative'
					style={{
						appearance: "none",
						// background: `linear-gradient(to right, ${props.speciesColors[species[0]]}, ${props.speciesColors[species[0]]} 40%, #dddddd, ${props.speciesColors[species[1]]}) 60%, ${props.speciesColors[species[1]]})`,
						background: `linear-gradient(to right, ${props.speciesColors[species[0]]} 15%, #eeeeee, ${props.speciesColors[species[1]]} 85%)`,
						borderRadius: "9999px",
						WebkitAppearance: "none",
					}}
					onChange={(e) => {
						props.setBondCutoffs((prevState) => ({
							...prevState,
							[props.bondKey]: parseFloat(e.target.value),
						}));
					}}
				/>
			</div>
			<div className='col-span-1'>
				<span className='inline-block h-[100%] w-[100%] text-center'>
					{props.bondCutoffs[props.bondKey].toFixed(2)}
				</span>
			</div>
		</div>
	);
}

function StructureView(props) {
	const structure = props.structure
	const labelData = props.labelData

	const [structureGraph, setStructureGraph] = useState(new Graph());
	const [viewGraph, setViewGraph] = useState(new Graph());
	const [bondCutoffs, setBondCutoffs] = useState({});
	const [speciesPairs, setSpeciesPairs] = useState([]);
	const [speciesColors, setSpeciesColors] = useState({});
	const [unitCell, setUnitCell] = useState(<></>);
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
	const [dpr, setDpr] = useState(1)
	const groupRef = useRef(new THREE.Object3D());

	useEffect(() => {
		fetch(`http://localhost:${port}/api/structure_to_three`, {
			method: "POST",
			body: structure,
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error("Bad Response");
				}
				return res.json();
			})
			.then((data) => {
				const graph = new Graph();
				graph.import(data.graphData);
				setStructureGraph(graph);
				setSpeciesPairs(data.speciesPairs);
				setSpeciesColors(data.speciesColors);
				setBondCutoffs(data.bondCutoffs);
				setUnitCell(<UnitCell key={uuid()} {...data.unitCell} />);
				setCenterShift(data.centerShift);
				setBasis(data.basis);
				setViewData(data.viewData);
			})
			.catch((err) => {
				console.error(err);
			});
	}, [structure]);

	useEffect(() => {
		setViewGraph(getViewGraph({ structureGraph, bondCutoffs }));
	}, [structureGraph, bondCutoffs]);

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
	labelData.forEach((v) => {
		const props = { key: uuid(), ...v[1] };
		labelElements.push(createElement(v[0], props, v[2]));
	});

	const label = createElement(
		"div",
		{
			className: "inline-block h-[100%] w-[100%] text-center",
			key: uuid(),
		},
		labelElements
	);

	const bondSliders = [];
	speciesPairs.forEach((k, index) => {
		bondSliders.push(
			<Slider
				key={index}
				bondKey={k}
				bondCutoffs={bondCutoffs}
				speciesColors={speciesColors}
				setBondCutoffs={setBondCutoffs}
			/>
		);
	});

	const topRow = (
		<div className='grid grid-cols-6 flex-auto justify-center items-center gap-4 mx-4'>
			<div className='col-span-1'>
				<div className='dropdown dropdown-top  rounded-2xl w-[100%] h-[70%]'>
					<label
						tabIndex={0}
						className='p-0 m-0 btn btn-neutral btn-outline focus:btn-accent focus:btn-outline rounded-2xl w-[100%] h-[70%]'
					>
						<svg
							xmlns='http://www.w3.org/2000/svg'
							width='24'
							height='24'
							fill='currentColor'
							className=''
							viewBox='0 0 16 16'
						>
							<path d='M8.932.727c-.243-.97-1.62-.97-1.864 0l-.071.286a.96.96 0 0 1-1.622.434l-.205-.211c-.695-.719-1.888-.03-1.613.931l.08.284a.96.96 0 0 1-1.186 1.187l-.284-.081c-.96-.275-1.65.918-.931 1.613l.211.205a.96.96 0 0 1-.434 1.622l-.286.071c-.97.243-.97 1.62 0 1.864l.286.071a.96.96 0 0 1 .434 1.622l-.211.205c-.719.695-.03 1.888.931 1.613l.284-.08a.96.96 0 0 1 1.187 1.187l-.081.283c-.275.96.918 1.65 1.613.931l.205-.211a.96.96 0 0 1 1.622.434l.071.286c.243.97 1.62.97 1.864 0l.071-.286a.96.96 0 0 1 1.622-.434l.205.211c.695.719 1.888.03 1.613-.931l-.08-.284a.96.96 0 0 1 1.187-1.187l.283.081c.96.275 1.65-.918.931-1.613l-.211-.205a.96.96 0 0 1 .434-1.622l.286-.071c.97-.243.97-1.62 0-1.864l-.286-.071a.96.96 0 0 1-.434-1.622l.211-.205c.719-.695.03-1.888-.931-1.613l-.284.08a.96.96 0 0 1-1.187-1.186l.081-.284c.275-.96-.918-1.65-1.613-.931l-.205.211a.96.96 0 0 1-1.622-.434L8.932.727zM8 12.997a4.998 4.998 0 1 1 0-9.995 4.998 4.998 0 0 1 0 9.996z' />
						</svg>
					</label>
					<div className='outline outline-base outline-1 dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-72'>
						<p className='text-[1rem] text-center font-bold mb-2'>
							Set Bond Lengths
						</p>
						{bondSliders}
					</div>
				</div>
			</div>
			<div className='col-span-4 flex-auto justify-center items-center'>
				{label}
			</div>
			<div className='col-span-1'>
				<div
					onClick={() => {
						setTakeScreenShot(true);
						setDpr(6);
					}}
					// className='bg-red-200 rounded-2xl w-[100%] h-[70%] flex-auto justify-center items-center'
					className='p-0 m-0 btn btn-neutral btn-outline focus:btn-accent focus:btn-outline rounded-2xl w-[100%] h-[70%]'
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
				</div>
			</div>
		</div>
	);

	return (
		<DisplayCard topContents={topRow} bottomContents={bottomButtons}>
			{structureGraph.order > 0 ? (
				<Display dpr={dpr}>
					<group ref={groupRef} position={centerShift}>
						<ShowStructure
							viewGraph={viewGraph}
							bondCutoffs={bondCutoffs}
						/>
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
						setDpr={setDpr}
					/>
				</Display>
			) : (
				<></>
			)}
		</DisplayCard>
	);
}

export default StructureView;
