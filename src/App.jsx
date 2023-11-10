import React, { useState, useEffect } from "react";
import AppContext from "./components/AppContext/AppContext.jsx";
import FileUploader from "./components/FileUploader/FileUploader.jsx";
import StructureView from "./components/StructureView/StructureView.jsx";
import BaseCard from "./components/BaseCard/BaseCard.jsx";
import SelectionPage from "./components/SelectionPage/SelectionPage.jsx";
import ThemeSelector from "./components/ThemeSelector/ThemeSelector.jsx";
// const {process} = require("electron")

function App() {
	const [substrateData, setSubstrateData] = useState("");
	const [filmData, setFilmData] = useState("");
	const [millerData, setMillerData] = useState([]);

	return (
		<AppContext.Provider
			value={{
				film: [filmData, setFilmData],
				substrate: [substrateData, setSubstrateData],
				millerScan: [millerData, setMillerData],
			}}
		>
			<div className='bg-base-100 w-screen h-full min-h-screen'>
				<div className="fixed ml-3 mt-3 z-50">
				<ThemeSelector/>
				</div>
				<div className='flex items-top justify-center'>
					<div className='max-w-[100vh] flex-auto grid grid-cols-1 md:grid-cols-2 gap-6 p-6'>
						<div className='md:col-span-2'>
							<BaseCard>
								<div className='flex justify-center items-center text-2xl font-bold'>
									Welcome to the OgreInterface App
								</div>
							</BaseCard>
						</div>
						<div className='md:col-span-2'>
							<FileUploader />
						</div>

						{substrateData != "" && filmData != "" && (
							<>
								<StructureView structureData={filmData} />
								<StructureView structureData={substrateData} />
								<SelectionPage />
							</>
						)}
					</div>
				</div>
			</div>
		</AppContext.Provider>
	);
}

export default App;


