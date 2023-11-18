import React, { useEffect, useState } from "react";
import BaseCard from "../../components/BaseCard/BaseCard.jsx";
import TestOpt from "../../components/TestOpt/TestOpt.jsx"

const { ipcRenderer } = window;
const port = ipcRenderer.sendSync("get-port-number");

function OptimizePage() {
	const [filmNotation, setFilmNotation] = useState("cubic");
	const [substrateNotation, setSubstrateNotation] = useState("cubic");
	const [filmH, setFilmH] = useState(NaN);
	const [filmK, setFilmK] = useState(NaN);
	const [filmI, setFilmI] = useState("");
	const [filmL, setFilmL] = useState(NaN);
	const [substrateH, setSubstrateH] = useState(NaN);
	const [substrateK, setSubstrateK] = useState(NaN);
	const [substrateI, setSubstrateI] = useState("");
	const [substrateL, setSubstrateL] = useState(NaN);
	const [testComp, setTestComp] = useState(<></>)

	useEffect(() => {
		if (isNaN(filmH) || isNaN(filmK)) {
			setFilmI("");
		} else {
			setFilmI(-(filmH + filmK));
		}
	}, [filmH, filmK]);

	useEffect(() => {
		if (isNaN(substrateH) || isNaN(substrateK)) {
			setSubstrateI("");
		} else {
			setSubstrateI(-(substrateH + substrateK));
		}
	}, [substrateH, substrateK]);

	// function handleSubmit(e) {
	// 	// Prevent the browser from reloading the page

		
	// 	// setMillerData({ matchData: [], matchPlot: "" });
	// 	e.preventDefault();
	// 	setLoading(true);
	// 	resetMiller();

	// 	// Read the form data
	// 	const form = e.target;
	// 	console.log(form)
	// 	const fd = new FormData(form);
	// 	fd.append("filmStructure", filmStructure);
	// 	fd.append("substrateStructure", substrateStructure);

	// 	// You can pass formData as a fetch body directly:
	// 	fetch(`http://localhost:${port}/api/miller_scan`, {
	// 		method: "POST",
	// 		body: fd,
	// 	})
	// 		.then((res) => {
	// 			if (!res.ok) {
	// 				throw new Error("Bad Response");
	// 			}
	// 			return res.json();
	// 		})
	// 		.then((data) => {
	// 			setMaxArea(data.maxArea);
	// 			setMaxStrain(data.maxStrain);
	// 			setMaxSubstrateIndex(data.maxSubstrateIndex);
	// 			setMaxFilmIndex(data.maxFilmIndex);
	// 			setMatchList(data.matchList);
	// 			setTotalMatchImgData(data.totalImgData);
	// 			setTotalMatchAspectRatio(data.totalImgAspectRatio);
	// 			// setMillerData({
	// 			// 	matchData: data["matchData"],
	// 			// 	matchPlot: data["matchPlot"],
	// 			// });
	// 			setLoading(false);
	// 		})
	// 		.catch((err) => {
	// 			console.error(err);
	// 		});
	// }

	function handleSubmit(e) {
		// Prevent the browser from reloading the page
		e.preventDefault();

		// Read the form data
		// const form = e.target;
		// console.log
		// const formData = new FormData(form);

		// You can pass formData as a fetch body directly:
		// fetch('/some-api', { method: form.method, body: formData });

		// Or you can work with it as a plain object:
		// const formJson = Object.fromEntries(formData.entries());
		// console.log(formJson);
		const p = (<>
			<TestOpt />
			<TestOpt />
			<TestOpt />
			<TestOpt />
			<TestOpt />
			</>)
		setTestComp(p)
		// fetch(`http://localhost:${port}/api/test_search`, {
		// 	method: "POST",
		// 	body: {},
		// })
		// 	.then((res) => {
		// 		if (!res.ok) {
		// 			throw new Error("Bad Response");
		// 		}
		// 		return res.json();
		// 	})
		// 	.then((data) => {
		// 		console.log(data)

		// 	})
		// 	.catch((err) => {
		// 		console.error(err);
		// 	});
	}

	const millerClassName = "input input-sm input-bordered input-base-content w-10 ml-1 mr-3 text-center"
	const textClassName = "input input-sm input-bordered input-base-content"

	let filmMillerInput = <></>;
	if (filmNotation === "cubic") {
		filmMillerInput = (
			<div className='flex'>
				<div className=''>
					<label className='block mb-2 text-md'>
						h:
						<input
							type='text'
							id='filmH'
							placeholder='0'
							name='filmH'
							className={millerClassName}
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setFilmH(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						k:
						<input
							type='text'
							id='filmK'
							placeholder='0'
							name='filmK'
							className={millerClassName}
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setFilmK(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						l:
						<input
							type='text'
							id='filmL'
							placeholder='1'
							name='filmL'
							className={millerClassName}
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setFilmL(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
			</div>
		);
	}

	if (filmNotation === "hexagonal") {
		filmMillerInput = (
			<div className='flex'>
				<div className=''>
					<label className='block mb-2 text-md'>
						h:
						<input
							type='text'
							id='filmH'
							placeholder='0'
							name='filmH'
							className={millerClassName}
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setFilmH(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						k:
						<input
							type='text'
							id='filmK'
							placeholder='0'
							name='filmK'
							className={millerClassName}
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setFilmK(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						i:
						<input
							type='text'
							id='filmI'
							placeholder='0'
							value={filmI}
							name='filmI'
							className={millerClassName}
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							readOnly
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						l:
						<input
							type='text'
							id='filmL'
							placeholder='1'
							name='filmL'
							className={millerClassName}
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setFilmL(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
			</div>
		);
	}

	let substrateMillerInput = <></>;
	if (substrateNotation === "cubic") {
		substrateMillerInput = (
			<div className='flex'>
				<div className=''>
					<label className='block mb-2 text-md'>
						h:
						<input
							type='text'
							id='substrateH'
							placeholder='0'
							name='substrateH'
							className={millerClassName}
							// className="input input-sm input-bordered input-secondary w-10 ml-1 mr-3 text-center"
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setSubstrateH(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						k:
						<input
							type='text'
							id='substrateK'
							placeholder='0'
							name='substrateK'
							className={millerClassName}
							// className="input input-sm input-bordered input-secondary w-10 ml-1 mr-3 text-center"
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setSubstrateK(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						l:
						<input
							type='text'
							id='substrateL'
							placeholder='1'
							name='substrateL'
							className={millerClassName}
							// className="input input-sm input-bordered input-secondary w-10 ml-1 mr-3 text-center"
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setSubstrateL(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
			</div>
		);
	}

	if (substrateNotation === "hexagonal") {
		substrateMillerInput = (
			<div className='flex'>
				<div className=''>
					<label className='block mb-2 text-md'>
						h:
						<input
							type='text'
							id='hexSubstrateH'
							placeholder='0'
							name='substrateH'
							className={millerClassName}
							// className="input input-sm input-bordered input-secondary w-10 ml-1 mr-3 text-center"
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setSubstrateH(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						k:
						<input
							type='text'
							id='hexSubstrateK'
							placeholder='0'
							name='substrateK'
							className={millerClassName}
							// className="input input-sm input-bordered input-secondary w-10 ml-1 mr-3 text-center"
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setSubstrateK(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						i:
						<input
							type='text'
							id='hexSubstrateI'
							placeholder='0'
							name='substrateI'
							value={substrateI}
							className={millerClassName}
							// className="input input-sm input-bordered input-secondary w-10 ml-1 mr-3 text-center"
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							readOnly
						/>
					</label>
				</div>
				<div className=''>
					<label className='block mb-2 text-md'>
						l:
						<input
							type='text'
							id='hexSubstrateL'
							placeholder='1'
							name='substrateL'
							className={millerClassName}
							// className="input input-sm input-bordered input-secondary w-10 ml-1 mr-3 text-center"
							// className='w-8 placeholder-gray-300 text-center ml-1 mr-3 border border-gray-300 rounded-md'
							onChange={(e) => {
								setSubstrateL(parseInt(e.target.value));
							}}
						/>
					</label>
				</div>
			</div>
		);
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
								<label className="flex flex-y">
									<input
										className='radio radio-sm radio-secondary mr-1'
										type='radio'
										name='filmMillerType'
										value='filmHKL'
										defaultChecked={true}
										onClick={() =>
											setFilmNotation("cubic")
										}
									/>
									<span className="label-text">Cubic Notation</span>
								</label>
								<label className="flex flex-y">
									<input
										className='radio radio-sm radio-secondary ml-3 mr-1'
										type='radio'
										name='filmMillerType'
										value='filmHKIL'
										onClick={() =>
											setFilmNotation("hexagonal")
										}
									/>
									<span className="label-text">Hexagonal Notation</span>
								</label>
							</p>
							{filmMillerInput}
						</div>
						<div>
							<p className='text-lg font-medium mb-1'>
								Substrate Miller Index:
							</p>
							<p className='flex flex-x text-md mb-3'>
								<label className="flex flex-y">
									<input
										className='radio radio-sm radio-secondary mr-1'
										type='radio'
										name='substrateMillerType'
										value='substrateHKL'
										defaultChecked={true}
										onClick={() =>
											setSubstrateNotation("cubic")
										}
									/>
									<span className="label-text">Cubic Notation</span>
								</label>
								<label className="flex flex-y">
									<input
										className='radio radio-sm radio-secondary ml-3 mr-1'
										type='radio'
										name='substrateMillerType'
										value='substrateHKIL'
										onClick={() =>
											setSubstrateNotation("hexagonal")
										}
									/>
									<span className="label-text">Hexagonal Notation</span>
								</label>
							</p>
							{substrateMillerInput}
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
								// className="input input-sm input-bordered input-secondary"
								// className='placeholder-gray-300 mr-3 border border-gray-300 rounded-md pl-2'
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
								// className="input input-sm input-bordered input-secondary"
							/>
						</div>
						<div className='flex items-center'>
							<label className="flex flex-y">
								<input
									className='checkbox checkbox-sm checkbox-secondary mr-3'
									type='checkbox'
									name='stableSubstrate'
									// value='substrateHKIL'
								/>
								Use most stable substrate?
							</label>
						</div>
						<div>
							<button
								type='submit'
								className="btn btn-secondary"
								onClick={handleSubmit}
								// className='inline-flex items-center px-3 py-2 text-md font-medium text-center text-white rounded-lg bg-button hover:bg-buttonhover focus:ring-4 focus:outline-none focus:ring-blue-300'
							>
								Optimize Interface
							</button>
						</div>
					</div>
				</form>
			</BaseCard>
		</div>
		{testComp}
		</>
	);
}

export default OptimizePage;
