import { space } from "postcss/lib/list";
import { createElement } from "react";
import uuid from "react-uuid";

function createLabelFromData({labelData}) {
    let labelElements = [];

    labelData.forEach((v) => {
        const props = { key: uuid(), ...v[1] };
        labelElements.push(createElement(v[0], props, v[2]));
    });
    
    const label = createElement(
        "span",
        {
            className: "inline-block h-[100%] w-[100%] text-center",
            key: uuid(),
        },
        labelElements
    );

    return label
}

function getFormattedFormula({formula}) {
    const formattedFormula = [...formula].map((value) => {
        if (!isNaN(parseInt(value))) {
            return <sub key={uuid()}>{value}</sub>
        } else {
            return <span key={uuid()}>{value}</span>
        }
    })

	return <span>{formattedFormula}</span>
}

function getFormattedMillerIndex({millerIndex}) {
    const formattedMillerIndex = millerIndex.map((value) => {
        if (value < 0) {
            return <span key={uuid()} className="overline">{-value}</span>
        } else {
            return <span key={uuid()}>{value}</span>
        }
    })

	return <span>({formattedMillerIndex})</span>
}

function getFormattedSpaceGroupSymbol({spaceGroupSymbol}) {
	const formattedSpaceGroupSymbol = []
	var i = 0

	while (i < spaceGroupSymbol.length) {
		const s = spaceGroupSymbol[i]

		if (s === "_") {
			formattedSpaceGroupSymbol.push(<sub key={uuid()}>{spaceGroupSymbol[i+1]}</sub>)
            i++
        } else if (s === "-") {
			formattedSpaceGroupSymbol.push(<span className="overline" key={uuid()}>{spaceGroupSymbol[i+1]}</span>)
            i++
        } else {
            formattedSpaceGroupSymbol.push(<span key={uuid()}>{s}</span>)
        }
		i++
	}

	return <span>{formattedSpaceGroupSymbol}</span>
}

export {getFormattedFormula, getFormattedMillerIndex, getFormattedSpaceGroupSymbol}