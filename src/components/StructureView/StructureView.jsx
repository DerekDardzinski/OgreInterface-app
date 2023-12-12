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
import {
	SpotLight,
	Stage,
	Hud,
	OrthographicCamera,
	Plane,
} from "@react-three/drei";
import { invalidate, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import uuid from "react-uuid";
import Graph from "graphology";
import LatticePlane from "../LatticePlane/LatticePlane.jsx";
import { SketchPicker } from "react-color";
import * as mathjs from "mathjs";
import { Bounds, useBounds } from "../../utils/Bounds.jsx";
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
			// invalidate();
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

function getImagePosition({ position, basis, image }) {
	const translatedPosition = new THREE.Vector3().fromArray(position);
	const aVec = new THREE.Vector3().fromArray(basis[0]);
	const bVec = new THREE.Vector3().fromArray(basis[1]);
	const cVec = new THREE.Vector3().fromArray(basis[2]);
	translatedPosition.add(aVec.multiplyScalar(image[0]));
	translatedPosition.add(bVec.multiplyScalar(image[1]));
	translatedPosition.add(cVec.multiplyScalar(image[2]));

	return translatedPosition;
}

function getAtom({ radius, position, color }) {
	const atom = new THREE.SphereGeometry(radius, 32, 32);
	atom.translate(...position);
	const nVertices = atom.getAttribute("position").count;
	const rgb = new THREE.Color(color).toArray();
	const colorArray = new Array(nVertices).fill(rgb).flat();
	const colorAttribute = new THREE.BufferAttribute(
		new Float32Array(colorArray),
		3
	);
	atom.setAttribute("color", colorAttribute);

	return atom;
}

function StructureGeometry({ viewGraph, bounds }) {
	const data = useMemo(() => {
		console.log("STRUCTURE GEOMETRY MEMO");
		const geoms = [];
		// geoms.push(
		// 	getAtom({
		// 		radius: 2.0,
		// 		position: centerShift,
		// 		color: "#ff0000",
		// 	})
		// )
		viewGraph.forEachNode((node, attributes) => {
			const neighborInCell = viewGraph.filterNeighbors(
				node,
				(node, attr) => attr.inCell
			);
			if (
				attributes.inCell |
				(neighborInCell.length > 0)
				// (viewGraph.degree(node) > 0) |
				// isInCell({
				// 	bounds: bounds,
				// 	fracPosition: attributes.fracPosition,
				// })
			) {
				const atom = getAtom({
					radius: attributes.radius,
					position: attributes.position,
					color: attributes.color,
				});
				geoms.push(atom);
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
				if (sourceAttributes.inCell | targetAttributes.inCell) {
					attributes.bonds.forEach((bondProps, index) => {
						let toPosition = new THREE.Vector3().fromArray(
							bondProps.toPosition
						);
						let fromPosition = new THREE.Vector3().fromArray(
							bondProps.fromPosition
						);
						let bondVector = new THREE.Vector3().subVectors(
							toPosition,
							fromPosition
						);
						let normBondVector = new THREE.Vector3()
							.add(bondVector)
							.divideScalar(bondVector.length());
						let initOrientation = new THREE.Vector3().fromArray([
							0.0, 1.0, 0.0,
						]);
						let bondCenter = new THREE.Vector3()
							.addVectors(toPosition, fromPosition)
							.multiplyScalar(0.5);
						let quat = new THREE.Quaternion().setFromUnitVectors(
							initOrientation,
							normBondVector
						);
						let radius = 0.15;
						const bond = new THREE.CylinderGeometry(
							0.15,
							0.15,
							bondVector.length(),
							32,
							1
						);
						bond.applyQuaternion(quat);
						bond.translate(bondCenter);
						const nVertices = bond.getAttribute("position").count;
						const rgb = new THREE.Color(bondProps.color).toArray();
						const colorArray = new Array(nVertices)
							.fill(rgb)
							.flat();
						const colorAttribute = new THREE.BufferAttribute(
							new Float32Array(colorArray),
							3
						);
						bond.setAttribute("color", colorAttribute);
						geoms.push(bond);
					});

					// attributes.bonds.forEach((bondProps, index) => {
					// 	bonds.push(<Bond key={uuid()} {...bondProps} />);
					// });
				}
			}
		);

		// return { atoms: atoms, bonds: bonds };
		if (geoms.length > 0) {
			const mergedGeoms = BufferGeometryUtils.mergeGeometries(geoms);
			return mergedGeoms;
		} else {
			return new THREE.BufferGeometry();
		}
	}, [viewGraph, bounds]);

	return data;
}

function getViewGraphSlow({ structureGraph, bondCutoffs, basis, cellBounds }) {
	const newGraph = structureGraph.copy();

	const getNodeLabel = ({ initLabel, image }) => {
		const splitLabel = initLabel.split(",").map((v, _) => parseInt(v));
		const initImage = splitLabel.slice(1);
		const siteIndex = splitLabel[0];
		const shiftImage = mathjs.add(initImage, image);
		const imageSplitNode = [siteIndex, ...shiftImage];
		const imageNode = imageSplitNode.map((v, _) => v.toString()).join(",");

		return imageNode;
	};

	structureGraph.forEachNode((node, attributes) => {
		for (
			let a = Math.floor(cellBounds.a[0]);
			a <= Math.ceil(cellBounds.a[1]);
			a++
		) {
			for (
				let b = Math.floor(cellBounds.b[0]);
				b <= Math.ceil(cellBounds.b[1]);
				b++
			) {
				for (
					let c = Math.floor(cellBounds.c[0]);
					c <= Math.ceil(cellBounds.c[1]);
					c++
				) {
					if (!(a == 0 && b == 0 && c == 0)) {
						const fracShift = [a, b, c];
						const cartShift = getTranslationFromImage({
							basis: basis,
							image: fracShift,
						});
						const imageNode = getNodeLabel({
							initLabel: node,
							image: fracShift,
						});

						const newNodeAttributes = { ...attributes };

						newNodeAttributes.position = mathjs.add(
							attributes.position,
							cartShift
						);

						newNodeAttributes.fracPosition = mathjs.add(
							attributes.fracPosition,
							fracShift
						);

						if (!newGraph.hasNode(imageNode)) {
							newGraph.addNode(imageNode, newNodeAttributes);
						}
					}
				}
			}
		}
	});

	structureGraph.forEachEdge(
		(
			edge,
			edgeAttributes,
			source,
			target,
			sourceAttributes,
			targetAttributes
		) => {
			for (
				let a = Math.floor(cellBounds.a[0]);
				a <= Math.ceil(cellBounds.a[1]);
				a++
			) {
				for (
					let b = Math.floor(cellBounds.b[0]);
					b <= Math.ceil(cellBounds.b[1]);
					b++
				) {
					for (
						let c = Math.floor(cellBounds.c[0]);
						c <= Math.ceil(cellBounds.c[1]);
						c++
					) {
						if (!(a == 0 && b == 0 && c == 0)) {
							const fracShift = [a, b, c];
							const cartShift = getTranslationFromImage({
								basis: basis,
								image: fracShift,
							});
							const imageSourceNode = getNodeLabel({
								initLabel: source,
								image: fracShift,
							});
							const imageTargetNode = getNodeLabel({
								initLabel: target,
								image: fracShift,
							});

							const newEdgeAttributes = { ...edgeAttributes };

							newEdgeAttributes.bonds = [
								{
									toPosition: mathjs.add(
										edgeAttributes.bonds[0].toPosition,
										cartShift
									),
									fromPosition: mathjs.add(
										edgeAttributes.bonds[0].fromPosition,
										cartShift
									),
									// ...edgeAttributes.bonds[0],
									color: edgeAttributes.bonds[0].color,
								},
								{
									toPosition: mathjs.add(
										edgeAttributes.bonds[0].toPosition,
										cartShift
									),
									fromPosition: mathjs.add(
										edgeAttributes.bonds[1].fromPosition,
										cartShift
									),
									color: edgeAttributes.bonds[1].color,
									// ...edgeAttributes.bonds[1],
								},
							];

							if (
								!newGraph.hasEdge(
									imageSourceNode,
									imageTargetNode
								) &&
								newGraph.hasNode(imageSourceNode) &&
								newGraph.hasNode(imageTargetNode)
							) {
								newGraph.addEdge(
									imageSourceNode,
									imageTargetNode,
									newEdgeAttributes
								);
							}
						}
					}
				}
			}
		}
	);

	newGraph.forEachEdge(
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

function getViewGraph({ structureGraph, bondCutoffs, basis, cellBounds }) {
	const newGraph = structureGraph.copy();

	newGraph.forEachNode((node, _) => {
		newGraph.updateNode(node, (attr) => {
			return {
				...attr,
				inCell: isInCell({
					bounds: cellBounds,
					fracPosition: attr.fracPosition,
				}),
			};
		});
	});

	newGraph.forEachEdge(
		(
			edge,
			edgeAttributes,
			source,
			target,
			sourceAttributes,
			targetAttributes
		) => {
			if (
				edgeAttributes.bondLength >
				bondCutoffs[edgeAttributes.atomicNumberKey]
			) {
				newGraph.dropEdge(edge);
			}
		}
	);

	const getNodeLabel = ({ initLabel, image }) => {
		const splitLabel = initLabel.split(",").map((v, _) => parseInt(v));
		const initImage = splitLabel.slice(1);
		const siteIndex = splitLabel[0];
		const shiftImage = mathjs.add(initImage, image);
		const imageSplitNode = [siteIndex, ...shiftImage];
		const imageNode = imageSplitNode.map((v, _) => v.toString()).join(",");

		return imageNode;
	};

	for (
		let a = Math.floor(cellBounds.a[0]);
		a <= Math.ceil(cellBounds.a[1]);
		a++
	) {
		for (
			let b = Math.floor(cellBounds.b[0]);
			b <= Math.ceil(cellBounds.b[1]);
			b++
		) {
			for (
				let c = Math.floor(cellBounds.c[0]);
				c <= Math.ceil(cellBounds.c[1]);
				c++
			) {
				if (!(a == 0 && b == 0 && c == 0)) {
					const fracShift = [a, b, c];
					const cartShift = getTranslationFromImage({
						basis: basis,
						image: fracShift,
					});
					structureGraph.forEachNode((node, attributes) => {
						const imageNode = getNodeLabel({
							initLabel: node,
							image: fracShift,
						});

						const newNodeAttributes = { ...attributes };

						newNodeAttributes.position = mathjs.add(
							attributes.position,
							cartShift
						);

						newNodeAttributes.fracPosition = mathjs.add(
							attributes.fracPosition,
							fracShift
						);

						newNodeAttributes.inCell = isInCell({
							bounds: cellBounds,
							fracPosition: newNodeAttributes.fracPosition,
						});

						if (!newGraph.hasNode(imageNode)) {
							newGraph.addNode(imageNode, newNodeAttributes);
						}
					});

					structureGraph.forEachEdge(
						(
							edge,
							edgeAttributes,
							source,
							target,
							sourceAttributes,
							targetAttributes
						) => {
							if (
								!(
									edgeAttributes.bondLength >
									bondCutoffs[edgeAttributes.atomicNumberKey]
								)
							) {
								const imageSourceNode = getNodeLabel({
									initLabel: source,
									image: fracShift,
								});
								const imageTargetNode = getNodeLabel({
									initLabel: target,
									image: fracShift,
								});

								const newEdgeAttributes = { ...edgeAttributes };

								newEdgeAttributes.bonds = [
									{
										toPosition: mathjs.add(
											edgeAttributes.bonds[0].toPosition,
											cartShift
										),
										fromPosition: mathjs.add(
											edgeAttributes.bonds[0]
												.fromPosition,
											cartShift
										),
										color: edgeAttributes.bonds[0].color,
									},
									{
										toPosition: mathjs.add(
											edgeAttributes.bonds[0].toPosition,
											cartShift
										),
										fromPosition: mathjs.add(
											edgeAttributes.bonds[1]
												.fromPosition,
											cartShift
										),
										color: edgeAttributes.bonds[1].color,
									},
								];

								if (
									!newGraph.hasEdge(
										imageSourceNode,
										imageTargetNode
									)
								) {
									newGraph.addEdge(
										imageSourceNode,
										imageTargetNode,
										newEdgeAttributes
									);
								}
							}
						}
					);
				}
			}
		}
	}

	return newGraph;
}

function getTranslationFromImage({ basis, image }) {
	const aVec = mathjs.multiply(basis[0], image[0]);
	const bVec = mathjs.multiply(basis[1], image[1]);
	const cVec = mathjs.multiply(basis[2], image[2]);

	return mathjs.add(aVec, bVec, cVec);
}

function getCenterShift({ basis, bounds }) {
	const aMid = 0.5 * (bounds.a[0] + bounds.a[1]);
	const bMid = 0.5 * (bounds.b[0] + bounds.b[1]);
	const cMid = 0.5 * (bounds.c[0] + bounds.c[1]);
	const image = [-aMid, -bMid, -cMid];

	return getTranslationFromImage({ basis: basis, image: image });
}

function isInCell({ bounds, fracPosition }) {
	return (
		bounds.a[0] <= fracPosition[0] &&
		fracPosition[0] <= bounds.a[1] &&
		bounds.b[0] <= fracPosition[1] &&
		fracPosition[1] <= bounds.b[1] &&
		bounds.c[0] <= fracPosition[2] &&
		fracPosition[2] <= bounds.c[1]
	);
}

function Slider(props) {
	const species = props.bondKey.split("-");
	const [bondLength, setBondLength] = useState(
		props.bondCutoffs[props.bondKey]
	);

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
					max={5.0}
					defaultValue={bondLength}
					name={props.bondKey}
					id={props.bondKey}
					step={0.01}
					className='outline outline-base outline-1 w-[100%] h-[0.5rem] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-[0.75rem] [&::-webkit-slider-thumb]:w-[0.75rem] [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-base-100 [&::-webkit-slider-thumb]:outline [&::-webkit-slider-thumb]:outline-base-content [&::-webkit-slider-thumb]:outline-1 [&::-webkit-slider-thumb]:top-[0rem] [&::-webkit-slider-thumb]:relative'
					style={{
						appearance: "none",
						// background: `linear-gradient(to right, ${props.speciesColors[species[0]]}, ${props.speciesColors[species[0]]} 40%, #dddddd, ${props.speciesColors[species[1]]}) 60%, ${props.speciesColors[species[1]]})`,
						background: `linear-gradient(to right, ${
							props.speciesColors[species[0]]
						} 15%, #eeeeee, ${
							props.speciesColors[species[1]]
						} 85%)`,
						borderRadius: "9999px",
						WebkitAppearance: "none",
					}}
					onChange={(e) => {
						setBondLength(parseFloat(e.target.value));
						// bondRef.current = parseFloat(e.target.value)
						// props.setBondCutoffs((prevState) => ({
						// 	...prevState,
						// 	[props.bondKey]: parseFloat(e.target.value),
						// }));
					}}
				/>
			</div>
			<div className='col-span-1'>
				<span className='inline-block h-[100%] w-[100%] text-center'>
					{bondLength.toFixed(2)}
					{/* {props.bondCutoffs[props.bondKey].toFixed(2)} */}
				</span>
			</div>
		</div>
	);
}

LatticePlaneInput.defaultProps = {
	initH: "0",
	initK: "0",
	initL: "1",
	initShift: "0.0",
	planeId: "",
	initColor: {
		hex: "#c8c8c8",
		rgb: { r: 200, g: 200, b: 200, a: 0.6 },
	},
};

function LatticePlaneInput({
	initH,
	initK,
	initL,
	initShift,
	initColor,
	planeId,
	latticePlaneProps,
	setLatticePlaneProps,
}) {
	const [color, setColor] = useState(initColor);
	const [h, setH] = useState(initH);
	const [k, setK] = useState(initK);
	const [l, setL] = useState(initL);
	const [shift, setShift] = useState(initShift);

	const handleDelete = (e) => {
		setLatticePlaneProps((prevState) => {
			const newState = { ...prevState };
			delete newState[planeId];
			return newState;
		});
	};
	const handleSubmit = (e) => {
		e.preventDefault();
		const form = e.target;
		const fd = new FormData(form);
		const fdObj = Object.fromEntries(fd.entries());
		// setPlaneId(uuid());
		const newPlaneProps = {
			millerIndex: [
				parseInt(fdObj.h),
				parseInt(fdObj.k),
				parseInt(fdObj.l),
			],
			color: color.hex,
			alpha: color.rgb.a,
			shiftAlongNorm: parseFloat(fdObj.shift),
			colorState: color,
			// id: planeId,
		};
		const newPlaneId = planeId === "" ? uuid() : planeId;

		setLatticePlaneProps((prevState) => ({
			...prevState,
			[newPlaneId]: newPlaneProps,
		}));
	};

	const textClassName =
		"input input-xs input-bordered input-base-content w-8 ml-1 mr-1 text-center";

	let submitButton;

	if (planeId === "") {
		submitButton = (
			<div className='h-6 flex items-center justify-center ml-3'>
				<button
					type='submit'
					className='w-5 h-5 rounded-full text-sm text-center items-center cursor-pointer justify-center flex bg-info text-info-content hover:bg-success hover:text-success-content'
				>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='18'
						height='18'
						fill='currentColor'
						className='bi bi-plus'
						viewBox='0 0 16 16'
					>
						<path d='M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z' />
					</svg>
				</button>
			</div>
		);
	} else {
		submitButton = (
			<div className='h-6 flex items-center justify-center ml-3'>
				<button
					type='submit'
					className='w-5 h-5 rounded-l-full text-sm text-center items-center cursor-pointer justify-center flex bg-info text-info-content hover:bg-success hover:text-success-content'
				>
					{/* <svg
						xmlns='http://www.w3.org/2000/svg'
						width='14'
						height='14'
						viewBox='0 0 24 24'
					>
						<path d='M5 18c4.667 4.667 12 1.833 12-4.042h-3l5-6 5 6h-3c-1.125 7.98-11.594 11.104-16 4.042zm14-11.984c-4.667-4.667-12-1.834-12 4.041h3l-5 6-5-6h3c1.125-7.979 11.594-11.104 16-4.041z' />
					</svg> */}
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='16'
						height='16'
						fill='currentColor'
						className='bi bi-arrow-repeat'
						viewBox='0 0 16 16'
					>
						<path d='M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z' />
						<path
							fill-rule='evenodd'
							d='M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3M3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9z'
						/>
					</svg>
				</button>
				<div
					onClick={handleDelete}
					className='w-5 h-5 rounded-r-full text-sm text-center items-center cursor-pointer justify-center flex bg-error text-error-content hover:bg-warning hover:text-warning-content'
				>
					<svg
						xmlns='http://www.w3.org/2000/svg'
						width='18'
						height='18'
						fill='currentColor'
						className='bi bi-x'
						viewBox='0 0 16 16'
					>
						<path d='M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708' />
					</svg>
				</div>
			</div>
		);
	}

	return (
		<form method='POST' onSubmit={handleSubmit}>
			<div className='flex my-1'>
				<div className=''>
					<input
						type='text'
						id='h'
						placeholder='h'
						name='h'
						className={textClassName}
						onChange={(e) => setH(e.target.value)}
						value={h}
					/>
					<p className='text-center mx-1 text-[0.7rem]'>h</p>
				</div>
				<div className=''>
					<input
						type='text'
						id='k'
						placeholder='k'
						name='k'
						className={textClassName}
						onChange={(e) => setK(e.target.value)}
						value={k}
					/>
					<p className='text-center mx-1 text-[0.7rem]'>k</p>
				</div>
				<div className=''>
					<input
						type='text'
						id='l'
						placeholder='l'
						name='l'
						className={textClassName}
						onChange={(e) => setL(e.target.value)}
						value={l}
					/>
					<p className='text-center mx-1 text-[0.7rem]'>l</p>
				</div>
				<div className=''>
					<input
						type='text'
						id='shift'
						placeholder='0.0'
						name='shift'
						className='input input-xs input-bordered input-base-content w-[2.75rem] ml-1 mr-1 text-center'
						onChange={(e) => setShift(e.target.value)}
						value={shift}
					/>
					<span className='text-sm'>
						&#215;d<sub>hkl</sub>
					</span>
					<p className='text-center ml-1 text-[0.7rem]'>
						Fractional Shift
					</p>
				</div>
				<div>
					<details id='colorPicker' className='dropdown dropdown-top'>
						<summary
							// tabIndex={0}
							className='pattern-checkered-gray-200/100 pattern-checkered-scale-[2.0] block ml-3 mr-1 w-8 p-0 border-0 input input-xs input-bordered input-base-content'
							// style={{ backgroundColor: color.hex }}
						>
							<div
								className='w-8 h-[1.5rem] input input-xs p-0 m0'
								style={{
									backgroundColor: `rgba(${color.rgb.r}, ${color.rgb.g}, ${color.rgb.b}, ${color.rgb.a})`,
								}}
							></div>
						</summary>
						<div
							// tabIndex={0}
							id='colorPickerPop'
							className='dropdown-content z-[1] menu p-2 rounded-box'
						>
							<SketchPicker
								color={color.rgb}
								onChange={(e) => {
									setColor(e);
								}}
							/>
						</div>
					</details>
					<p className='text-center ml-3 mr-1 mt-[-0.35rem] text-[0.7rem]'>
						Color
					</p>
				</div>
				{submitButton}
			</div>
		</form>
	);
}

function LatticePlanePanel({ latticePlaneProps, setLatticePlaneProps }) {
	let currentLatticePlaneInputs;
	if (Object.keys(latticePlaneProps).length > 0) {
		currentLatticePlaneInputs = Object.keys(latticePlaneProps).map(
			(key, index) => {
				const planeProps = latticePlaneProps[key];
				return (
					<LatticePlaneInput
						key={uuid()}
						initH={planeProps.millerIndex[0]}
						initK={planeProps.millerIndex[1]}
						initL={planeProps.millerIndex[2]}
						initColor={planeProps.colorState}
						initShift={planeProps.shiftAlongNorm}
						planeId={key}
						latticePlaneProps={latticePlaneProps}
						setLatticePlaneProps={setLatticePlaneProps}
					/>
				);
			}
		);
	} else {
		currentLatticePlaneInputs = <></>;
	}
	return (
		<>
			{Object.keys(latticePlaneProps).length > 0 ? (
				<div className='divider'>Current Lattice Planes</div>
			) : (
				<></>
			)}
			{currentLatticePlaneInputs}
			<div className='divider'>Add Lattice Plane</div>
			<LatticePlaneInput
				latticePlaneProps={latticePlaneProps}
				setLatticePlaneProps={setLatticePlaneProps}
			/>
		</>
	);
}

function CellBoundsPanel({ cellBounds, setCellBounds }) {
	const [aMin, setAMin] = useState(cellBounds.a[0]);
	const [aMax, setAMax] = useState(cellBounds.a[1]);
	const [bMin, setBMin] = useState(cellBounds.b[0]);
	const [bMax, setBMax] = useState(cellBounds.b[1]);
	const [cMin, setCMin] = useState(cellBounds.c[0]);
	const [cMax, setCMax] = useState(cellBounds.c[1]);
	const textClassName =
		"input input-xs input-bordered input-base-content w-[100%] text-center";

	const parseInput = ({ initValue, newValue }) => {
		const floatValue = parseFloat(newValue);

		if (!isNaN(floatValue)) {
			return floatValue;
		} else {
			return initValue;
		}
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		const form = e.target;
		const fd = new FormData(form);
		const fdObj = Object.fromEntries(fd.entries());

		setCellBounds((prevState) => ({
			a: [
				parseInput({ initValue: prevState.a[0], newValue: fdObj.aMin }),
				parseInput({ initValue: prevState.a[1], newValue: fdObj.aMax }),
			],
			b: [
				parseInput({ initValue: prevState.b[0], newValue: fdObj.bMin }),
				parseInput({ initValue: prevState.b[1], newValue: fdObj.bMax }),
			],
			c: [
				parseInput({ initValue: prevState.c[0], newValue: fdObj.cMin }),
				parseInput({ initValue: prevState.c[1], newValue: fdObj.cMax }),
			],
		}));
	};

	return (
		<form method='POST' onSubmit={handleSubmit}>
			<div className='w-[100%] flex items-center justify-center mb-3 mt-1'>
				<button
					type='submit'
					name='submit'
					className='btn btn-secondary btn-xs w-[90%]'
				>
					Update
				</button>
			</div>
			<div className='flex items-center justify-center'>
				<div className='grid grid-cols-2 gap-x-2 gap-y-2 w-[90%]'>
					<div className=''>
						<input
							type='text'
							id='aMin'
							placeholder='0'
							name='aMin'
							className={textClassName}
							onChange={(e) => setAMin(e.target.value)}
							value={aMin}
						/>
						<p className='text-center text-xs'>
							x<sub>min</sub>
						</p>
					</div>
					<div className=''>
						<input
							type='text'
							id='aMax'
							placeholder='0'
							name='aMax'
							className={textClassName}
							onChange={(e) => setAMax(e.target.value)}
							value={aMax}
						/>
						<p className='text-center text-xs'>
							x<sub>max</sub>
						</p>
					</div>
					<div className=''>
						<input
							type='text'
							id='bMin'
							placeholder='0'
							name='bMin'
							className={textClassName}
							onChange={(e) => setBMin(e.target.value)}
							value={bMin}
						/>
						<p className='text-center text-xs'>
							y<sub>min</sub>
						</p>
					</div>
					<div className=''>
						<input
							type='text'
							id='bMax'
							placeholder='0'
							name='bMax'
							className={textClassName}
							onChange={(e) => setBMax(e.target.value)}
							value={bMax}
						/>
						<p className='text-center text-xs'>
							y<sub>max</sub>
						</p>
					</div>
					<div className=''>
						<input
							type='text'
							id='cMin'
							placeholder='0'
							name='cMin'
							className={textClassName}
							onChange={(e) => setCMin(e.target.value)}
							value={cMin}
						/>
						<p className='text-center text-xs'>
							z<sub>min</sub>
						</p>
					</div>
					<div className=''>
						<input
							type='text'
							id='cMax'
							placeholder='0'
							name='cMax'
							className={textClassName}
							onChange={(e) => setCMax(e.target.value)}
							value={cMax}
						/>
						<p className='text-center text-xs'>
							z<sub>max</sub>
						</p>
					</div>
				</div>
			</div>
		</form>
	);
}

function StructureViewPopUp({
	bondCutoffs,
	setBondCutoffs,
	latticePlaneProps,
	setLatticePlaneProps,
	cellBounds,
	setCellBounds,
	speciesPairs,
	speciesColors,
}) {
	const [showPanel, setShowPanel] = useState("bonds");
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

	const bondShowPanel = (
		<form
			method='POST'
			onSubmit={(e) => {
				e.preventDefault();
				const form = e.target;
				const fd = new FormData(form);
				const fdObj = Object.fromEntries(fd.entries());

				Object.keys(fdObj).forEach((key, index) => {
					fdObj[key] = parseFloat(fdObj[key]);
				});
				setBondCutoffs(fdObj);
			}}
		>
			<div className='w-[100%] flex items-center justify-center mb-2 mt-1'>
				<button
					type='submit'
					name='submit'
					className='btn btn-secondary btn-xs w-[90%]'
				>
					Update
				</button>
			</div>
			{bondSliders}
		</form>
	);

	const planeShowPanel = (
		<LatticePlanePanel
			latticePlaneProps={latticePlaneProps}
			setLatticePlaneProps={setLatticePlaneProps}
		/>
	);
	const cellShowPanel = (
		<CellBoundsPanel
			cellBounds={cellBounds}
			setCellBounds={setCellBounds}
		/>
	);

	const panels = {
		bonds: bondShowPanel,
		planes: planeShowPanel,
		cell: cellShowPanel,
	};

	return (
		<>
			<details
				id='settingsPopUp'
				className='dropdown dropdown-top rounded-2xl w-[100%] h-[70%]'
			>
				<summary
					// tabIndex={0}
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
				</summary>
				<div
					// tabIndex={0}
					className='outline outline-base outline-1 dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80 overflow-visable'
				>
					{panels[showPanel]}
					<div className='grid grid-cols-3 bg-base-200 rounded-xl px-2 mt-2'>
						<div className='w-[100%] flex items-center justify-center my-2'>
							<button
								onClick={() => setShowPanel("bonds")}
								className={
									"btn btn-xs w-[90%] " +
									(showPanel == "bonds"
										? "btn-primary"
										: "btn-secondary")
								}
							>
								Bonds
							</button>
						</div>
						<div className='w-[100%] flex items-center justify-center my-2'>
							<button
								onClick={() => setShowPanel("planes")}
								// className='btn btn-secondary btn-xs w-[90%]'
								className={
									"btn btn-xs w-[90%] " +
									(showPanel == "planes"
										? "btn-primary"
										: "btn-secondary")
								}
							>
								Planes
							</button>
						</div>
						<div className='w-[100%] flex items-center justify-center my-2'>
							<button
								onClick={() => setShowPanel("cell")}
								// className='btn btn-secondary btn-xs w-[90%]'
								className={
									"btn btn-xs w-[90%] " +
									(showPanel == "cell"
										? "btn-primary"
										: "btn-secondary")
								}
							>
								Cell
							</button>
						</div>
					</div>
				</div>
			</details>
			{/* <div id="settingsPopUp" className='dropdown dropdown-top rounded-2xl w-[100%] h-[70%]'>
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
			<div
				tabIndex={0}
				className='outline outline-base outline-1 dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-80 overflow-visable'
			>
				{panels[showPanel]}
				<div className='grid grid-cols-3 bg-base-200 rounded-xl px-2 mt-2'>
					<div className='w-[100%] flex items-center justify-center my-2'>
						<button
							onClick={() => setShowPanel("bonds")}
							className={
								"btn btn-xs w-[90%] " +
								(showPanel == "bonds"
									? "btn-primary"
									: "btn-secondary")
							}
						>
							Bonds
						</button>
					</div>
					<div className='w-[100%] flex items-center justify-center my-2'>
						<button
							onClick={() => setShowPanel("planes")}
							// className='btn btn-secondary btn-xs w-[90%]'
							className={
								"btn btn-xs w-[90%] " +
								(showPanel == "planes"
									? "btn-primary"
									: "btn-secondary")
							}
						>
							Planes
						</button>
					</div>
					<div className='w-[100%] flex items-center justify-center my-2'>
						<button
							onClick={() => setShowPanel("cell")}
							// className='btn btn-secondary btn-xs w-[90%]'
							className={
								"btn btn-xs w-[90%] " +
								(showPanel == "cell"
									? "btn-primary"
									: "btn-secondary")
							}
						>
							Cell
						</button>
					</div>
				</div>
			</div>
		</div> */}
		</>
	);
}

function StructureView({
	structure,
	label,
	initCameraPosition,
	initLatticePlaneProps,
	initCellBounds,
}) {
	// const structure = props.structure;
	// const label = props.label;

	const [structureGraph, setStructureGraph] = useState(new Graph());
	const [viewGraph, setViewGraph] = useState(new Graph());
	const [bondCutoffs, setBondCutoffs] = useState({});
	const [cellBounds, setCellBounds] = useState(initCellBounds)
	// const [cellBounds, setCellBounds] = useState({
	// 	a: [0.0, 1.0],
	// 	b: [0.0, 1.0],
	// 	c: [0.0, 1.0],
	// });
	const [speciesPairs, setSpeciesPairs] = useState([]);
	const [speciesColors, setSpeciesColors] = useState({});
	const [unitCell, setUnitCell] = useState(<></>);
	const [basis, setBasis] = useState([
		[1.0, 0.0, 0.0],
		[0.0, 1.0, 0.0],
		[0.0, 0.0, 1.0],
	]);
	const [normBasis, setNormBasis] = useState([]);
	// const [centerShift, setCenterShift] = useState([0.0, 0.0, 0.0]);
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
	const [additionalProps, setAdditionalProps] = useState({});
	const [animateView, setAnimateView] = useState({
		view: "a",
		animate: false,
	});
	const [takeScreenShot, setTakeScreenShot] = useState(false);
	const [latticePlaneProps, setLatticePlaneProps] = useState({});
	const [dpr, setDpr] = useState(1);
	const groupRef = useRef(new THREE.Object3D());

	useEffect(() => {
		const fd = new FormData();
		fd.append("structure", JSON.stringify(structure));

		fetch(`http://localhost:${port}/api/structure_to_three`, {
			method: "POST",
			body: fd,
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
				// setCenterShift(data.centerShift);
				setBasis(data.basis);
				setNormBasis(data.normBasis);
				setViewData(data.viewData);
				setAdditionalProps(data.additionalProps);
				setLatticePlaneProps((prevState) => {
					if (Object.keys(initLatticePlaneProps).length === 0) {
						return prevState;
					} else {
						const newPlane = {
							shiftAlongNorm:
								"interfacePlaneShift" in data.additionalProps
									? data.additionalProps.interfacePlaneShift
									: 0.0,
							...initLatticePlaneProps,
						};
						const newPlaneId = uuid();
						return { ...prevState, [newPlaneId]: newPlane };
					}
				});
				// shiftAlongNorm={
				// 	"interfacePlaneShift" in additionalProps
				// 		? additionalProps.interfacePlaneShift
				// 		: 0.0
				// }
				// {...planeProps}
			})
			.catch((err) => {
				console.error(err);
			});
	}, [structure]);

	useEffect(() => {
		// const initViewGraph = getViewGraph({structureGraph, bondCutoffs})
		setViewGraph(
			getViewGraph({ structureGraph, bondCutoffs, basis, cellBounds })
		);
	}, [structureGraph, bondCutoffs, basis, cellBounds]);

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

	const topRow = (
		<div className='grid grid-cols-6 flex-auto justify-center items-center gap-4 mx-4'>
			<div className='col-span-1'>
				<StructureViewPopUp
					bondCutoffs={bondCutoffs}
					setBondCutoffs={setBondCutoffs}
					latticePlaneProps={latticePlaneProps}
					setLatticePlaneProps={setLatticePlaneProps}
					cellBounds={cellBounds}
					setCellBounds={setCellBounds}
					speciesPairs={speciesPairs}
					speciesColors={speciesColors}
				/>
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

	const newCenterShift = getCenterShift({ basis: basis, bounds: cellBounds });
	const structureRef = useRef();
	console.log(structureRef);

	// const api = useBounds()

	const mergedGeoms = StructureGeometry({
		viewGraph: viewGraph,
		bounds: cellBounds,
	});

	// console.log(mergedGeoms)
	// api.refresh(mergedGeoms).fit()

	return (
		<DisplayCard topContents={topRow} bottomContents={bottomButtons}>
			{structureGraph.order > 0 ? (
				<Display
					dpr={dpr}
					initCameraPosition={viewData[initCameraPosition].lookAt}
				>
					<group ref={groupRef} position={newCenterShift}>
						<Bounds fit clip margin={1.4} fixedOrientation>
							<mesh
								ref={structureRef}
								geometry={mergedGeoms}
								material={
									new THREE.MeshPhongMaterial({
										vertexColors: true,
									})
								}
							/>
						</Bounds>
						{Object.keys(latticePlaneProps).length > 0 ? (
							Object.keys(latticePlaneProps).map((key, index) => {
								return (
									<LatticePlane
										key={uuid()}
										basis={basis}
										cellBounds={cellBounds}
										centerShift={newCenterShift}
										{...latticePlaneProps[key]}
									/>
								);
							})
						) : (
							<></>
						)}
						{/* // <LatticePlane key={uuid()} basis={basis} millerIndex={[0, 0, 1]} alpha={0.7} color={"white"} lineWidth={1.0} shiftAlongNorm={-0.5}/> */}
						{unitCell}
					</group>
					{/* <Viewcube basis={normBasis} /> */}
					<GizmoHelper alignment='bottom-left' margin={[60, 60]}>
						<ambientLight intensity={3.0} />
						<pointLight position={[0, 0, 100]} intensity={4000} />
						<BasisVectors
							basis={normBasis}
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

function Zoom(props) {
	const api = useBounds();

	return (
		<group
			onClick={(e) => (
				e.stopPropagation(), e.delta <= 2 && api.refresh(e.object).fit()
			)}
			onPointerMissed={(e) => e.button === 0 && api.refresh().fit()}
		>
			{props.children}
		</group>
	);
}

function Viewcube({
	renderPriority = 1,
	matrix = new THREE.Matrix4(),
	basis,
	...props
}) {
	const mesh = useRef(null);
	const { camera } = useThree();
	const [hovered, hover] = useState(null);

	useFrame(() => {
		// Spin mesh to the inverse of the default cameras matrix
		matrix.copy(camera.matrix).invert();
		mesh.current.quaternion.setFromRotationMatrix(matrix);
	});

	return (
		<Hud renderPriority={renderPriority}>
			<OrthographicCamera makeDefault position={[0, 0, 100]} />

			<mesh
				ref={mesh}
				//position={[size.width / 2 - 120, size.height / 2 - 120, 0]}
				onPointerOut={(e) => hover(null)}
				onPointerMove={(e) => hover(e.face.materialIndex)}
			>
				{[...Array(6)].map((_, index) => (
					<meshLambertMaterial
						attach={`material-${index}`}
						key={index}
						color={hovered === index ? "orange" : "hotpink"}
					/>
				))}
				{/* <boxGeometry args={[80, 80, 80]} /> */}
				<BasisVectors
					basis={basis}
					axisColors={["red", "green", "blue"]}
					labelColor='black'
				/>
			</mesh>
			<ambientLight intensity={2} />
			<pointLight position={[0, 0, 100]} intensity={2000} />
		</Hud>
	);
}

StructureView.defaultProps = {
	initCameraPosition: "a",
	initLatticePlaneProps: [],
	initCellBounds: {a: [0, 1], b: [0, 1], c: [0, 1]},
};

export default StructureView;
