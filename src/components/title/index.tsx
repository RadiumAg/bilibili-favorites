import React from 'react'

type TitleProps = {
  title: string
  desc?: string
}

const Title: React.FC<TitleProps> = (props) => {
  const { title, desc } = props

  return (
    <div className="space-y-1">
      <h2 className="text-3xl font-bold text-[#18191C]">{title}</h2>
      {desc && <p className="text-sm text-[#61666D]">{desc}</p>}
    </div>
  )
}

export default Title
