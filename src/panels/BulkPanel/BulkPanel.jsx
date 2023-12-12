import React, { useState, useEffect } from "react";
import TwoColumnDisplay from "../../components/TwoColumnDisplay/TwoColumnDisplay.jsx";
import useBulkStore from "../../stores/bulkStore";
import { useShallow } from "zustand/react/shallow";
import {getFormattedFormula, getFormattedSpaceGroupSymbol} from "../../utils/makeLabel";

function BulkPanel() {
	const bulkStore = useBulkStore()
	const formattedFilmFormula = getFormattedFormula({formula: bulkStore.filmFormula})
	const formattedFilmSpaceGroup = getFormattedSpaceGroupSymbol({spaceGroupSymbol: bulkStore.filmSpaceGroup})
	const filmLabel = (
		<span className="inline-block h-[100%] w-[100%] text-center">
			{formattedFilmFormula} ({formattedFilmSpaceGroup})
		</span>
	)

	const formattedSubstrateFormula = getFormattedFormula({formula: bulkStore.substrateFormula})
	const formattedSubstrateSpaceGroup = getFormattedSpaceGroupSymbol({spaceGroupSymbol: bulkStore.substrateSpaceGroup})
	const substrateLabel = (
		<span className="inline-block h-[100%] w-[100%] text-center">
			{formattedSubstrateFormula} ({formattedSubstrateSpaceGroup})
		</span>
	)

	const bulkTitle = (
		<div className='flex justify-center items-center text-xl font-bold'>
			Bulk Structures
		</div>
	);

	return (
		<TwoColumnDisplay
			title={bulkTitle}
			leftStructure={bulkStore.filmStructure}
			leftLabel={filmLabel}
			leftInitCameraPosition={"a"}
			rightStructure={bulkStore.substrateStructure}
			rightLabel={substrateLabel}
			rightInitCameraPosition={"a"}
		/>
	);
}

export default BulkPanel;
