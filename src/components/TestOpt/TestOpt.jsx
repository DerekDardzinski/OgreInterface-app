import React, { useEffect, useState } from "react";
import BaseCard from "../BaseCard/BaseCard.jsx";

const { ipcRenderer } = window;
const port = ipcRenderer.sendSync("get-port-number");

function TestOpt() {
	const [innerText, setInnerText] = useState(
		<span className='loading loading-bars loading-lg'></span>
	);
	useEffect(() => {
		fetch(`http://localhost:${port}/api/test_search`, {
			method: "POST",
			body: {},
		})
			.then((res) => {
				if (!res.ok) {
					throw new Error("Bad Response");
				}
				return res.json();
			})
			.then((data) => {
				console.log(data);
                setInnerText(data.result);
			})
			.catch((err) => {
				console.error(err);
			});
	}, []);

	return (
		<div className='md:col-span-2'>
			<BaseCard>{innerText}</BaseCard>
		</div>
	);
}

export default TestOpt