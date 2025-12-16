import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 向量引擎API客户端类
 * 提供与向量引擎API的完整对接功能
 */
class VectorEngineClient {
    /**
     * 构造函数
     * @param {string} apiKey - API密钥 (必填)
     * @param {string} baseUrl - API基础URL (可选，默认为 https://api.vectorengine.ai)
     */
    constructor(apiKey, baseUrl = 'https://api.vectorengine.ai') {
        if (!apiKey) {
            throw new Error('API密钥不能为空，请提供有效的apiKey参数');
        }

        this.apiKey = apiKey;
        this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

        // 创建axios实例，配置默认参数
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000 // 60秒超时
        });

        // 请求拦截器 - 添加调试日志
        this.client.interceptors.request.use(
            config => {
                console.log(`[请求] ${config.method?.toUpperCase()} ${config.url}`);
                return config;
            },
            error => {
                console.error('[请求错误]', error);
                return Promise.reject(error);
            }
        );

        // 响应拦截器 - 处理错误和日志
        this.client.interceptors.response.use(
            response => {
                console.log(`[响应] ${response.status} ${response.config.url}`);
                return response;
            },
            error => {
                if (error.response) {
                    console.error(`[响应错误] ${error.response.status} ${error.response.config?.url}`);
                    console.error('[错误详情]', error.response.data);
                } else if (error.request) {
                    console.error('[网络错误] 请求已发送但没有收到响应');
                } else {
                    console.error('[配置错误]', error.message);
                }
                return Promise.reject(this.handleError(error));
            }
        );
    }

    /**
     * 处理API错误
     * @param {Error} error - 原始错误对象
     * @returns {Error} 处理后的错误对象
     */
    handleError(error) {
        if (error.response) {
            // 服务器返回了错误状态码
            const status = error.response.status;
            const data = error.response.data;

            let message = 'API请求失败';

            switch (status) {
                case 400:
                    message = '请求参数错误';
                    break;
                case 401:
                    message = 'API密钥无效或已过期';
                    break;
                case 403:
                    message = '没有访问权限';
                    break;
                case 404:
                    message = '请求的API端点不存在';
                    break;
                case 429:
                    message = '请求频率过高，请稍后重试';
                    break;
                case 500:
                    message = '服务器内部错误';
                    break;
                case 502:
                    message = '网关错误';
                    break;
                case 503:
                    message = '服务暂时不可用';
                    break;
            }

            // 如果服务器返回了详细错误信息，使用服务器信息
            if (data && data.error && data.error.message) {
                message = data.error.message;
            } else if (data && data.message) {
                message = data.message;
            }

            return new Error(`${message} (${status})`);
        } else if (error.request) {
            // 网络连接问题
            return new Error('网络连接失败，请检查网络设置');
        } else {
            // 其他错误
            return error;
        }
    }

    /**
     * 通用API请求方法
     * @param {string} method - HTTP方法 (GET, POST, PUT, DELETE)
     * @param {string} endpoint - API端点路径
     * @param {Object} data - 请求数据 (可选)
     * @param {Object} config - 额外的axios配置 (可选)
     * @returns {Promise<Object>} API响应数据
     */
    async request(method, endpoint, data = null, config = {}) {
        try {
            const response = await this.client.request({
                method,
                url: endpoint,
                data,
                ...config
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    /**
     * GET请求
     * @param {string} endpoint - API端点
     * @param {Object} params - 查询参数 (可选)
     * @returns {Promise<Object>} API响应数据
     */
    async get(endpoint, params = {}) {
        return this.request('GET', endpoint, null, { params });
    }

    /**
     * POST请求
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @param {Object} config - 额外配置 (可选)
     * @returns {Promise<Object>} API响应数据
     */
    async post(endpoint, data, config = {}) {
        return this.request('POST', endpoint, data, config);
    }

    /**
     * 流式请求处理
     * @param {string} endpoint - API端点
     * @param {Object} data - 请求数据
     * @param {Function} onChunk - 接收到数据块时的回调函数
     * @returns {Promise<void>}
     */
    async streamRequest(endpoint, data, onChunk) {
        try {
            const response = await this.client.post(endpoint, data, {
                responseType: 'stream',
                headers: {
                    'Accept': 'text/event-stream'
                }
            });

            return new Promise((resolve, reject) => {
                let buffer = '';

                response.data.on('data', (chunk) => {
                    buffer += chunk.toString();
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // 保留最后一个不完整的行

                    for (const line of lines) {
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') {
                                resolve();
                                return;
                            }

                            try {
                                const parsed = JSON.parse(data);
                                onChunk(parsed);
                            } catch (e) {
                                console.warn('解析SSE数据失败:', data);
                            }
                        }
                    }
                });

                response.data.on('error', reject);
                response.data.on('end', resolve);
            });
        } catch (error) {
            throw error;
        }
    }

    /**
     * 获取支持的模型列表
     * @returns {Promise<Array>} 模型列表
     */
    async getModels() {
        return this.get('/v1/models');
    }

    /**
     * 获取账户信息
     * @returns {Promise<Object>} 账户信息
     */
    async getAccountInfo() {
        return this.get('/v1/account');
    }

    /**
     * 下载文件到本地
     * @param {string} url - 文件URL
     * @param {string} savePath - 保存路径
     * @returns {Promise<string>} 保存的文件路径
     */
    async downloadFile(url, savePath) {
        try {
            const response = await axios({
                method: 'GET',
                url,
                responseType: 'stream',
                timeout: 300000 // 5分钟超时
            });

            // 确保目录存在
            const dir = path.dirname(savePath);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            // 创建写入流
            const writer = fs.createWriteStream(savePath);

            return new Promise((resolve, reject) => {
                response.data.pipe(writer);
                writer.on('finish', () => resolve(savePath));
                writer.on('error', reject);
            });
        } catch (error) {
            throw new Error(`下载文件失败: ${error.message}`);
        }
    }
}

export default VectorEngineClient;