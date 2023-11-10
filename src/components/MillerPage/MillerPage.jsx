import React, { useContext, useState, createElement } from "react";
import BaseCard from "../BaseCard/BaseCard.jsx";
import AppContext from "../AppContext/AppContext.jsx";
import uuid from 'react-uuid'; 

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
		const props = {key: uuid(), ...v[1]};
		filmLabelElements.push(createElement(v[0], props, v[2]));
	});

	const filmLabel = createElement(
		"span",
		{ className: "inline-block w-[100%] text-center" },
		filmLabelElements
	);

	let substrateLabelElements = [];
	substrateMiller.forEach((v) => {
		const props = {key: uuid(), ...v[1]};
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
					<div className='bg-white modal-box max-w-2xl flex justify-center items-center'>
						<form method='dialog'>
							<button className='btn btn-sm btn-circle btn-ghost absolute right-2 top-2'>
								✕
							</button>
						</form>
						<img src={"data:image/png;base64," + imgData} />
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

function MillerPage() {
	const { film, substrate, millerScan } = useContext(AppContext);
	const [filmData, setFilmData] = film;
	const [substrateData, setSubstrateData] = substrate;
	const [millerData, setMillerData] = millerScan;

	function handleSubmit(e) {
		// Prevent the browser from reloading the page
		e.preventDefault();

		// Read the form data
		const form = e.target;
		const fd = new FormData(form);
		fd.append("filmStructure", filmData.structure);
		fd.append("substrateStructure", substrateData.structure);

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
				setMillerData(data["matchData"]);
			})
			.catch((err) => {
				console.error(err);
			});
	}

	const tableRows = [];

	if (millerData.length > 0) {
		millerData.forEach((rowData, index) => {
			tableRows.push(
				<MillerRow
					data={rowData}
					key={uuid()}
				/>
			);
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
									placeholder='2'
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
									placeholder='2'
									className={textClassName}
								/>
							</div>
							<div>
								<label className='text-lg font-medium mb-1'>
									Max Interface Area (optional):
								</label>
								<br></br>
								<input
									type='text'
									id='maxArea'
									name='maxArea'
									placeholder='200'
									className={textClassName}
								/>
							</div>
							<div>
								<label className='text-lg font-medium mb-1'>
									Max Interface Strain:
								</label>
								<br></br>
								<input
									type='text'
									id='maxStrain'
									name='maxStrain'
									placeholder='0.05'
									className={textClassName}
								/>
							</div>
						</div>
						<br></br>
						<button
							type='submit'
							className='btn btn-secondary'
						>
							Run Miller Index Scan
						</button>
					</form>
				</BaseCard>
			</div>
			<div className='md:col-span-2'>
				<BaseCard>
					<div className='overflow-x-auto h-60 scrollbar scrollbar-w-2 scrollbar-h-2 scrollbar-thumb-rounded-full scrollbar-thumb-accent'>
						<table className='table table-pin-rows table-pin-cols text-lg text-center'>
							<thead className="text-lg">
								<tr>
									<th></th>
									<td>Film Miller Index</td>
									<td>Substrate Miller Index</td>
									<td>Strain (%)</td>
									<td><span>A<sub>Iface</sub> (<span>&#8491;</span><sup>2</sup>)</span></td>
									<td><span>A<sub>Iface</sub>/(A<sub>Film</sub> <span>&#183;</span> A<sub>Sub</sub>)<sup>1/2</sup></span></td>
								</tr>
							</thead>
							<tbody>{tableRows}</tbody>
						</table>
					</div>
				</BaseCard>
			</div>
		</>
	);
}

export default MillerPage;
