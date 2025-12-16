import fs from 'fs';
import path from 'path';
import ImageAPI from './ImageAPI.js';

/**
 * GEMINI图像生成组件
 * 提供简单易用的接口，封装所有复杂的API调用和图像处理逻辑
 *
 * @example
 * // 基本使用
 * const generator = new GeminiImageGenerator({
 *     apiKey: 'your-api-key',
 *     baseUrl: 'https://api.vectorengine.ai'
 * });
 *
 * const result = await generator.generate({
 *     prompt: '一只可爱的小猫',
 *     saveImage: true
 * });
 *
 * console.log(result.imagePath); // 图像文件路径
 */
class GeminiImageGenerator {
    /**
     * 构造函数
     * @param {Object} config - 配置选项
     * @param {string} config.apiKey - API密钥 (必填)
     * @param {string} config.baseUrl - API基础URL (默认: 'https://api.vectorengine.ai')
     * @param {string} config.outputDir - 图像输出目录 (默认: './output')
     * @param {string} config.logDir - 日志输出目录 (默认: './logs')
     * @param {boolean} config.enableLogging - 是否启用日志记录 (默认: true)
     * @param {string} config.defaultModel - 默认模型 (默认: 'gemini-2.5-flash-image-preview')
     * @param {number} config.timeout - 请求超时时间，毫秒 (默认: 60000)
     */
    constructor(config = {}) {
        // 验证必需参数
        if (!config.apiKey) {
            throw new Error('API密钥是必需的，请在配置中提供apiKey参数');
        }

        // 设置配置
        this.config = {
            apiKey: config.apiKey,
            baseUrl: config.baseUrl || 'https://api.vectorengine.ai',
            outputDir: config.outputDir || './output',
            logDir: config.logDir || './logs',
            enableLogging: config.enableLogging !== false,
            defaultModel: config.defaultModel || 'gemini-2.5-flash-image-preview',
            timeout: config.timeout || 60000
        };

        // 创建必要的目录
        this.ensureDirectories();

        // 初始化ImageAPI实例
        this.imageAPI = new ImageAPI(this.config.apiKey, this.config.baseUrl);

        // 设置超时
        this.imageAPI.client.defaults.timeout = this.config.timeout;

        console.log(`[GeminiImageGenerator] 组件初始化成功`);
        console.log(`[GeminiImageGenerator] 输出目录: ${this.config.outputDir}`);
        console.log(`[GeminiImageGenerator] 日志目录: ${this.config.logDir}`);
    }

    /**
     * 确保目录存在
     */
    ensureDirectories() {
        const dirs = [this.config.outputDir, this.config.logDir];
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });
    }

    /**
     * 生成图像 - 主要接口
     * @param {Object} options - 生成选项
     * @param {string} options.prompt - 图像描述提示词 (必填)
     * @param {string} options.model - GEMINI模型版本 ('2.5', '3.0', 或具体模型名)
     * @param {string} options.filename - 自定义图像文件名 (可选)
     * @param {boolean} options.saveImage - 是否保存图像文件 (默认: true)
     * @param {boolean} options.saveLog - 是否保存日志文件 (默认: true)
     * @param {number} options.maxTokens - 最大token数 (默认: 1000)
     * @param {string} options.imageFormat - 图像格式 ('png', 'jpg', 'jpeg' 等，自动检测)
     * @param {Object} options.customOptions - 自定义API选项
     * @returns {Promise<Object>} 生成结果
     */
    async generate(options = {}) {
        const startTime = Date.now();
        const requestId = this.generateRequestId();

        // 验证参数
        if (!options.prompt || typeof options.prompt !== 'string') {
            throw new Error('prompt参数是必需的，且必须是字符串');
        }

        // 设置默认选项
        const generateOptions = {
            prompt: options.prompt.trim(),
            model: this.resolveModel(options.model),
            filename: options.filename,
            saveImage: options.saveImage !== false,
            saveLog: options.saveLog !== false,
            maxTokens: options.maxTokens || 1000,
            imageFormat: options.imageFormat,
            customOptions: options.customOptions || {},
            requestId
        };

        try {
            if (this.config.enableLogging) {
                console.log(`[${requestId}] 开始生成图像...`);
                console.log(`[${requestId}] 模型: ${generateOptions.model}`);
                console.log(`[${requestId}] 提示词: ${generateOptions.prompt}`);
            }

            // 调用API生成图像
            const apiResult = await this.callImageAPI(generateOptions);

            // 处理生成结果
            const result = await this.processResult(apiResult, generateOptions);

            // 计算总耗时
            result.duration = Date.now() - startTime;
            result.success = true;

            if (this.config.enableLogging) {
                console.log(`[${requestId}] 生成完成! 耗时: ${result.duration}ms`);
                if (result.imagePath) {
                    console.log(`[${requestId}] 图像保存至: ${result.imagePath}`);
                }
            }

            return result;

        } catch (error) {
            const errorResult = {
                success: false,
                error: error.message,
                duration: Date.now() - startTime,
                requestId,
                prompt: generateOptions.prompt,
                model: generateOptions.model,
                timestamp: new Date().toISOString()
            };

            if (this.config.enableLogging) {
                console.error(`[${requestId}] 生成失败:`, error.message);
            }

            return errorResult;
        }
    }

    /**
     * 解析模型名称
     * @param {string} model - 模型参数
     * @returns {string} 解析后的模型名称
     */
    resolveModel(model) {
        if (!model) {
            return this.config.defaultModel;
        }

        // 如果是版本号，转换为完整模型名
        if (model === '2.5' || model === '2.5-flash') {
            return 'gemini-2.5-flash-image-preview';
        } else if (model === '3.0' || model === '3-pro') {
            return 'gemini-3-pro-image-preview';
        }

        // 如果已经包含完整模型名，直接返回
        if (model.includes('gemini')) {
            return model;
        }

        // 否则使用默认模型
        return this.config.defaultModel;
    }

    /**
     * 调用图像生成API
     * @param {Object} options - 生成选项
     * @returns {Promise<Object>} API响应结果
     */
    async callImageAPI(options) {
        const { model, prompt, maxTokens, customOptions } = options;

        // 根据模型选择调用方法
        if (model.includes('3-pro')) {
            return await this.imageAPI.createGemini30FlashImage({
                prompt,
                model,
                max_tokens: maxTokens,
                enable_logging: this.config.enableLogging,
                ...customOptions
            });
        } else {
            return await this.imageAPI.createGemini25FlashImage({
                prompt,
                model,
                max_tokens: maxTokens,
                enable_logging: this.config.enableLogging,
                ...customOptions
            });
        }
    }

    /**
     * 处理API响应结果
     * @param {Object} apiResult - API响应结果
     * @param {Object} options - 生成选项
     * @returns {Promise<Object>} 处理后的结果
     */
    async processResult(apiResult, options) {
        const result = {
            success: false,
            prompt: options.prompt,
            model: apiResult.data?.model || options.model,
            requestId: options.requestId,
            timestamp: new Date().toISOString(),
            hasImage: false,
            imageData: null,
            imagePath: null,
            logPath: null,
            content: apiResult.data?.content || '',
            apiDuration: apiResult.duration
        };

        if (!apiResult.success) {
            result.error = apiResult.error;
            return result;
        }

        const imageData = apiResult.data.image_data;
        result.hasImage = imageData.has_image;
        result.imageData = {
            format: imageData.image_format,
            base64Data: imageData.base64_data,
            description: imageData.description,
            markdownImages: imageData.markdown_images
        };

        // 保存图像文件
        if (result.hasImage && imageData.base64_data && options.saveImage) {
            try {
                const filename = options.filename || this.generateFilename(options, imageData.image_format);
                result.imagePath = await this.saveImage(imageData.base64_data, filename);
            } catch (saveError) {
                console.error(`[${options.requestId}] 保存图像失败:`, saveError.message);
                result.saveError = saveError.message;
            }
        }

        // 保存日志文件
        if (options.saveLog && apiResult.logs) {
            try {
                const logFilename = options.filename
                    ? `${path.basename(options.filename, path.extname(options.filename))}-logs.json`
                    : `gemini-${options.requestId}-logs.json`;
                result.logPath = await this.saveLogs(apiResult.logs, logFilename);
            } catch (logError) {
                console.error(`[${options.requestId}] 保存日志失败:`, logError.message);
                result.logSaveError = logError.message;
            }
        }

        result.success = true;
        return result;
    }

    /**
     * 保存图像文件
     * @param {string} base64Data - base64图像数据
     * @param {string} filename - 文件名
     * @returns {Promise<string>} 保存的文件路径
     */
    async saveImage(base64Data, filename) {
        return await this.imageAPI.saveBase64Image(base64Data, filename);
    }

    /**
     * 保存日志文件
     * @param {Array} logs - 日志数据
     * @param {string} filename - 日志文件名
     * @returns {Promise<string>} 保存的日志文件路径
     */
    async saveLogs(logs, filename) {
        return await this.imageAPI.saveLogsToFile(logs, filename);
    }

    /**
     * 生成请求ID
     * @returns {string} 唯一的请求ID
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 生成文件名
     * @param {Object} options - 生成选项
     * @param {string} imageFormat - 图像格式
     * @returns {string} 生成的文件名
     */
    generateFilename(options, imageFormat) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const promptHash = this.hashString(options.prompt.substring(0, 50));
        const extension = imageFormat || 'png';
        return `gemini-${promptHash}-${timestamp}.${extension}`;
    }

    /**
     * 生成字符串哈希
     * @param {string} str - 要哈希的字符串
     * @returns {string} 哈希值
     */
    hashString(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // 转换为32位整数
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * 批量生成图像
     * @param {Array} requests - 请求数组，每个元素包含prompt等选项
     * @param {Object} globalOptions - 全局选项
     * @param {Function} onProgress - 进度回调函数
     * @returns {Promise<Array>} 批量生成结果
     */
    async batchGenerate(requests = [], globalOptions = {}, onProgress = null) {
        if (!Array.isArray(requests) || requests.length === 0) {
            throw new Error('requests参数必须是非空数组');
        }

        const results = [];
        const total = requests.length;

        for (let i = 0; i < total; i++) {
            try {
                const request = requests[i];
                const options = { ...globalOptions, ...request };

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total,
                        progress: ((i + 1) / total) * 100,
                        prompt: options.prompt
                    });
                }

                const result = await this.generate(options);
                results.push({
                    ...result,
                    index: i,
                    originalPrompt: options.prompt
                });

            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    index: i,
                    originalPrompt: requests[i]?.prompt
                });
            }

            // 添加延迟避免请求过快
            if (i < total - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        return results;
    }

    /**
     * 获取支持的模型列表
     * @returns {Array} 支持的模型列表
     */
    getSupportedModels() {
        return [
            {
                id: 'gemini-2.5-flash-image-preview',
                name: 'GEMINI 2.5 Flash',
                description: '快速图像生成，适合大多数场景',
                format: 'PNG'
            },
            {
                id: 'gemini-3-pro-image-preview',
                name: 'GEMINI 3 Pro',
                description: '高质量图像生成，细节更丰富',
                format: 'PNG/JPEG'
            }
        ];
    }

    /**
     * 验证配置
     * @returns {Object} 验证结果
     */
    validateConfig() {
        const issues = [];

        if (!this.config.apiKey) {
            issues.push('缺少API密钥');
        }

        if (!fs.existsSync(this.config.outputDir)) {
            try {
                fs.mkdirSync(this.config.outputDir, { recursive: true });
            } catch (error) {
                issues.push(`无法创建输出目录: ${error.message}`);
            }
        }

        if (!fs.existsSync(this.config.logDir)) {
            try {
                fs.mkdirSync(this.config.logDir, { recursive: true });
            } catch (error) {
                issues.push(`无法创建日志目录: ${error.message}`);
            }
        }

        return {
            valid: issues.length === 0,
            issues
        };
    }

    /**
     * 获取组件状态
     * @returns {Object} 组件状态信息
     */
    getStatus() {
        return {
            initialized: true,
            config: {
                baseUrl: this.config.baseUrl,
                outputDir: this.config.outputDir,
                logDir: this.config.logDir,
                defaultModel: this.config.defaultModel,
                enableLogging: this.config.enableLogging,
                timeout: this.config.timeout
            },
            supportedModels: this.getSupportedModels(),
            validation: this.validateConfig()
        };
    }
}

export default GeminiImageGenerator;