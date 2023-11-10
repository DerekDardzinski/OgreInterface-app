import React from "react";

function DisplayCard(props) {
	return (
		<div className='aspect-square bg-base-100 rounded-xl shadow-lg shadow-base-300 hover:shadow-base-300 hover:shadow-xl outline outline-1 outline-base-content'>
			<div className='text-xl flex items-center justify-center bg-base-200 h-[15%] rounded-t-xl'>
				{props.topContents}
			</div>
			<div className='bg-base-100 h-[70%]'>{props.children}</div>
			<div className='text-xl flex items-center justify-center bg-base-200 h-[15%] rounded-b-xl'>
				{props.bottomContents}
			</div>
		</div>
	);
}

DisplayCard.defaultProps = {
	topLabel: "top",
	bottomLabel: "bot",
};

export default DisplayCard;
