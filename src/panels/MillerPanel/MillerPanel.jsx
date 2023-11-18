import React, { useContext, useState, createElement, useRef } from "react";
import BaseCard from "../../components/BaseCard/BaseCard.jsx";
import AppContext from "../../components/AppContext/AppContext.jsx";
import uuid from "react-uuid";
import useMillerStore from "../../stores/millerStore.js";
import useBulkStore from "../../stores/bulkStore.js";

const { ipcRenderer } = window;
const port = ipcRenderer.sendSync("get-port-number");

function MillerRow(props) {
	const filmMiller = props.data.filmMillerIndex;
	const substrateMiller = props.data.substrateMillerIndex;
	const area = props.data.matchArea;
	const relativeArea = props.data.matchRelativeArea;
	const strain = props.data.matchStrain;
	const imgData = props.data.matchPlot;

	let filmLabelElements = [];
	filmMiller.forEach((v) => {
		const props = { key: uuid(), ...v[1] };
		filmLabelElements.push(createElement(v[0], props, v[2]));
	});

	const filmLabel = createElement(
		"span",
		{ className: "inline-block w-[100%] text-center" },
		filmLabelElements
	);

	let substrateLabelElements = [];
	substrateMiller.forEach((v) => {
		const props = { key: uuid(), ...v[1] };
		substrateLabelElements.push(createElement(v[0], props, v[2]));
	});

	const substrateLabel = createElement(
		"span",
		{ className: "inline-block w-[100%] text-center" },
		substrateLabelElements
	);

	const rowID = "miller_popup_" + uuid();

	return (
		<tr>
			<th>
				<button
					className='btn btn-sm btn-secondary'
					onClick={() => document.getElementById(rowID).showModal()}
				>
					View
				</button>
				<dialog id={rowID} className='modal'>
					<div
						// className='bg-white modal-box max-w-2xl flex justify-center items-center'
						className='bg-white max-w-2xl modal-box flex justify-center items-center'
					>
						<form method='dialog'>
							<button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'>
								✕
							</button>
						</form>
						<img
							className='object-contain'
							src={"data:image/png;base64," + imgData}
						/>
					</div>
				</dialog>
			</th>
			<td>{filmLabel}</td>
			<td>{substrateLabel}</td>
			<td>{strain}</td>
			<td>{area}</td>
			<td>{relativeArea}</td>
		</tr>
	);
}

function MillerPanel() {
	// const { film, substrate, millerScan } = useContext(AppContext);
	// const [filmData, setFilmData] = film;
	// const [substrateData, setSubstrateData] = substrate;
	// const [millerData, setMillerData] = millerScan;
	// console.log(useMillerStore());
	const {
		matchList,
		maxArea,
		maxFilmIndex,
		maxSubstrateIndex,
		maxStrain,
		totalMatchImgData,
		totalMatchAspectRatio,
		setMatchList,
		setMaxArea,
		setMaxStrain,
		setMaxFilmIndex,
		setMaxSubstrateIndex,
		setTotalMatchAspectRatio,
		setTotalMatchImgData,
		resetMiller,
	} = useMillerStore();
	console.log(matchList);
	console.log(maxArea);
	const filmStructure = useBulkStore((state) => state.filmStructure);
	const substrateStructure = useBulkStore(
		(state) => state.substrateStructure
	);

	const [loading, setLoading] = useState(false);

	function handleSubmit(e) {
		// Prevent the browser from reloading the page

		
		// setMillerData({ matchData: [], matchPlot: "" });
		e.preventDefault();
		setLoading(true);
		resetMiller();

		// Read the form data
		const form = e.target;
		console.log(form)
		const fd = new FormData(form);
		fd.append("filmStructure", filmStructure);
		fd.append("substrateStructure", substrateStructure);

		// You can pass formData as a fetch body directly:
		fetch(`http://localhost:${port}/api/miller_scan`, {
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
				setMaxSubstrateIndex(data.maxSubstrateIndex);
				setMaxFilmIndex(data.maxFilmIndex);
				setMatchList(data.matchList);
				setTotalMatchImgData(data.totalImgData);
				setTotalMatchAspectRatio(data.totalImgAspectRatio);
				// setMillerData({
				// 	matchData: data["matchData"],
				// 	matchPlot: data["matchPlot"],
				// });
				setLoading(false);
			})
			.catch((err) => {
				console.error(err);
			});
	}

	const tableRows = [];

	if (matchList.length > 0) {
		matchList.forEach((rowData, index) => {
			tableRows.push(<MillerRow data={rowData} key={uuid()} />);
		});
	}

	const textClassName = "input input-sm input-bordered input-base-content";

	return (
		<>
			<div className='md:col-span-2'>
				<BaseCard>
					<form method='POST' onSubmit={handleSubmit}>
						<div className='grid flex-auto grid-cols-2 gap-4'>
							<div>
								<label className='text-lg font-medium mb-1'>
									Max Film Miller Index:
								</label>
								<br></br>
								<input
									type='text'
									id='maxFilmMiller'
									name='maxFilmMiller'
									placeholder='1'
									defaultValue={maxFilmIndex}
									className={textClassName}
								/>
							</div>
							<div>
								<label className='text-lg font-medium mb-1'>
									Max Substrate Miller Index:
								</label>
								<br></br>
								<input
									type='text'
									id='maxSubstrateMiller'
									name='maxSubstrateMiller'
									placeholder='1'
									defaultValue={maxSubstrateIndex}
									className={textClassName}
								/>
							</div>
							<div>
								<label className='text-lg font-medium mb-1'>
									Max Interface Area (<span>&#8491;</span><sup>2</sup>):
								</label>
								<br></br>
								<input
									type='text'
									id='maxArea'
									name='maxArea'
									placeholder='optional'
									defaultValue={maxArea}
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
									className={textClassName}
								/>
							</div>
						</div>
						<br></br>
						<button type='submit' className='btn btn-secondary'>
							Run Miller Index Scan
						</button>
					</form>
				</BaseCard>
			</div>
			<div className='md:col-span-2'>
				<BaseCard>
					<div className='overflow-x-auto flex max-h-60 scrollbar scrollbar-w-2 scrollbar-h-2 scrollbar-thumb-rounded-full scrollbar-thumb-accent'>
						<table className='table table-pin-rows table-pin-cols text-lg text-center'>
							<thead className='text-lg'>
								<tr>
									<th>
										{totalMatchImgData === "" ? (
											<></>
										) : (
											<>
												<button
													className='btn btn-sm btn-secondary'
													onClick={() =>
														document
															.getElementById(
																"header_button"
															)
															.showModal()
													}
												>
													View All
												</button>
												<dialog
													id='header_button'
													className='modal'
												>
													<div
														className='bg-white max-w-[80vw] max-h-[80vh] flex relative rounded-2xl p-4 justify-center items-center z-20'
														style={{
															aspectRatio: totalMatchAspectRatio,
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
																"data:image/png;base64," + totalMatchImgData
															}
														/>
													</div>
												</dialog>
											</>
										)}
									</th>
									<td>Film Miller Index</td>
									<td>Substrate Miller Index</td>
									<td>Strain (%)</td>
									<td>
										<span>
											A<sub>Iface</sub> (
											<span>&#8491;</span>
											<sup>2</sup>)
										</span>
									</td>
									<td>
										<span>
											A<sub>Iface</sub>/(A<sub>Film</sub>{" "}
											<span>&#183;</span> A<sub>Sub</sub>)
											<sup>1/2</sup>
										</span>
									</td>
								</tr>
							</thead>
							<tbody>{tableRows}</tbody>
						</table>
					</div>
					{loading ? (
						<div className='flex items-center justify-center w-[100%] mt-4'>
							<span className='loading loading-bars loading-lg'></span>
						</div>
					) : (
						<></>
					)}
				</BaseCard>
			</div>
		</>
	);
}

export default MillerPanel;
