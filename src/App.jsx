import React, { useState, useEffect } from "react";
import AppContext from "./components/AppContext/AppContext.jsx";
import FileUploader from "./components/FileUploader/FileUploader.jsx";
import StructureView from "./components/StructureView/StructureView.jsx";
import BaseCard from "./components/BaseCard/BaseCard.jsx";
import SelectionPanel from "./panels/SelectionPanel/SelectionPanel.jsx";
import TitlePanel from "./panels/TitlePanel/TitlePanel.jsx";
import ThemeSelector from "./components/ThemeSelector/ThemeSelector.jsx";
import TwoColumnDisplay from "./components/TwoColumnDisplay/TwoColumnDisplay.jsx";
import OuterContainer from "./components/OuterContainer/OuterContainer.jsx";
import InnerContainer from "./components/InnerContainer/InnerContainer.jsx";
import BulkPanel from "./panels/BulkPanel/BulkPanel.jsx";
import useBulkStore from "./stores/bulkStore.js";
import { useShallow } from "zustand/react/shallow";
// const {process} = require("electron")

function App() {
	const bulkUploaded = useBulkStore((state) => state.bulkUploaded);

	return (
		<OuterContainer>
			<ThemeSelector />
			<InnerContainer>
				<TitlePanel title={"Welcome to the OgreInterface App"} />
				<FileUploader />

				{bulkUploaded ? (
					<>
						<BulkPanel />
						<SelectionPanel />
					</>
				) : (
					<></>
				)}
			</InnerContainer>
		</OuterContainer>
	);
}

export default App;
