import React from 'react'
import { getFavoriteList } from '../../utils/api'
import { DataContext } from '../../utils/data-context'
import classNames from 'classnames'

type FavoriteTagProps = {
  fetchPromise: ReturnType<typeof getFavoriteList>
}

const FavoriteTag: React.FC<FavoriteTagProps> = (props) => {
  const { fetchPromise } = props
  const dataContext = React.use(DataContext)
  const promiseData = React.use(fetchPromise)

  const tagElementArray = React.useMemo(() => {
    return promiseData.data.list.map((data) => {
      return (
        <div
          key={data.id}
          onClick={() => {
            handleClick(data.id)
          }}
          className={classNames(
            'whitespace-nowrap bg-blue-50 dark:bg-slate-600 rounded  p-1 text-sm',
            {
              ['dark:bg-slate-700']: dataContext.activeKey === data.fid,
            },
          )}
        >
          # {data.title}
        </div>
      )
    })
  }, [dataContext.activeKey])

  const handleClick = (key: number) => {
    dataContext.dispatch?.((oldValue) => {
      return { ...oldValue, activeKey: key }
    })
  }

  console.log(dataContext.activeKey)

  React.useEffect(() => {
    dataContext.dispatch?.((oldData) => {
      return {
        ...oldData,
        favoriteData: promiseData.data.list,
      }
    })
  }, [])

  return (
    <div className="dark:text-white flex gap-1 flex-wrap cursor-pointer">{tagElementArray}</div>
  )
}

export default FavoriteTag
