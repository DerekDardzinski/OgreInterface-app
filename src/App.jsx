import React, { useState, useEffect } from "react";
import AppContext from "./components/AppContext/AppContext.jsx";
import FileUploader from "./components/FileUploader/FileUploader.jsx";
import StructureView from "./components/StructureView/StructureView.jsx";
import BaseCard from "./components/BaseCard/BaseCard.jsx";
import SelectionPage from "./components/SelectionPage/SelectionPage.jsx";
import ThemeSelector from "./components/ThemeSelector/ThemeSelector.jsx";
import useBulkStore from "./stores/bulkStore.js";
import { useShallow } from "zustand/react/shallow";
// const {process} = require("electron")

function App() {
	const [substrateData, setSubstrateData] = useState("");
	const [filmData, setFilmData] = useState("");
	const [millerData, setMillerData] = useState({
		matchPlot: "",
		matchData: [],
	});
	const { filmStructure, filmLabel } = useBulkStore(
		useShallow((state) => ({
			filmStructure: state.filmStructure,
			filmLabel: state.filmLabel,
		}))
	);
	const { substrateStructure, substrateLabel } = useBulkStore(
		useShallow((state) => ({
			substrateStructure: state.substrateStructure,
			substrateLabel: state.substrateLabel,
		}))
	);

	return (
		<AppContext.Provider
			value={{
				film: [filmData, setFilmData],
				substrate: [substrateData, setSubstrateData],
				millerScan: [millerData, setMillerData],
			}}
		>
			<div className='h-full min-h-screen bg-base-100 scrollbar scrollbar-none'>
				<div className='fixed ml-3 mt-3 z-50'>
					<ThemeSelector />
				</div>
				<div className='flex items-top justify-center'>
					<div className='max-w-[100vh] flex-auto grid grid-cols-1 md:grid-cols-2 gap-4 py-6 px-2'>
						<div className='md:col-span-2'>
							<BaseCard color='bg-base-200'>
								<div className='flex justify-center items-center text-2xl font-bold'>
									Welcome to the OgreInterface App
								</div>
							</BaseCard>
						</div>
						<div className='md:col-span-2'>
							<FileUploader />
						</div>

						{substrateStructure != "" && filmStructure != "" && (
							<>
								<div className='md:col-span-2'>
									<BaseCard>
										<div className='md:col-span-2'>
											<BaseCard color='bg-base-200'>
												<div className='flex justify-center items-center text-xl font-bold'>
													Bulk Structures
												</div>
											</BaseCard>
										</div>
										<div className='grid grid-cols-1 md:grid-cols-2 gap-4 py-6'>
											<div className='col-span-1'>
												<StructureView
													structure={filmStructure}
													labelData={filmLabel}
												/>
											</div>
											<div className='col-span-1'>
												<StructureView
													structure={
														substrateStructure
													}
													labelData={substrateLabel}
												/>
											</div>
										</div>
									</BaseCard>
								</div>
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
