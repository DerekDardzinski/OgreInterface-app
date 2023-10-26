import React, { useContext } from "react";
import BaseCard from "../BaseCard/BaseCard.jsx";
import AppContext from "../AppContext/AppContext.jsx";

function MillerPage() {
  const {film, substrate} = useContext(AppContext)
  const [filmData, setFilmData] = film
  const [substrateData, setSubstrateData] = substrate
  console.log(filmData)
  console.log(substrateData)


  function handleSubmit(e) {
		// Prevent the browser from reloading the page
		e.preventDefault();

		// Read the form data
		const form = e.target;
		const fd = new FormData(form);
    fd.append("filmStructure", filmData.structure)
    fd.append("substrateStructure", substrateData.structure)

		// You can pass formData as a fetch body directly:
    fetch("/api/miller_scan", {
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
			.then((data) => console.log(data))
			.catch((err) => {
				console.error(err);
			});

		// Or you can work with it as a plain object:
		// const formJson = Object.fromEntries(formData.entries());
		// console.log(formJson);
	}

	const textClassName = "input input-sm input-bordered input-base-content"

	return (
		<div className="md:col-span-2">
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
								// className="input input-sm input-bordered input-secondary"
								// className='placeholder-gray-300 mr-3 border border-gray-300 rounded-md pl-2'
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
								// className="input input-sm input-bordered input-secondary"
								// className='placeholder-gray-300 mr-3 border border-gray-300 rounded-md pl-2'
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
								// className='placeholder-gray-300 mr-3 border border-gray-300 rounded-md pl-2'
							/>
						</div>
					</div>
					<br></br>
					<button
						type='submit'
						className="btn btn-secondary"
						// className='inline-flex items-center px-3 py-2 text-md font-medium text-center text-white rounded-lg bg-button hover:bg-buttonhover focus:ring-4 focus:outline-none focus:ring-blue-300'
					>
						Run Miller Index Scan
					</button>
				</form>
			</BaseCard>
		</div>
	);
}

export default MillerPage;
