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
	const filmCharge = interfaceViewData.filmSurfaceCharge;
	const substrateCharge = interfaceViewData.substrateSurfaceCharge;

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
				<div className="grid grid-cols-1 grid-rows-2 items-center justify-center">
				<div className="inline-block text-center text-lg font-bold">
				{formattedFilmFormula}
				{formattedFilmMillerIndex}/ 
				{formattedSubstrateFormula}
				{formattedSubstrateMillerIndex}
				</div>
				<div className="inline-block text-center text-md font-medium">
				Film/Substrate Termination: {filmTerm}(
				{filmCharge > 0
					? "+" + filmCharge.toString()
					: filmCharge.toString()}
				)/ 
				{substrateTerm}(
				{substrateCharge > 0
					? "+" + substrateCharge.toString()
					: substrateCharge.toString()}
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

	const aLength = interfaceViewData.smallInterfaceStructure.lattice.a
	const bLength = interfaceViewData.smallInterfaceStructure.lattice.b

	const aRepeats = Math.max(2 , Math.ceil(20 / aLength))
	const aShift = Math.floor(aRepeats / 2)
	const bRepeats = Math.max(2, Math.ceil(20 / bLength))
	const bShift = Math.floor(bRepeats / 2)

	const initCellBounds = {
		a: [-aShift, aRepeats - aShift],
		b: [-bShift, bRepeats - bShift],
		c: [0, 1],
	}

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
						}
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
	const interfaceEnergy = parseFloat(1000 *props.data.interfaceEnergy).toFixed(3);
	const adhesionEnergy = parseFloat(1000 * props.data.adhesionEnergy).toFixed(3);
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
	const filmCharge = props.data.filmSurfaceCharge;
	const substrateCharge = props.data.substrateSurfaceCharge;
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
				{filmTerm}(
				{filmCharge > 0
					? "+" + filmCharge.toString()
					: filmCharge.toString()}
				)
			</td>
			<td>
				{substrateTerm}(
				{substrateCharge > 0
					? "+" + substrateCharge.toString()
					: substrateCharge.toString()}
				)
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
	const substrateH = useOptimizeStore((state) => state.substrateH);
	const substrateK = useOptimizeStore((state) => state.substrateK);
	const substrateI = useOptimizeStore((state) => state.substrateI);
	const substrateL = useOptimizeStore((state) => state.substrateL);

	const setSubstrateH = useOptimizeStore((state) => state.setSubstrateH);
	const setSubstrateK = useOptimizeStore((state) => state.setSubstrateK);
	const setSubstrateI = useOptimizeStore((state) => state.setSubstrateI);
	const setSubstrateL = useOptimizeStore((state) => state.setSubstrateL);

	const filmH = useOptimizeStore((state) => state.filmH);
	const filmK = useOptimizeStore((state) => state.filmK);
	const filmI = useOptimizeStore((state) => state.filmI);
	const filmL = useOptimizeStore((state) => state.filmL);

	const setFilmH = useOptimizeStore((state) => state.setFilmH);
	const setFilmK = useOptimizeStore((state) => state.setFilmK);
	const setFilmI = useOptimizeStore((state) => state.setFilmI);
	const setFilmL = useOptimizeStore((state) => state.setFilmL);

	const filmCubic = useOptimizeStore((state) => state.filmCubic);
	const substrateCubic = useOptimizeStore((state) => state.substrateCubic);

	const setFilmCubic = useOptimizeStore((state) => state.setFilmCubic);
	const setSubstrateCubic = useOptimizeStore(
		(state) => state.setSubstrateCubic
	);

	const useStableSubstrate = useOptimizeStore(
		(state) => state.useStableSubstrate
	);
	const setUseStableSubstrate = useOptimizeStore(
		(state) => state.setUseStableSubstrate
	);

	const maxArea = useOptimizeStore((state) => state.maxArea);
	const setMaxArea = useOptimizeStore((state) => state.setMaxArea);

	const maxStrain = useOptimizeStore((state) => state.maxStrain);
	const setMaxStrain = useOptimizeStore((state) => state.setMaxStrain);

	const setFilmMillerIndex = useOptimizeStore(
		(state) => state.setFilmMillerIndex
	);
	const setSubstrateMillerIndex = useOptimizeStore(
		(state) => state.setSubstrateMillerIndex
	);
	const filmMillerIndex = useOptimizeStore((state) => state.filmMillerIndex);
	const substrateMillerIndex = useOptimizeStore(
		(state) => state.substrateMillerIndex
	);

	const setTerminationInds = useOptimizeStore(
		(state) => state.setTerminationInds
	);
	const terminationInds = useOptimizeStore((state) => state.terminationInds);
	const interfaceData = useOptimizeStore((state) => state.interfaceData);
	const setInterfaceData = useOptimizeStore(
		(state) => state.setInterfaceData
	);

	const interfaceViewData = useOptimizeStore(
		(state) => state.interfaceViewData
	);
	const setInterfaceViewData = useOptimizeStore(
		(state) => state.setInterfaceViewData
	);

	const resetOptimize = useOptimizeStore((state) => state.resetOptimize);

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
		resetOptimize();

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
				return res.json();
			})
			.then((data) => {
				setMaxArea(data.maxArea);
				setMaxStrain(data.maxStrain);
				setFilmMillerIndex(data.filmMillerIndex);
				setSubstrateMillerIndex(data.substrateMillerIndex);
				setInterfaceData(data.interfaceData);
				setLoading(false);
				// setTerminationInds(data.terminationInds);
				// console.log(data.interfaces);

				// if (data.terminationInds.length > 0) {
				// 	const rows = [];
				// 	data.terminationInds.forEach((value, index) => {
				// 		console.log(value);
				// 		rows.push(
				// 			<InterfaceRow
				// 				key={uuid()}
				// 				filmTerminationInd={value.film}
				// 				substrateTerminationInd={value.substrate}
				// 				maxArea={data.maxArea}
				// 				maxStrain={data.maxStrain}
				// 				filmMillerIndex={data.filmMillerIndex}
				// 				substrateMillerIndex={data.substrateMillerIndex}
				// 				filmStructure={filmStructure}
				// 				substrateStructure={substrateStructure}
				// 			/>
				// 		);
				// 	});
				// 	setIfaceData(rows);
				// 	// ifaceData = rows;
				// 	// console.log(rows)
				// }
			})
			.catch((err) => {
				console.error(err);
			});
	}

	const tableRows = [];

	if (interfaceData.length > 0) {
		interfaceData.forEach((rowData, index) => {
			tableRows.push(
				<OptimizeRow
					data={rowData}
					key={uuid()}
					setInterfaceViewData={setInterfaceViewData}
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
											defaultChecked={filmCubic}
											onClick={() => setFilmCubic(true)}
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
											defaultChecked={!filmCubic}
											onClick={() => setFilmCubic(false)}
										/>
										<span className='label-text'>
											Hexagonal Notation
										</span>
									</label>
								</p>
								{filmCubic ? (
									<CubicNotationInput
										H={filmH}
										K={filmK}
										L={filmL}
										setH={setFilmH}
										setK={setFilmK}
										setL={setFilmL}
										baseName={"film"}
									/>
								) : (
									<HexagonalNotationInput
										H={filmH}
										K={filmK}
										I={filmI}
										L={filmL}
										setH={setFilmH}
										setK={setFilmK}
										setI={setFilmI}
										setL={setFilmL}
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
											defaultChecked={substrateCubic}
											onClick={() =>
												setSubstrateCubic(true)
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
											defaultChecked={!substrateCubic}
											onClick={() =>
												setSubstrateCubic(false)
											}
										/>
										<span className='label-text'>
											Hexagonal Notation
										</span>
									</label>
								</p>
								{substrateCubic ? (
									<CubicNotationInput
										H={substrateH}
										K={substrateK}
										L={substrateL}
										setH={setSubstrateH}
										setK={setSubstrateK}
										setL={setSubstrateL}
										baseName={"substrate"}
									/>
								) : (
									<HexagonalNotationInput
										H={substrateH}
										K={substrateK}
										I={substrateI}
										L={substrateL}
										setH={setSubstrateH}
										setK={setSubstrateK}
										setI={setSubstrateI}
										setL={setSubstrateL}
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
									defaultValue={maxArea}
									// onChange={(e) => setMaxArea(e.target.value)}
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
									defaultValue={maxStrain}
									// onChange={(e) => setMaxStrain(e.target.value)}
									className={textClassName}
								/>
							</div>
							<div className='flex items-center'>
								<label className='flex flex-y'>
									<input
										className='checkbox checkbox-sm checkbox-secondary mr-3'
										type='checkbox'
										name='stableSubstrate'
										defaultChecked={useStableSubstrate}
										onChange={setUseStableSubstrate}
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
			</div>
			{interfaceViewData}
			{/* <InterfaceRow interfaceViewData={interfaceViewData} /> */}
			{/* {ifaceData} */}
			{/* {testComp} */}
		</>
	);
}

export default OptimizePanel;
