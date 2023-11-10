import React from 'react'

function BaseCard(props) {

  return (
    <div className="p-4 bg-base-100 rounded-xl shadow-lg shadow-base-300 hover:shadow-base-300 hover:shadow-xl outline outline-1 outline-base-content">
        {props.children}
    </div>
  )

}

BaseCard.defaultProps = {
    aspect: 'aspect-square',
}

export default BaseCard