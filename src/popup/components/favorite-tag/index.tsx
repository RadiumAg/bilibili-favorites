import React from 'react'
import { getFavoriteList } from '../../utils/api'

const fetchData = getFavoriteList('802403183', 1, 36)
const FavoriteTag: React.FC = () => {
  const data = React.use(fetchData)

  console.log('data', data)
  return <div className="dark:text-white">232312</div>
}

export default FavoriteTag
