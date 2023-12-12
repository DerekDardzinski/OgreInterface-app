import React, { useEffect, useState, useContext } from "react";
import AppContext from "../AppContext/AppContext";
import BaseCard from "../BaseCard/BaseCard";
import useFileStore from "../../stores/fileStore";
import useBulkStore from "../../stores/bulkStore";
import useMillerStore from "../../stores/millerStore";
import useOptimizeStore from "../../stores/optimizeStore";
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
	const bulkStore = useBulkStore()
	console.log(bulkStore)
	const fileStore = useFileStore()
	console.log(fileStore)
	// const setFilmFile = useFileStore((state) => state.setFilmFile);
	// const setSubstrateFile = useFileStore((state) => state.setSubstrateFile);
	// const filmFile = useFileStore((state) => state.filmFile);
	// const substrateFile = useFileStore((state) => state.substrateFile);
	// const setFilmStructure = useBulkStore((state) => state.setFilmStructure);
	// const setFilmLabel = useBulkStore((state) => state.setFilmLabel);
	// const setSubstrateStructure = useBulkStore(
	// 	(state) => state.setSubstrateStructure
	// );
	// const setSubstrateLabel = useBulkStore((state) => state.setSubstrateLabel);
	// const setBulkUploaded = useBulkStore((state) => state.setBulkUploaded);
	// const resetBulk = useBulkStore((state) => state.resetBulk);
	const resetMiller = useMillerStore((state) => state.resetMiller);
	const resetOptimize = useOptimizeStore((state) => state.resetOptimize);

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
		bulkStore.resetBulk();
		resetMiller();
		resetOptimize();
		const fd = new FormData();
		fd.append("filmFile", fileStore.filmFile);
		fd.append("substrateFile", fileStore.substrateFile);

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
				bulkStore.setFilmStructure(data.film)
				bulkStore.setFilmFormula(data.filmFormula)
				bulkStore.setFilmSpaceGroup(data.filmSpaceGroup)
				bulkStore.setSubstrateStructure(data.substrate)
				bulkStore.setSubstrateFormula(data.substrateFormula)
				bulkStore.setSubstrateSpaceGroup(data.substrateSpaceGroup)
				bulkStore.setBulkUploaded()
				// setData(data);
			})
			.catch((err) => {
				console.error(err);
			});
	}

	return (
		<div className='md:col-span-2'>
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
					onChange={(e) => fileStore.setFilmFile(e.target.files[0])}
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
					onChange={(e) => fileStore.setSubstrateFile(e.target.files[0])}
				/>
			</div>
			<button onClick={handleUpload} className='btn btn-secondary mt-2'>
				Upload Structures
			</button>
		</BaseCard>
		</div>
	);
}

export default FileUploader;
