import React from 'react'
import { getFavoriteList } from '../../utils/api'
import { DataContext } from '../../utils/data-context'
import classNames from 'classnames'
import { useSetDefaultFav } from '@/popup/hooks/use-set-default-fav'

type FavoriteTagProps = {
  fetchPromise: ReturnType<typeof getFavoriteList>
}

const FavoriteTag: React.FC<FavoriteTagProps> = (props) => {
  const { fetchPromise } = props
  const { domRef, clickTagId, pendingElement, handleMouseDown, handlleMouseUp } = useSetDefaultFav()
  const dataContext = React.use(DataContext)
  const promiseData = React.use(fetchPromise)

  const tagElementArray = React.useMemo(() => {
    return promiseData.data.list.map((data) => {
      return (
        <div
          key={data.id}
          data-key={data.id}
          onClick={() => {
            handleClick(data.id)
          }}
          onMouseDown={() => {
            handleMouseDown(data.id)
          }}
          onMouseUp={handlleMouseUp}
          className={classNames(
            'whitespace-nowrap bg-blue-50 dark:bg-slate-600 rounded p-1 text-sm flex items-center gap-x-1 relative overflow-hidden',
            {
              ['bg-blue-300']: dataContext.activeKey === data.id,
              ['dark:bg-slate-700']: dataContext.activeKey === data.id,
            },
          )}
        >
          #{data.title} {clickTagId === data.id && pendingElement}
        </div>
      )
    })
  }, [dataContext.activeKey, pendingElement, clickTagId])

  const handleClick = (key: number) => {
    dataContext.dispatch?.((oldValue) => {
      return { ...oldValue, activeKey: key }
    })
  }

  React.useEffect(() => {
    dataContext.dispatch?.((oldData) => {
      return {
        ...oldData,
        favoriteData: promiseData.data.list,
      }
    })
  }, [])

  return (
    <div ref={domRef} className="dark:text-white flex gap-1 flex-wrap cursor-pointer">
      {tagElementArray}
    </div>
  )
}

export default FavoriteTag
