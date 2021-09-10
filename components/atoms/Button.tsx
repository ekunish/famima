import React from 'react'

interface Props {
  onClick: VoidFunction,
}

const Button: React.FC<Props> = (props) => {
  return (
    <>
      <button className="bg-white hover:bg-gray-200 text-gray-800 font-semibold py-2 px-4 rounded" onClick={() => props.onClick()}>{props.children}</button>
    </>
  )
}

export default Button;