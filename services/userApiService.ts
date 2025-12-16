import { supabase } from './supabaseService'

// 简单的加密/解密函数
const encryptAPIKey = (key: string, userId: string): string => {
  const secret = btoa(userId + 'hippo-vector-engine')
  return btoa(key + '|' + secret)
}

const decryptAPIKey = (encrypted: string, userId: string): string => {
  const secret = btoa(userId + 'hippo-vector-engine')
  const decoded = atob(encrypted)
  return decoded.split('|')[0]
}

export class UserApiService {
  // 获取用户的Vector Engine API密钥
  async getVectorEngineKey(userId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('api_key_encrypted')
        .eq('user_id', userId)
        .eq('service_name', 'vector_engine')
        .eq('is_default', true)
        .single()

      if (error || !data) {
        return null
      }

      return decryptAPIKey(data.api_key_encrypted, userId)
    } catch (error) {
      console.error('获取API密钥失败:', error)
      return null
    }
  }

  // 保存用户的Vector Engine API密钥
  async saveVectorEngineKey(userId: string, apiKey: string): Promise<boolean> {
    try {
      const encrypted = encryptAPIKey(apiKey, userId)

      const { error } = await supabase
        .from('user_api_keys')
        .upsert({
          user_id: userId,
          service_name: 'vector_engine',
          api_key_encrypted: encrypted,
          is_default: true
        }, {
          onConflict: 'user_id,service_name'
        })

      return !error
    } catch (error) {
      console.error('保存API密钥失败:', error)
      return false
    }
  }

  // 测试API密钥是否有效
  async testVectorEngineKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch('https://api.vectorengine.ai/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      return response.ok
    } catch (error) {
      console.error('测试API密钥失败:', error)
      return false
    }
  }

  // 删除用户的API密钥
  async deleteVectorEngineKey(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_api_keys')
        .delete()
        .eq('user_id', userId)
        .eq('service_name', 'vector_engine')

      return !error
    } catch (error) {
      console.error('删除API密钥失败:', error)
      return false
    }
  }

  // 检查用户是否已配置API密钥
  async hasVectorEngineKey(userId: string): Promise<boolean> {
    const key = await this.getVectorEngineKey(userId)
    return key !== null
  }

  // 获取API密钥信息（不返回实际密钥）
  async getVectorEngineKeyInfo(userId: string): Promise<{ exists: boolean; createdAt?: string }> {
    try {
      const { data, error } = await supabase
        .from('user_api_keys')
        .select('created_at')
        .eq('user_id', userId)
        .eq('service_name', 'vector_engine')
        .eq('is_default', true)
        .single()

      if (error || !data) {
        return { exists: false }
      }

      return {
        exists: true,
        createdAt: data.created_at
      }
    } catch (error) {
      console.error('获取API密钥信息失败:', error)
      return { exists: false }
    }
  }
}

export const userApiService = new UserApiService()