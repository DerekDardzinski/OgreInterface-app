import React, { useState, useEffect } from "react";
import StructureView from "../StructureView/StructureView.jsx";
import BaseCard from "../BaseCard/BaseCard.jsx";

// const {process} = require("electron")

function TwoColumnDisplay({
	title,
	leftStructure,
	leftLabel,
	rightStructure,
	rightLabel,
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
						/>
					</div>
					<div className='col-span-1'>
						<StructureView
							structure={rightStructure}
							label={rightLabel}
						/>
					</div>
				</div>
			</BaseCard>
		</div>
	);
}

export default TwoColumnDisplay;
