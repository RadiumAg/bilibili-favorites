import React from 'react'
import noDataImg from '@/assets/no-data.png'
import { useCookie } from '@/hooks/use-cookie'

const LoginCheck: React.FC = () => {
  const { isLogin } = useCookie()

  return !isLogin ? (
    <div className="left-0 top-0 fixed w-full h-full bg-white flex items-center justify-center">
      <div className="flex flex-col items-center">
        <img src={noDataImg} className="h-auto max-w-sm" alt="未登录提示" />
        <span className="text-sm text-b-primary">请检查是否在b站打开并登录了呢~~~</span>
      </div>
    </div>
  ) : null
}

export default LoginCheck
