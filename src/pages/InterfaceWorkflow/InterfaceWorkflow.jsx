import React from "react";
import FileUploader from "../../components/FileUploader/FileUploader.jsx";
import SelectionPanel from "../../panels/SelectionPanel/SelectionPanel.jsx";
import TitlePanel from "../../panels/TitlePanel/TitlePanel.jsx";
import ThemeSelector from "../../components/ThemeSelector/ThemeSelector.jsx";
import OuterContainer from "../../components/OuterContainer/OuterContainer.jsx";
import InnerContainer from "../../components/InnerContainer/InnerContainer.jsx";
import BulkPanel from "../../panels/BulkPanel/BulkPanel.jsx";
import useBulkStore from "../../stores/bulkStore.js";

function InterfaceWorkflow() {
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

export default InterfaceWorkflow;
