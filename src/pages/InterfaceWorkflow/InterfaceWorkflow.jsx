import React from "react";
import FileUploader from "../../components/FileUploader/FileUploader.jsx";
import SelectionPanel from "../../panels/SelectionPanel/SelectionPanel.jsx";
import TitlePanel from "../../panels/TitlePanel/TitlePanel.jsx";
import ErrorPanel from "../../panels/ErrorPanel/ErrorPanel.jsx";
import ThemeSelector from "../../components/ThemeSelector/ThemeSelector.jsx";
import OuterContainer from "../../components/OuterContainer/OuterContainer.jsx";
import InnerContainer from "../../components/InnerContainer/InnerContainer.jsx";
import BulkPanel from "../../panels/BulkPanel/BulkPanel.jsx";
import useBulkStore from "../../stores/bulkStore.js";
import { SketchPicker } from "react-color";
import BaseCard from "../../components/BaseCard/BaseCard.jsx";

function InterfaceWorkflow() {
	const bulkStore = useBulkStore();

	return (
		<OuterContainer>
			<ThemeSelector />
			<InnerContainer>
				<TitlePanel title={"Welcome to the OgreInterface App"} />
				<FileUploader />

				{bulkStore.bulkUploaded ? (
					bulkStore.bulkOrderedError ? (
						<ErrorPanel title={"!!! Error Loading Structures !!!"} message={"Please ensure that the structures you upload are ordered (i.e. no fractional occupancy) and is one of the following formats: cif, POSCAR, ..."}/>
					) : (
						<>
							<BulkPanel />
							<SelectionPanel />
						</>
					)
				) : (
					<></>
				)}
			</InnerContainer>
		</OuterContainer>
	);
}

export default InterfaceWorkflow;
