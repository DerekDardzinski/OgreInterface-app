import React, { useEffect, useState, useContext } from "react";
import AppContext from "../AppContext/AppContext.jsx";
import BaseCard from "../BaseCard/BaseCard.jsx";
import useFileStore from "../../stores/fileStore.js";
import useBulkStore from "../../stores/bulkStore.js";
import useMillerStore from "../../stores/millerStore.js";
// import { get, post } from "../../utils/requests.js";
// import { data } from "autoprefixer";
// Electron Inter Process Communication and dialog
// const { ipcRenderer } = require('node:electron');
// import { IpcRenderer } from "electron";

// Dynamically generated TCP (open) port between 3000-3999
const { ipcRenderer } = window;
const port = ipcRenderer.sendSync("get-port-number");

// console.log("PORT:", port);

function FileUploader(props) {
	const setFilmFile = useFileStore((state) => state.setFilmFile);
	const setSubstrateFile = useFileStore((state) => state.setSubstrateFile);
	const filmFile = useFileStore((state) => state.filmFile);
	const substrateFile = useFileStore((state) => state.substrateFile);
	const setFilmStructure = useBulkStore((state) => state.setFilmStructure);
	const setFilmLabel = useBulkStore((state) => state.setFilmLabel);
	const setSubstrateStructure = useBulkStore(
		(state) => state.setSubstrateStructure
	);
	const resetBulk = useBulkStore((state) => state.resetBulk);
	const setSubstrateLabel = useBulkStore((state) => state.setSubstrateLabel);
	const resetMiller = useMillerStore((state) => state.resetMiller)

	// const { film, substrate, millerScan } = useContext(AppContext);
	// const [filmData, setFilmData] = film;
	// const [substrateData, setSubstrateData] = substrate;
	// const [millerData, setMillerData] = millerScan;

	// const [file, setFile] = useState({ film: null, substrate: null });

	// function setData(d) {
	// 	setSubstrateData({
	// 		structure: d["substrate"],
	// 		labelData: d["substrateLabel"],
	// 	});
	// 	setFilmData({ structure: d["film"], labelData: d["filmLabel"] });
	// }

	function handleUpload() {
		resetBulk();
		resetMiller();
		// setMillerData({ matchPlot: "", matchData: [] });
		// setFilmData("");
		// setSubstrateData("");
		const fd = new FormData();
		fd.append("filmFile", filmFile);
		fd.append("substrateFile", substrateFile);

		fetch(`http://localhost:${port}/api/structure_upload`, {
			method: "POST",
			body: fd,
		})
			.then((res) => {
				// console.log("Uploading DATA");
				if (!res.ok) {
					throw new Error("Bad Response");
				}
				return res.json();
			})
			.then((data) => {
				setFilmStructure(data.film)
				setFilmLabel(data.filmLabel)
				setSubstrateStructure(data.substrate)
				setSubstrateLabel(data.substrateLabel)
				// setData(data);
			})
			.catch((err) => {
				console.error(err);
			});
	}

	return (
		<BaseCard>
			<div className='form-control w-full mb-2'>
				<label className='label'>
					<span className='label-text text-md font-medium'>
						Upload Film Structure
					</span>
				</label>
				<input
					type='file'
					id='filmUpload'
					className='file-input file-input-bordered file-input-sm w-full'
					onChange={(e) => setFilmFile(e.target.files[0])}
				/>
			</div>
			<div className='form-control w-full mb-2'>
				<label className='label'>
					<span className='label-text text-md font-medium'>
						Upload Substrate Structure
					</span>
				</label>
				<input
					type='file'
					id='substrateUpload'
					className='file-input file-input-bordered file-input-sm w-full'
					onChange={(e) => setSubstrateFile(e.target.files[0])}
				/>
			</div>
			{/* <input type="range" min={0} max="100" value="40" className="range" /> */}
			<button onClick={handleUpload} className='btn btn-secondary mt-2'>
				Upload Structures
			</button>
		</BaseCard>
	);
}

export default FileUploader;
