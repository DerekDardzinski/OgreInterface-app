import React, { useState, useEffect } from "react";
import StructureView from "../StructureView/StructureView.jsx";
import BaseCard from "../BaseCard/BaseCard.jsx";

// const {process} = require("electron")

function TwoColumnDisplay({
	title,
	leftStructure,
	leftLabel,
	leftInitCameraPosition,
	leftInitLatticePlaneProps,
	leftInitCellBounds,
	rightStructure,
	rightLabel,
	rightInitCameraPosition,
	rightInitLatticePlaneProps,
	rightInitCellBounds,
}) {
	return (
		<div className='md:col-span-2'>
			<BaseCard>
				<div className='md:col-span-2'>
					<BaseCard color='bg-base-200'>
						{title}
					</BaseCard>
				</div>
				<div className='grid grid-cols-1 md:grid-cols-2 gap-4 py-6'>
					<div className='col-span-1'>
						<StructureView
							structure={leftStructure}
							label={leftLabel}
							initCameraPosition={leftInitCameraPosition}
							initLatticePlaneProps={leftInitLatticePlaneProps}
							initCellBounds={leftInitCellBounds}
						/>
					</div>
					<div className='col-span-1'>
						<StructureView
							structure={rightStructure}
							label={rightLabel}
							initCameraPosition={rightInitCameraPosition}
							initLatticePlaneProps={rightInitLatticePlaneProps}
							initCellBounds={rightInitCellBounds}
						/>
					</div>
				</div>
			</BaseCard>
		</div>
	);
}

TwoColumnDisplay.defaultProps = {
	leftInitCameraPosition: "a",
	rightInitCameraPosition: "a",
	leftInitLatticePlaneProps: {},
	rightInitLatticePlaneProps: {},
	leftInitCellBounds: {a: [0, 1], b: [0, 1], c: [0, 1]},
	rightInitCellBounds: {a: [0, 1], b: [0, 1], c: [0, 1]},
}

export default TwoColumnDisplay;
