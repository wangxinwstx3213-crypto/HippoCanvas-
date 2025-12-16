import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { User, LogOut, Settings, ChevronDown, Key } from 'lucide-react'

interface UserInfoProps {
  onOpenAPIKeyConfig?: () => void
}

export const UserInfo: React.FC<UserInfoProps> = ({ onOpenAPIKeyConfig }) => {
  const { user, signOut } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)

  const handleSignOut = async () => {
    try {
      await signOut()
      setShowDropdown(false)
    } catch (error) {
      console.error('登出失败:', error)
    }
  }

  const getUserInitials = (email: string) => {
    return email.slice(0, 2).toUpperCase()
  }

  if (!user) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 rounded-md p-2"
      >
        <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-medium">
          {getUserInitials(user.email)}
        </div>
        <span className="hidden md:block">{user.email}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </button>

      {showDropdown && (
        <>
          {/* Dropdown backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />

          {/* Dropdown panel */}
          <div className="absolute right-0 z-20 mt-2 w-48 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5">
            <div className="py-1">
              <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.email}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  用户ID: {user.id.slice(0, 8)}...
                </p>
              </div>

              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowDropdown(false)
                  onOpenAPIKeyConfig?.()
                }}
              >
                <Key className="h-4 w-4 mr-2" />
                API密钥配置
              </button>

              <button
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={() => {
                  setShowDropdown(false)
                  // 这里可以打开设置面板
                }}
              >
                <Settings className="h-4 w-4 mr-2" />
                账户设置
              </button>

              <button
                className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 mr-2" />
                退出登录
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}