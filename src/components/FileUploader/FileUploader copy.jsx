import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import AppContext from "../AppContext/AppContext";

function FileUploader(props) {
	const api = props.api;
    const structureData = props.structureData
    const setStructureData = props.setStructureData
	const [file, setFile] = useState(null);
    

	function handleUpload() {
		const fd = new FormData();

		fd.append("file", file);

		fetch(
			api,
			{
				method: "POST",
				body: fd,
			}
		)
			.then((res) => {
				if (!res.ok) {
					throw new Error("Bad Response");
				}
				return res.json();
			})
			.then((data) => setStructureData(data))
			.catch((err) => {
				console.error(err);
			});
	}

	return (
		<div>
			<input
				onChange={(e) => {
					setFile(e.target.files[0]);
				}}
				type='file'
			/>
			<button onClick={handleUpload}>Upload</button>
		</div>
	);
}

export default FileUploader;
