import React, { useEffect, useMemo, useState } from "react";
import BaseCard from "../../components/BaseCard/BaseCard.jsx";
import TestOpt from "../../components/TestOpt/TestOpt.jsx";
import TwoColumnDisplay from "../../components/TwoColumnDisplay/TwoColumnDisplay.jsx";
import useOptimizeStore from "../../stores/optimizeStore";
import useBulkStore from "../../stores/bulkStore";
import uuid from "react-uuid";
import {
	getFormattedFormula,
	getFormattedMillerIndex,
} from "../../utils/makeLabel.jsx";
import ErrorPanel from "../ErrorPanel/ErrorPanel.jsx";

const { ipcRenderer } = window;
const port = ipcRenderer.sendSync("get-port-number");

function CubicNotationInput({ H, K, L, setH, setK, setL, baseName }) {
	const millerClassName =
		"input input-sm input-bordered input-base-content w-10 ml-1 mr-3 text-center";
	const textClassName = "input input-sm input-bordered input-base-content";

	return (
		<div className='flex'>
			<div className=''>
				<label className='block mb-2 text-md'>
					h:
					<input
						type='text'
						id={`${baseName}H`}
						placeholder='0'
						name={`${baseName}H`}
						defaultValue={H}
						className={millerClassName}
						onChange={(e) => setH(parseInt(e.target.value))}
					/>
				</label>
			</div>
			<div className=''>
				<label className='block mb-2 text-md'>
					k:
					<input
						type='text'
						id={`${baseName}K`}
						placeholder='0'
						name={`${baseName}K`}
						defaultValue={K}
						className={millerClassName}
						onChange={(e) => setK(parseInt(e.target.value))}
					/>
				</label>
			</div>
			<div className=''>
				<label className='block mb-2 text-md'>
					l:
					<input
						type='text'
						id={`${baseName}L`}
						placeholder='1'
						name={`${baseName}L`}
						defaultValue={L}
						className={millerClassName}
						onChange={(e) => setL(parseInt(e.target.value))}
					/>
				</label>
			</div>
		</div>
	);
}

function HexagonalNotationInput({
	H,
	K,
	I,
	L,
	setH,
	setK,
	setI,
	setL,
	baseName,
}) {
	const millerClassName =
		"input input-sm input-bordered input-base-content w-10 ml-1 mr-3 text-center";

	return (
		<div className='flex'>
			<div className=''>
				<label className='block mb-2 text-md'>
					h:
					<input
						type='text'
						id={`${baseName}H`}
						placeholder='0'
						name={`${baseName}H`}
						defaultValue={H}
						className={millerClassName}
						onChange={(e) => setH(parseInt(e.target.value))}
					/>
				</label>
			</div>
			<div className=''>
				<label className='block mb-2 text-md'>
					k:
					<input
						type='text'
						id={`${baseName}K`}
						placeholder='0'
						name={`${baseName}K`}
						defaultValue={K}
						className={millerClassName}
						onChange={(e) => setK(parseInt(e.target.value))}
					/>
				</label>
			</div>
			<div className=''>
				<label className='block mb-2 text-md'>
					i:
					<input
						type='text'
						id={`${baseName}I`}
						placeholder='0'
						name={`${baseName}I`}
						value={-(H + K)}
						className={millerClassName}
						onChange={(e) => setI(parseInt(e.target.value))}
					/>
				</label>
			</div>
			<div className=''>
				<label className='block mb-2 text-md'>
					l:
					<input
						type='text'
						id={`${baseName}L`}
						placeholder='1'
						name={`${baseName}L`}
						defaultValue={L}
						className={millerClassName}
						onChange={(e) => setL(parseInt(e.target.value))}
					/>
				</label>
			</div>
		</div>
	);
}

function InterfaceRow({ interfaceViewData }) {
	console.log(interfaceViewData);
	const bulkStore = useBulkStore();
	const optimizeStore = useOptimizeStore();
	const formattedFilmFormula = getFormattedFormula({
		formula: bulkStore.filmFormula,
	});
	const formattedFilmMillerIndex = getFormattedMillerIndex({
		millerIndex: optimizeStore.filmMillerIndex,
	});
	const formattedSubstrateFormula = getFormattedFormula({
		formula: bulkStore.substrateFormula,
	});
	const formattedSubstrateMillerIndex = getFormattedMillerIndex({
		millerIndex: optimizeStore.substrateMillerIndex,
	});
	const filmTerm = getFormattedFormula({
		formula: interfaceViewData.filmTerminationComp,
	});
	const substrateTerm = getFormattedFormula({
		formula: interfaceViewData.substrateTerminationComp,
	});
	const filmCharge = `${parseFloat(
		parseFloat(interfaceViewData.filmSurfaceCharge).toFixed(2)
	)}`;
	const substrateCharge = `${parseFloat(
		parseFloat(interfaceViewData.substrateSurfaceCharge).toFixed(2)
	)}`;

	const pesID = "pes_modal_" + uuid();
	const zshiftID = "zshift_modal_" + uuid();

	const ifaceTitle = (
		<div className='grid grid-cols-7 flex-auto justify-center items-center gap-4 mx-4'>
			<div className='col-span-1'>
				<div
					onClick={() => document.getElementById(pesID).showModal()}
					className='p-0 m-0 btn btn-neutral btn-outline focus:btn-accent focus:btn-outline rounded-2xl w-[100%] max-w-[100%] h-[70%]'
				>
					View PES
				</div>
				<dialog id={pesID} className='modal'>
					<div
						// className='bg-white modal-box max-w-2xl flex justify-center items-center'
						// className='bg-white max-w-2xl modal-box flex justify-center items-center'
						className='bg-white max-w-[80vw] max-h-[80vh] flex relative rounded-2xl p-8 justify-center items-center z-20'
						style={{ aspectRatio: "1/1" }}
					>
						<form method='dialog'>
							<button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'>
								✕
							</button>
						</form>
						<img
							className='object-contain'
							src={
								"data:image/png;base64," +
								interfaceViewData.pesFigure
							}
						/>
					</div>
				</dialog>
			</div>
			{/* <div className='col-span-5 flex justify-center items-center text-lg font-bold'>
				{formattedFilmFormula}
				{formattedFilmMillerIndex}
				<span>&nbsp;</span>[{filmTerm}(
				{filmCharge > 0
					? "+" + filmCharge.toString()
					: filmCharge.toString()}
				)] / {formattedSubstrateFormula}
				{formattedSubstrateMillerIndex}
				<span>&nbsp;</span>[{substrateTerm}(
				{substrateCharge > 0
					? "+" + substrateCharge.toString()
					: substrateCharge.toString()}
				)]
			</div> */}
			<div className='col-span-5 flex justify-center items-center'>
				<div className='grid grid-cols-1 grid-rows-2 items-center justify-center'>
					<div className='inline-block text-center text-lg font-bold'>
						{formattedFilmFormula}
						{formattedFilmMillerIndex}/{formattedSubstrateFormula}
						{formattedSubstrateMillerIndex}
					</div>
					<div className='inline-block text-center text-md font-medium'>
						Film/Substrate Termination: {filmTerm}(
						{filmCharge > 0 ? "+" + filmCharge : filmCharge}
						)/
						{substrateTerm}(
						{substrateCharge > 0
							? "+" + substrateCharge
							: substrateCharge}
						)
					</div>
				</div>
			</div>
			<div className='col-span-1'>
				<div
					onClick={() =>
						document.getElementById(zshiftID).showModal()
					}
					className='p-0 m-0 btn btn-neutral btn-outline focus:btn-accent focus:btn-outline rounded-2xl w-[100%] max-w-[100%] h-[70%]'
				>
					View z-shift
				</div>
				<dialog id={zshiftID} className='modal'>
					<div
						// className='bg-white modal-box max-w-2xl flex justify-center items-center'
						// className='bg-white max-w-2xl modal-box flex justify-center items-center'
						className='bg-white max-w-[80vw] max-h-[80vh] flex relative rounded-2xl p-8 justify-center items-center z-20'
						style={{ aspectRatio: "1/1" }}
					>
						<form method='dialog'>
							<button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'>
								✕
							</button>
						</form>
						<img
							className='object-contain'
							src={
								"data:image/png;base64," +
								interfaceViewData.zShiftFigure
							}
						/>
					</div>
				</dialog>
			</div>
		</div>
	);

	const topLabel = (
		<span className='inline-block h-[100%] w-[100%] text-center'>
			Surface Atoms Only
		</span>
	);

	const sideLabel = (
		<span className='inline-block h-[100%] w-[100%] text-center'>
			Full Interface Structure
		</span>
	);

	const aLength = interfaceViewData.smallInterfaceStructure.lattice.a;
	const bLength = interfaceViewData.smallInterfaceStructure.lattice.b;

	const aRepeats = Math.max(2, Math.ceil(20 / aLength));
	const aShift = Math.floor(aRepeats / 2);
	const bRepeats = Math.max(2, Math.ceil(20 / bLength));
	const bShift = Math.floor(bRepeats / 2);

	const initCellBounds = {
		a: [-aShift, aRepeats - aShift],
		b: [-bShift, bRepeats - bShift],
		c: [0, 1],
	};

	console.log(interfaceViewData.smallInterfaceStructure);

	return (
		<>
			{interfaceViewData === "" ? (
				<></>
			) : (
				<TwoColumnDisplay
					title={ifaceTitle}
					leftStructure={interfaceViewData.smallInterfaceStructure}
					leftLabel={topLabel}
					leftInitCameraPosition={"c"}
					leftInitLatticePlaneProps={{
						millerIndex: [0, 0, 1],
						alpha: 0.6,
						color: "#ffffff",
						lineWidth: 1.0,
						colorState: {
							hex: "#ffffff",
							rgb: { r: 255, g: 255, b: 255, a: 0.6 },
						},
					}}
					leftInitCellBounds={initCellBounds}
					rightStructure={interfaceViewData.fullInterfaceStructure}
					rightLabel={sideLabel}
					rightInitCameraPosition={"a"}
					rightInitLatticePlaneProps={{}}
					rightInitCellBounds={initCellBounds}
				/>
			)}
		</>
	);
}

function OptimizeRow(props) {
	console.log(props);
	const interfaceEnergy = parseFloat(
		1000 * props.data.interfaceEnergy
	).toFixed(3);
	const adhesionEnergy = parseFloat(1000 * props.data.adhesionEnergy).toFixed(
		3
	);
	const area = parseFloat(props.data.area).toFixed(3);
	const strain = parseFloat(props.data.strain).toFixed(3);
	const filmIndex = parseInt(props.data.filmIndex);
	const substrateIndex = parseInt(props.data.substrateIndex);
	const filmTerm = getFormattedFormula({
		formula: props.data.filmTerminationComp,
	});
	const substrateTerm = getFormattedFormula({
		formula: props.data.substrateTerminationComp,
	});
	// const filmCharge = parseFloat(props.data.filmSurfaceCharge).toFixed(2);
	// const substrateCharge = parseFloat(props.data.substrateSurfaceCharge).toFixed(2);
	const filmCharge = `${parseFloat(
		parseFloat(props.data.filmSurfaceCharge).toFixed(2)
	)}`;
	const substrateCharge = `${parseFloat(
		parseFloat(props.data.substrateSurfaceCharge).toFixed(2)
	)}`;
	const interfacialDistance = parseFloat(
		props.data.interfacialDistance
	).toFixed(3);
	const imgData = props.data.pesFigure;

	// getFormattedFormula
	// getFormattedFormula({formula: substrateTerm})
	// console.log(filmCharge)
	const rowID = "optimize_popup_" + uuid();

	return (
		<tr>
			{/* <th>
				<button
					className='btn btn-sm btn-secondary'
					onClick={() => document.getElementById(rowID).showModal()}
				>
					View
				</button>
				<dialog id={rowID} className='modal'>
					<div
						// className='bg-white modal-box max-w-2xl flex justify-center items-center'
						className='bg-white max-w-2xl modal-box aspect-square flex justify-center items-center'
					>
						<form method='dialog'>
							<button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'>
								✕
							</button>
						</form>
						<img
							className='object-contain w-[85%]'
							src={"data:image/png;base64," + imgData}
						/>
					</div>
				</dialog>
			</th> */}
			<th>
				<button
					className='btn btn-sm btn-secondary'
					onClick={() => {
						props.setInterfaceViewData(
							<InterfaceRow
								key={uuid()}
								interfaceViewData={props.data}
							/>
						);
					}}
				>
					View
				</button>
			</th>
			<td>{interfaceEnergy}</td>
			<td>{adhesionEnergy}</td>
			<td>
				{filmTerm}({filmCharge > 0 ? "+" + filmCharge : filmCharge})
			</td>
			<td>
				{substrateTerm}(
				{substrateCharge > 0 ? "+" + substrateCharge : substrateCharge})
			</td>
			<td>{interfacialDistance}</td>
			<td>{filmIndex}</td>
			<td>{substrateIndex}</td>
			<td>{strain}</td>
			<td>{area}</td>
		</tr>
	);
}

function OptimizeTable(props) {
	return (
		<div className='overflow-x-auto flex max-h-60 scrollbar scrollbar-w-2 scrollbar-h-2 scrollbar-thumb-rounded-full scrollbar-thumb-accent'>
			<table className='table table-pin-rows table-pin-cols text-lg text-center'>
				<thead className='text-lg'>
					<tr>
						<th>
							{props.totalEnergyImgData === "" ? (
								<></>
							) : (
								<>
									<button
										className='btn btn-sm btn-secondary'
										onClick={() =>
											document
												.getElementById(
													"optimize_header_button"
												)
												.showModal()
										}
									>
										View All
									</button>
									<dialog
										id='optimize_header_button'
										className='modal'
									>
										<div
											className='bg-white max-w-[80vw] max-h-[80vh] flex relative rounded-2xl p-4 justify-center items-center z-20'
											style={{
												aspectRatio:
													props.totalEnergyAspectRatio,
											}}
										>
											<form method='dialog'>
												<button className='btn btn-sm btn-circle btn-ghost right-2 top-2 float-right absolute z-50'>
													✕
												</button>
											</form>
											<img
												className='object-contain z-30'
												src={
													"data:image/png;base64," +
													props.totalEnergyImgData
												}
											/>
										</div>
									</dialog>
								</>
							)}
						</th>
						<td>
							E<sub>interface</sub> (meV/<span>&#8491;</span>
							<sup>2</sup>)
						</td>
						<td>
							E<sub>adhesion</sub> (meV/<span>&#8491;</span>
							<sup>2</sup>)
						</td>
						<td>Film Termination (charge)</td>
						<td>Substrate Termination (charge)</td>
						<td>
							Interfacial Distance (<span>&#8491;</span>)
						</td>
						<td>Film Index</td>
						<td>Substrate Index</td>
						<td>Strain (%)</td>
						<td>
							<span>
								A<sub>Iface</sub> (<span>&#8491;</span>
								<sup>2</sup>)
							</span>
						</td>
					</tr>
				</thead>
				<tbody>{props.children}</tbody>
			</table>
		</div>
	);
}

function OptimizePanel() {
	const optimizeStore = useOptimizeStore();
	// const optimizeStore.substrateH = useOptimizeStore((state) => state.optimizeStore.substrateH);
	// const optimizeStore.substrateK = useOptimizeStore((state) => state.optimizeStore.substrateK);
	// const optimizeStore.substrateI = useOptimizeStore((state) => state.optimizeStore.substrateI);
	// const optimizeStore.substrateL = useOptimizeStore((state) => state.optimizeStore.substrateL);

	// const optimizeStore.setSubstrateH = useOptimizeStore((state) => state.optimizeStore.setSubstrateH);
	// const optimizeStore.setSubstrateK = useOptimizeStore((state) => state.optimizeStore.setSubstrateK);
	// const optimizeStore.setSubstrateI = useOptimizeStore((state) => state.optimizeStore.setSubstrateI);
	// const optimizeStore.setSubstrateL = useOptimizeStore((state) => state.optimizeStore.setSubstrateL);

	// const optimizeStore.filmH = useOptimizeStore((state) => state.optimizeStore.filmH);
	// const optimizeStore.filmK = useOptimizeStore((state) => state.optimizeStore.filmK);
	// const optimizeStore.filmI = useOptimizeStore((state) => state.optimizeStore.filmI);
	// const optimizeStore.filmL = useOptimizeStore((state) => state.optimizeStore.filmL);

	// const optimizeStore.setFilmH = useOptimizeStore((state) => state.optimizeStore.setFilmH);
	// const optimizeStore.setFilmK = useOptimizeStore((state) => state.optimizeStore.setFilmK);
	// const optimizeStore.setFilmI = useOptimizeStore((state) => state.optimizeStore.setFilmI);
	// const optimizeStore.setFilmL = useOptimizeStore((state) => state.optimizeStore.setFilmL);

	// const optimizeStore.filmCubic = useOptimizeStore((state) => state.optimizeStore.filmCubic);
	// const optimizeStore.substrateCubic = useOptimizeStore((state) => state.optimizeStore.substrateCubic);

	// const optimizeStore.setFilmCubic = useOptimizeStore((state) => state.optimizeStore.setFilmCubic);
	// const optimizeStore.setSubstrateCubic = useOptimizeStore(
	// 	(state) => state.optimizeStore.setSubstrateCubic
	// );

	// const optimizeStore.useStableSubstrate = useOptimizeStore(
	// 	(state) => state.optimizeStore.useStableSubstrate
	// );
	// const optimizeStore.setUseStableSubstrate = useOptimizeStore(
	// 	(state) => state.optimizeStore.setUseStableSubstrate
	// );

	// const optimizeStore.maxArea = useOptimizeStore((state) => state.optimizeStore.maxArea);
	// const optimizeStore.setMaxArea = useOptimizeStore((state) => state.optimizeStore.setMaxArea);

	// const optimizeStore.maxStrain = useOptimizeStore((state) => state.optimizeStore.maxStrain);
	// const optimizeStore.setMaxStrain = useOptimizeStore((state) => state.optimizeStore.setMaxStrain);

	// const optimizeStore.setFilmMillerIndex = useOptimizeStore(
	// 	(state) => state.optimizeStore.setFilmMillerIndex
	// );
	// const optimizeStore.setSubstrateMillerIndex = useOptimizeStore(
	// 	(state) => state.optimizeStore.setSubstrateMillerIndex
	// );
	// const filmMillerIndex = useOptimizeStore((state) => state.filmMillerIndex);
	// const substrateMillerIndex = useOptimizeStore(
	// 	(state) => state.substrateMillerIndex
	// );

	// const setTerminationInds = useOptimizeStore(
	// 	(state) => state.setTerminationInds
	// );
	// const terminationInds = useOptimizeStore((state) => state.terminationInds);
	// const optimizeStore.interfaceData = useOptimizeStore((state) => state.optimizeStore.interfaceData);
	// const optimizeStore.setInterfaceData = useOptimizeStore(
	// 	(state) => state.optimizeStore.setInterfaceData
	// );

	// const optimizeStore.interfaceViewData = useOptimizeStore(
	// 	(state) => state.optimizeStore.interfaceViewData
	// );
	// const optimizeStore.setInterfaceViewData = useOptimizeStore(
	// 	(state) => state.optimizeStore.setInterfaceViewData
	// );

	// const optimizeStore.resetOptimize = useOptimizeStore((state) => state.optimizeStore.resetOptimize);

	const filmStructure = useBulkStore((state) => state.filmStructure);
	const substrateStructure = useBulkStore(
		(state) => state.substrateStructure
	);

	const textClassName = "input input-sm input-bordered input-base-content";

	const [loading, setLoading] = useState(false);

	// const [ifaceData, setIfaceData] = useState(<></>);

	function handleSubmit(e) {
		// Prevent the browser from reloading the page
		e.preventDefault();
		setLoading(true);
		optimizeStore.resetOptimize();

		// Read the form data
		const form = e.target;
		const fd = new FormData(form);
		fd.append("filmStructure", JSON.stringify(filmStructure));
		fd.append("substrateStructure", JSON.stringify(substrateStructure));

		fetch(`http://localhost:${port}/api/optimize_interface`, {
			method: "POST",
			body: fd,
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error("Bad Response");
				}
				setLoading(false);
				return res.json();
			})
			.then((data) => {
				if (data === "TolarenceError") {
					optimizeStore.setTolarenceError();
				} else {
					console.log("DATA = ", data);
					optimizeStore.setMaxArea(data.maxArea);
					optimizeStore.setMaxStrain(data.maxStrain);
					optimizeStore.setFilmMillerIndex(data.filmMillerIndex);
					optimizeStore.setSubstrateMillerIndex(
						data.substrateMillerIndex
					);
					optimizeStore.setInterfaceData(data.interfaceData);
					setLoading(false);
				}
			})
			.catch((err) => {
				console.error(err);
			});
	}

	const tableRows = [];

	if (optimizeStore.interfaceData.length > 0) {
		optimizeStore.interfaceData.forEach((rowData, index) => {
			tableRows.push(
				<OptimizeRow
					data={rowData}
					key={uuid()}
					setInterfaceViewData={optimizeStore.setInterfaceViewData}
				/>
			);
		});
	}

	return (
		<>
			<div className='md:col-span-2'>
				<BaseCard>
					<form method='post' onSubmit={handleSubmit}>
						<div className='grid flex-auto grid-cols-2 gap-4'>
							<div>
								<p className='text-lg font-medium mb-1'>
									Film Miller Index:
								</p>
								<p className='flex flex-x text-md mb-3'>
									<label className='flex flex-y'>
										<input
											className='radio radio-sm radio-secondary mr-1'
											type='radio'
											name='filmMillerType'
											value='cubic'
											defaultChecked={
												optimizeStore.filmCubic
											}
											onClick={() =>
												optimizeStore.setFilmCubic(true)
											}
										/>
										<span className='label-text'>
											Cubic Notation
										</span>
									</label>
									<label className='flex flex-y'>
										<input
											className='radio radio-sm radio-secondary ml-3 mr-1'
											type='radio'
											name='filmMillerType'
											value='hexagonal'
											defaultChecked={
												!optimizeStore.filmCubic
											}
											onClick={() =>
												optimizeStore.setFilmCubic(
													false
												)
											}
										/>
										<span className='label-text'>
											Hexagonal Notation
										</span>
									</label>
								</p>
								{optimizeStore.filmCubic ? (
									<CubicNotationInput
										H={optimizeStore.filmH}
										K={optimizeStore.filmK}
										L={optimizeStore.filmL}
										setH={optimizeStore.setFilmH}
										setK={optimizeStore.setFilmK}
										setL={optimizeStore.setFilmL}
										baseName={"film"}
									/>
								) : (
									<HexagonalNotationInput
										H={optimizeStore.filmH}
										K={optimizeStore.filmK}
										I={optimizeStore.filmI}
										L={optimizeStore.filmL}
										setH={optimizeStore.setFilmH}
										setK={optimizeStore.setFilmK}
										setI={optimizeStore.setFilmI}
										setL={optimizeStore.setFilmL}
										baseName={"film"}
									/>
								)}
							</div>
							<div>
								<p className='text-lg font-medium mb-1'>
									Substrate Miller Index:
								</p>
								<p className='flex flex-x text-md mb-3'>
									<label className='flex flex-y'>
										<input
											className='radio radio-sm radio-secondary mr-1'
											type='radio'
											name='substrateMillerType'
											value='cubic'
											defaultChecked={
												optimizeStore.substrateCubic
											}
											onClick={() =>
												optimizeStore.setSubstrateCubic(
													true
												)
											}
										/>
										<span className='label-text'>
											Cubic Notation
										</span>
									</label>
									<label className='flex flex-y'>
										<input
											className='radio radio-sm radio-secondary ml-3 mr-1'
											type='radio'
											name='substrateMillerType'
											value='hexagonal'
											defaultChecked={
												!optimizeStore.substrateCubic
											}
											onClick={() =>
												optimizeStore.setSubstrateCubic(
													false
												)
											}
										/>
										<span className='label-text'>
											Hexagonal Notation
										</span>
									</label>
								</p>
								{optimizeStore.substrateCubic ? (
									<CubicNotationInput
										H={optimizeStore.substrateH}
										K={optimizeStore.substrateK}
										L={optimizeStore.substrateL}
										setH={optimizeStore.setSubstrateH}
										setK={optimizeStore.setSubstrateK}
										setL={optimizeStore.setSubstrateL}
										baseName={"substrate"}
									/>
								) : (
									<HexagonalNotationInput
										H={optimizeStore.substrateH}
										K={optimizeStore.substrateK}
										I={optimizeStore.substrateI}
										L={optimizeStore.substrateL}
										setH={optimizeStore.setSubstrateH}
										setK={optimizeStore.setSubstrateK}
										setI={optimizeStore.setSubstrateI}
										setL={optimizeStore.setSubstrateL}
										baseName={"substrate"}
									/>
								)}
							</div>
							<div>
								<label className='text-lg font-medium mb-1'>
									Max Interface Area (<span>&#8491;</span>
									<sup>2</sup>):
								</label>
								<br></br>
								<input
									type='text'
									id='maxArea'
									name='maxArea'
									placeholder='optional'
									defaultValue={optimizeStore.maxArea}
									// onChange={(e) => optimizeStore.setMaxArea(e.target.value)}
									className={textClassName}
								/>
							</div>
							<div>
								<label className='text-lg font-medium mb-1'>
									Max Interface Strain (%):
								</label>
								<br></br>
								<input
									type='text'
									id='maxStrain'
									name='maxStrain'
									placeholder='3.0'
									defaultValue={optimizeStore.maxStrain}
									// onChange={(e) => optimizeStore.setMaxStrain(e.target.value)}
									className={textClassName}
								/>
							</div>
							<div className='flex items-center'>
								<label className='flex flex-y'>
									<input
										className='checkbox checkbox-sm checkbox-secondary mr-3'
										type='checkbox'
										name='stableSubstrate'
										defaultChecked={
											optimizeStore.useStableSubstrate
										}
										onChange={
											optimizeStore.setUseStableSubstrate
										}
									/>
									Use most stable substrate?
								</label>
							</div>
							<div>
								<button
									type='submit'
									className='btn btn-secondary'
									// onClick={handleSubmit}
								>
									Optimize Interface
								</button>
							</div>
						</div>
					</form>
				</BaseCard>
			</div>
			<div className='md:col-span-2'>
				{optimizeStore.tolarenceError ? (
					<ErrorPanel title={"!!! No Interface Found !!!"} message={"Please try increasing the max strain/max area"}/>
				) : (
					<BaseCard>
						<OptimizeTable
							totalEnergyImgData={""}
							totalEnergyAspectRatio={""}
						>
							{tableRows}
						</OptimizeTable>
						{loading ? (
							<div className='flex items-center justify-center w-[100%] mt-4'>
								<span className='loading loading-bars loading-lg'></span>
							</div>
						) : (
							<></>
						)}
					</BaseCard>
				)}
			</div>
			{optimizeStore.interfaceViewData}
			{/* <InterfaceRow optimizeStore.interfaceViewData={optimizeStore.interfaceViewData} /> */}
			{/* {ifaceData} */}
			{/* {testComp} */}
		</>
	);
}

export default OptimizePanel;
