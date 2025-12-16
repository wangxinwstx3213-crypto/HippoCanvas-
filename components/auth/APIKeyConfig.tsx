import React, { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { userApiService } from '../../services/userApiService'
import { X, Key, AlertCircle, CheckCircle, Loader, Edit, RefreshCw, Trash2 } from 'lucide-react'

interface APIKeyConfigProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const APIKeyConfig: React.FC<APIKeyConfigProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth()
  const [apiKey, setApiKey] = useState('')
  const [isTesting, setIsTesting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [message, setMessage] = useState('')
  const [mode, setMode] = useState<'new' | 'edit'>('new')
  const [keyInfo, setKeyInfo] = useState<{ exists: boolean; createdAt?: string }>({ exists: false })

  // 检查用户是否已有API密钥
  useEffect(() => {
    if (isOpen && user) {
      checkExistingKey()
    }
  }, [isOpen, user])

  const checkExistingKey = async () => {
    if (!user) return

    try {
      const info = await userApiService.getVectorEngineKeyInfo(user.id)
      setKeyInfo(info)
      setMode(info.exists ? 'edit' : 'new')
    } catch (error) {
      console.error('检查API密钥状态失败:', error)
    }
  }

  const handleTestKey = async () => {
    if (!apiKey.trim()) {
      setMessage('请输入API密钥')
      setTestResult('error')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    setMessage('')

    try {
      const isValid = await userApiService.testVectorEngineKey(apiKey.trim())

      if (isValid) {
        setTestResult('success')
        setMessage('✅ API密钥验证成功！')
      } else {
        setTestResult('error')
        setMessage('❌ API密钥无效，请检查')
      }
    } catch (error) {
      setTestResult('error')
      setMessage('❌ 连接失败，请检查网络')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      setMessage('用户未登录')
      return
    }

    if (!apiKey.trim()) {
      setMessage('请输入API密钥')
      return
    }

    setIsSaving(true)
    setMessage('')

    try {
      const success = await userApiService.saveVectorEngineKey(user.id, apiKey.trim())

      if (success) {
        setMessage('✅ API密钥保存成功！')
        setTimeout(() => {
          onSuccess?.()
          onClose()
        }, 1500)
      } else {
        setMessage('❌ 保存失败，请重试')
      }
    } catch (error) {
      setMessage('❌ 保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!user) {
      setMessage('用户未登录')
      return
    }

    if (!confirm('确定要删除您的API密钥吗？删除后将无法使用图像生成功能。')) {
      return
    }

    try {
      const success = await userApiService.deleteVectorEngineKey(user.id)

      if (success) {
        setMessage('✅ API密钥删除成功！')
        setKeyInfo({ exists: false })
        setMode('new')
        setApiKey('')
        setTestResult(null)
        setTimeout(() => {
          onClose()
        }, 1500)
      } else {
        setMessage('❌ 删除失败，请重试')
      }
    } catch (error) {
      setMessage('❌ 删除失败，请重试')
    }
  }

  const handleClose = () => {
    setApiKey('')
    setTestResult(null)
    setMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-indigo-100 dark:bg-indigo-900 sm:mx-0 sm:h-10 sm:w-10">
                <Key className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                  {mode === 'new' ? '配置Vector Engine API密钥' : '管理API密钥'}
                </h3>
                <div className="mt-2">
                  {keyInfo.exists ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        您已配置Vector Engine API密钥
                      </p>
                      {keyInfo.createdAt && (
                        <p className="mt-1 text-xs">
                          配置时间: {new Date(keyInfo.createdAt).toLocaleString('zh-CN')}
                        </p>
                      )}
                      <p className="mt-2">
                        您可以更新密钥或删除现有配置。
                      </p>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      <p>
                        请输入您的Vector Engine API密钥以使用图像生成功能。
                        您的密钥将安全加密存储。
                      </p>
                    </div>
                  )}
                </div>

                {(mode === 'new' || (mode === 'edit' && apiKey)) && (
                  <div className="mt-4">
                    <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {mode === 'new' ? 'API密钥' : '新的API密钥'}
                    </label>
                    <input
                      id="api-key"
                      type="password"
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value)
                        setTestResult(null)
                        setMessage('')
                      }}
                      placeholder="sk-..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                )}

                {mode === 'edit' && !apiKey && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <p>当前密钥：已安全存储</p>
                      <p className="mt-1">
                        如需修改密钥，请输入新的API密钥
                      </p>
                    </div>
                  </div>
                )}

                {message && (
                  <div className={`mt-3 p-3 rounded-md flex items-center ${
                    testResult === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200'
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {testResult === 'success' ? (
                      <CheckCircle className="h-5 w-5 mr-2" />
                    ) : (
                      <AlertCircle className="h-5 w-5 mr-2" />
                    )}
                    <span className="text-sm">{message}</span>
                  </div>
                )}

                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  <p>• API密钥格式通常为 "sk-" 开头</p>
                  <p>• 您的密钥将被安全加密存储</p>
                  <p>• 每个用户需要配置自己的API密钥</p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            {apiKey.trim() && (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving || !apiKey.trim()}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      保存中...
                    </>
                  ) : (
                    mode === 'new' ? '保存密钥' : '更新密钥'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleTestKey}
                  disabled={isTesting || !apiKey.trim()}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isTesting ? (
                    <>
                      <Loader className="h-4 w-4 mr-2 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    '测试连接'
                  )}
                </button>
              </>
            )}

            {mode === 'edit' && !apiKey.trim() && (
              <>
                <button
                  type="button"
                  onClick={() => setApiKey('')}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  更新密钥
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-red-300 dark:border-red-600 shadow-sm px-4 py-2 bg-white dark:bg-red-900 text-base font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  删除密钥
                </button>
              </>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
            >
              {mode === 'edit' && !apiKey.trim() ? '关闭' : '取消'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}