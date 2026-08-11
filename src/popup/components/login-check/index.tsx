import React from 'react'
import noDataImg from '@/assets/no-data.png'
import { useCookie } from '@/hooks/use-cookie'

type LoginCheckProps = {
  popup?: boolean
}

const LoginCheck: React.FC<LoginCheckProps> = (props) => {
  const { popup = true } = props
  const { isLogin } = useCookie(popup)

  return !isLogin ? (
    <div className="left-0 top-0 fixed w-full h-full bg-white flex items-center justify-center">
      <div className="flex max-w-xs flex-col items-center px-6 text-center">
        <img src={noDataImg} className="h-auto max-w-sm" alt="未登录提示" />
        <p className="mt-3 text-sm font-medium text-b-primary">诶？还没捕捉到 B 站登录信号～</p>
        <p className="mt-2 text-xs leading-5 text-gray-500">别着急，按顺序重新召唤一下：</p>
        <ol className="mt-1 space-y-1 text-xs leading-5 text-gray-500">
          <li>1. 彻底退出浏览器，再重新启动</li>
          <li>2. 打开 B 站，让账号先登录就位</li>
          <li>3. 最后打开本插件，数据就会出现啦</li>
        </ol>
      </div>
    </div>
  ) : null
}

export default LoginCheck
