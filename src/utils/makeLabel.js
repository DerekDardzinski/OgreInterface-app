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

export default createLabelFromData