import React, { useEffect, useState, useContext } from "react";
import AppContext from "../AppContext/AppContext.jsx";
import BaseCard from "../BaseCard/BaseCard.jsx";
import { get, post } from "../../utils/requests.js";
import { data } from "autoprefixer";
// Electron Inter Process Communication and dialog
// const { ipcRenderer } = require('node:electron');
// import { IpcRenderer } from "electron";

// Dynamically generated TCP (open) port between 3000-3999
const {ipcRenderer} = window;
const port = ipcRenderer.sendSync('get-port-number');

console.log("PORT:", port)

function FileUploader(props) {
	const { film, substrate } = useContext(AppContext);
	const [filmData, setFilmData] = film;
	const [substrateData, setSubstrateData] = substrate;
	const [file, setFile] = useState({ film: null, substrate: null });

	function setData(d) {
		console.log(d);
		setSubstrateData({
			structure: d["substrate"],
			labelData: d["substrateLabel"],
		});
		setFilmData({ structure: d["film"], labelData: d["filmLabel"] });
	}

	function handleUpload() {
		const fd = new FormData();
		// console.log(file["film"])
		fd.append("filmFile", file["film"]);
		fd.append("substrateFile", file["substrate"]);
		// console.log(Object.fromEntries(fd.entries()))

		// post(fd, "api/structure_upload", setData);
		fetch(`http://localhost:${port}/api/structure_upload`, {
			method: "POST",
			body: fd,
		})
			.then((res) => {
				console.log("Uploading DATA");
				if (!res.ok) {
					throw new Error("Bad Response");
				}
				return res.json();
			})
			.then((data) => setData(data))
			.catch((err) => {
				console.error(err);
			});
	}

	return (
		<BaseCard>
			<label
				className='block mb-2 text-md font-medium text-gray-900'
				htmlFor='filmUpload'
			>
				Upload Film Structure
			</label>
			<input
				className='block w-full mb-5 text-md text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none'
				id='filmUpload'
				type='file'
				onChange={(e) => {
					// setFile(e.target.files[0])
					setFile({
						substrate: file.substrate,
						film: e.target.files[0]
					});
					// setFile((prevState) => {
					//     return {
					//         ...prevState,
					//         film: e.target.files[0],
					//     };
					// });
				}}
			/>
			<label
				className='block mb-2 text-md font-medium text-gray-900'
				htmlFor='substrateUpload'
			>
				Upload Substrate Structure
			</label>

			<input
				className='block w-full mb-5 text-md text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none'
				id='substrateUpload'
				type='file'
				onChange={(e) => {
					setFile({ substrate: e.target.files[0], film: file.film });
					// setFile((prevState) => {
					//     return {
					//         ...prevState,
					//         substrate: e.target.files[0],
					//     };
					// });
				}}
			/>
			<a
				onClick={handleUpload}
				href='#'
				className='inline-flex items-center px-3 py-2 text-md font-medium text-center text-white rounded-lg bg-button hover:bg-buttonhover focus:ring-4 focus:outline-none focus:ring-blue-300'
			>
				Upload Structures
				<svg
					className='w-3.5 h-3.5 ml-2'
					aria-hidden='true'
					xmlns='http://www.w3.org/2000/svg'
					fill='none'
					viewBox='0 0 14 10'
				>
					<path
						stroke='currentColor'
						strokeLinecap='round'
						strokeLinejoin='round'
						strokeWidth='2'
						d='M1 5h12m0 0L9 1m4 4L9 9'
					/>
				</svg>
			</a>
		</BaseCard>
	);
}

export default FileUploader;
