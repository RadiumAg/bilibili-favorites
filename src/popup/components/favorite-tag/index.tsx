import React from 'react'
import { getFavoriteList } from '../../utils/api'

type FavoriteTagProps = {
  fetchPromise: ReturnType<typeof getFavoriteList>
}

const FavoriteTag: React.FC<FavoriteTagProps> = (props) => {
  const { fetchPromise } = props
  const promiseData = React.use(fetchPromise)

  const tagElementArray = React.useMemo(() => {
    return promiseData.data.list.map((data) => {
      return (
        <div
          key={data.mid}
          className="whitespace-nowrap bg-blue-50 dark:bg-slate-600 rounded  p-1 text-sm"
        >
          {data.title}
        </div>
      )
    })
  }, [])

  return (
    <div className="dark:text-white flex gap-1 flex-wrap cursor-pointer">{tagElementArray}</div>
  )
}

export default FavoriteTag
