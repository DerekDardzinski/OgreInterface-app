import React from 'react'

function BaseCard({children, color}) {

  return (
    <div className={`${color} p-4 rounded-xl shadow-lg shadow-base-300 hover:shadow-base-300 hover:shadow-xl outline outline-1 outline-base-content`}>
        {children}
    </div>
  )

}

BaseCard.defaultProps = {
    aspect: 'aspect-square',
    color: "bg-base-100"
}

export default BaseCard