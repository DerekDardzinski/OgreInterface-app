import React, { useState } from "react";
import BaseCard from "../../components/BaseCard/BaseCard.jsx";
import OptimizePanel from "../OptimizePanel/OptimizePanel.jsx";
import MillerPanel from "../MillerPanel/MillerPanel.jsx";

function SelectionPanel() {
    const [mode, setMode] = useState("")

    let pageToDisplay = (<></>)
    if (mode === "optimize") {
        pageToDisplay = (
            <OptimizePanel/>
        )
    }

    if (mode === "miller") {
        pageToDisplay = (
           <MillerPanel/>
        )
    }
	return (
        <>
		<div className='md:col-span-2'>
			<BaseCard>
				<div className='flex justify-center items-center text-xl'>
					Select the function you would like to perform:
				</div>
				<div className='grid flex-auto grid-cols-2 justify-center items-left m-4 gap-4'>
					<button
						onClick={() => setMode("miller")}
						className={(mode === "miller" ? "outline-secondary outline-3" : "outline-base-content outline-1" ) + ' bg-base-100 rounded-2xl p-4 outline col-span-2 md:col-span-1'}
					>
						<p className="text-xl font-bold">
                            Miller Index Scan
                        </p>
                        <p>
                            The miller index scan mode allows the user to find all possible epitaxial matches between each surface.
                        </p>
					</button>
                    <button
						onClick={() => setMode("optimize")}
						className={(mode === "optimize" ? "outline-secondary outline-3" : "outline-base-content outline-1" ) + ' bg-base-100 rounded-2xl p-4 outline col-span-2 md:col-span-1'}
					>
						<p className="text-xl font-bold">
                            Interface Structure Optimization
                        </p>
                        <p>
                            The interface structure optimization mode allows a user to optimize the interface structure
                            of an epitaxial interface by searching through all possible combinations if surface terminations
                            at the interface and optimizing the relative alignment of each interface.
                        </p>
					</button>
				</div>
			</BaseCard>
		</div>
        {pageToDisplay}
        </>
	);
}

export default SelectionPanel;
