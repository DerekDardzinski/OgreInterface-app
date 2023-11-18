import React, { useState, useEffect } from "react";
import TwoColumnDisplay from "../../components/TwoColumnDisplay/TwoColumnDisplay.jsx";
import useBulkStore from "../../stores/bulkStore.js";
import { useShallow } from "zustand/react/shallow";
import createLabelFromData from "../../utils/makeLabel.js";

function BulkPanel() {
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

	const leftLabel = createLabelFromData({ labelData: filmLabel });
	const rightLabel = createLabelFromData({ labelData: substrateLabel });

	const bulkTitle = (
		<div className='flex justify-center items-center text-xl font-bold'>
			Bulk Structures
		</div>
	);

	return (
		<TwoColumnDisplay
			title={bulkTitle}
			leftStructure={filmStructure}
			leftLabel={leftLabel}
			rightStructure={substrateStructure}
			rightLabel={rightLabel}
		/>
	);
}

export default BulkPanel;
