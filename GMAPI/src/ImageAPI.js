import fs from 'fs';
import FormData from 'form-data';
import VectorEngineClient from './VectorEngineClient.js';

/**
 * 图像生成API类 - 处理所有图像生成相关的API调用
 * 支持DALL-E、FLUX、Midjourney等多种图像生成模型
 */
class ImageAPI extends VectorEngineClient {
    constructor(apiKey, baseUrl) {
        super(apiKey, baseUrl);
    }

    /**
     * 创建图像 (DALL-E 3 兼容格式)
     * @param {Object} options - 图像生成参数
     * @param {string} options.prompt - 图像描述提示词
     * @param {string} options.model - 模型名称 (默认: dall-e-3)
     * @param {number} options.n - 生成图像数量 (默认: 1)
     * @param {string} options.size - 图像尺寸 (默认: "1024x1024")
     * @param {string} options.response_format - 响应格式 ("url" 或 "b64_json", 默认: "url")
     * @param {string} options.style - 图像风格 ("vivid" 或 "natural", 默认: "vivid")
     * @param {string} options.quality - 图像质量 ("standard" 或 "hd", 默认: "standard")
     * @returns {Promise<Object>} 生成的图像信息
     */
    async createImage(options = {}) {
        const {
            prompt,
            model = 'dall-e-3',
            n = 1,
            size = '1024x1024',
            response_format = 'url',
            style = 'vivid',
            quality = 'standard'
        } = options;

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('prompt参数是必需的，且必须是字符串');
        }

        const requestData = {
            model,
            prompt,
            n,
            size,
            response_format,
            style,
            quality
        };

        return this.post('/v1/images/generations', requestData);
    }

    /**
     * 编辑图像 (DALL-E 2 兼容格式)
     * @param {Object} options - 图像编辑参数
     * @param {string} options.image - 原始图像路径或URL
     * @param {string} options.prompt - 编辑提示词
     * @param {string} options.mask - 蒙版图像路径或URL (可选)
     * @param {string} options.model - 模型名称 (默认: dall-e-2)
     * @param {number} options.n - 生成图像数量 (默认: 1)
     * @param {string} options.size - 图像尺寸 (默认: "1024x1024")
     * @param {string} options.response_format - 响应格式 ("url" 或 "b64_json", 默认: "url")
     * @returns {Promise<Object>} 编辑后的图像信息
     */
    async editImage(options = {}) {
        const {
            image,
            mask,
            prompt,
            model = 'dall-e-2',
            n = 1,
            size = '1024x1024',
            response_format = 'url'
        } = options;

        if (!image) {
            throw new Error('image参数是必需的');
        }

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('prompt参数是必需的，且必须是字符串');
        }

        const formData = new FormData();

        // 处理原始图像
        if (fs.existsSync(image)) {
            formData.append('image', fs.createReadStream(image));
        } else if (image.startsWith('http')) {
            // 如果是URL，需要先下载
            const tempPath = await this.downloadImage(image);
            formData.append('image', fs.createReadStream(tempPath));
        } else {
            throw new Error('无效的图像路径或URL');
        }

        // 处理蒙版图像
        if (mask) {
            if (fs.existsSync(mask)) {
                formData.append('mask', fs.createReadStream(mask));
            } else if (mask.startsWith('http')) {
                const tempMaskPath = await this.downloadImage(mask);
                formData.append('mask', fs.createReadStream(tempMaskPath));
            } else {
                throw new Error('无效的蒙版图像路径或URL');
            }
        }

        formData.append('prompt', prompt);
        formData.append('model', model);
        formData.append('n', n.toString());
        formData.append('size', size);
        formData.append('response_format', response_format);

        return this.client.post('/v1/images/edits', formData, {
            headers: {
                ...formData.getHeaders()
            }
        }).then(response => response.data);
    }

    /**
     * 创建图像变体 (DALL-E 2 兼容格式)
     * @param {Object} options - 图像变体参数
     * @param {string} options.image - 原始图像路径
     * @param {string} options.model - 模型名称 (默认: dall-e-2)
     * @param {number} options.n - 生成图像数量 (默认: 1)
     * @param {string} options.size - 图像尺寸 (默认: "1024x1024")
     * @param {string} options.response_format - 响应格式 ("url" 或 "b64_json", 默认: "url")
     * @returns {Promise<Object>} 图像变体信息
     */
    async createImageVariation(options = {}) {
        const {
            image,
            model = 'dall-e-2',
            n = 1,
            size = '1024x1024',
            response_format = 'url'
        } = options;

        if (!image) {
            throw new Error('image参数是必需的');
        }

        if (!fs.existsSync(image)) {
            throw new Error('图像文件不存在');
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(image));
        formData.append('model', model);
        formData.append('n', n.toString());
        formData.append('size', size);
        formData.append('response_format', response_format);

        return this.client.post('/v1/images/variations', formData, {
            headers: {
                ...formData.getHeaders()
            }
        }).then(response => response.data);
    }

    /**
     * FLUX图像生成 (Replicate格式)
     * @param {Object} options - FLUX生成参数
     * @param {string} options.prompt - 图像描述提示词
     * @param {string} options.model - FLUX模型名称 (默认: "black-forest-labs/flux-1.1-pro")
     * @param {number} options.width - 图像宽度 (默认: 1024)
     * @param {number} options.height - 图像高度 (默认: 1024)
     * @param {number} options.num_outputs - 生成数量 (默认: 1)
     * @param {number} options.guidance_scale - 引导比例 (默认: 3.5)
     * @param {number} options.num_inference_steps - 推理步数 (默认: 50)
     * @param {string} options.aspect_ratio - 宽高比 (可选)
     * @param {boolean} options.safety_checker - 是否启用安全检查 (默认: true)
     * @returns {Promise<Object>} 生成任务信息
     */
    async createFluxImage(options = {}) {
        const {
            prompt,
            model = 'black-forest-labs/flux-1.1-pro',
            width = 1024,
            height = 1024,
            num_outputs = 1,
            guidance_scale = 3.5,
            num_inference_steps = 50,
            aspect_ratio,
            safety_checker = true
        } = options;

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('prompt参数是必需的，且必须是字符串');
        }

        const requestData = {
            input: {
                prompt,
                width,
                height,
                num_outputs,
                guidance_scale,
                num_inference_steps,
                safety_checker
            }
        };

        if (aspect_ratio) {
            requestData.input.aspect_ratio = aspect_ratio;
        }

        return this.post(`/replicate/v1/model/${model}/predictions`, requestData);
    }

    /**
     * 查询Replicate任务状态
     * @param {string} taskId - 任务ID
     * @returns {Promise<Object>} 任务状态信息
     */
    async getReplicateTask(taskId) {
        if (!taskId) {
            throw new Error('taskId参数是必需的');
        }

        return this.get(`/replicate/v1/predictions/${taskId}`);
    }

    /**
     * Midjourney图像生成 - 提交Imagine任务
     * @param {Object} options - Midjourney参数
     * @param {string} options.prompt - 图像描述提示词
     * @param {string} options.model - Midjourney模型 (默认: "midjourney-v6")
     * @param {number} options.width - 图像宽度 (可选)
     * @param {number} options.height - 图像高度 (可选)
     * @param {string} options.aspect_ratio - 宽高比 (可选)
     * @returns {Promise<Object>} 任务ID和状态
     */
    async createMidjourneyImage(options = {}) {
        const {
            prompt,
            model = 'midjourney-v6',
            width,
            height,
            aspect_ratio
        } = options;

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('prompt参数是必需的，且必须是字符串');
        }

        const requestData = {
            model,
            prompt
        };

        if (width) requestData.width = width;
        if (height) requestData.height = height;
        if (aspect_ratio) requestData.aspect_ratio = aspect_ratio;

        return this.post('/midjourney/imagine', requestData);
    }

    /**
     * 查询Midjourney任务状态
     * @param {string} taskId - 任务ID
     * @returns {Promise<Object>} 任务状态和结果
     */
    async getMidjourneyTask(taskId) {
        if (!taskId) {
            throw new Error('taskId参数是必需的');
        }

        return this.get(`/midjourney/task/${taskId}`);
    }

    /**
     * 执行Midjourney动作 (如放大、变体等)
     * @param {Object} options - 动作参数
     * @param {string} options.taskId - 原始任务ID
     * @param {string} options.action - 动作类型 ("upscale", "variation", "reroll")
     * @param {number} options.index - 图像索引 (1-4, upscale时必需)
     * @returns {Promise<Object>} 新任务ID
     */
    async executeMidjourneyAction(options = {}) {
        const {
            taskId,
            action,
            index
        } = options;

        if (!taskId) {
            throw new Error('taskId参数是必需的');
        }

        if (!action) {
            throw new Error('action参数是必需的');
        }

        const requestData = { action };

        if (index) {
            requestData.index = index;
        }

        return this.post(`/midjourney/action/${taskId}`, requestData);
    }

    /**
     * Ideogram图像生成
     * @param {Object} options - Ideogram参数
     * @param {string} options.prompt - 图像描述提示词
     * @param {string} options.model - Ideogram模型 (默认: "ideogram-v2-turbo")
     * @param {number} options.magic_prompt_option - 魔法提示选项 (0-2)
     * @param {string} options.style_type - 风格类型
     * @param {number} options.n - 生成数量 (默认: 1)
     * @param {boolean} options.aspect_ratio - 宽高比 (true为宽屏，false为竖屏)
     * @returns {Promise<Object>} 生成结果
     */
    async createIdeogramImage(options = {}) {
        const {
            prompt,
            model = 'ideogram-v2-turbo',
            magic_prompt_option = 0,
            style_type,
            n = 1,
            aspect_ratio = false
        } = options;

        if (!prompt || typeof prompt !== 'string') {
            throw new Error('prompt参数是必需的，且必须是字符串');
        }

        const requestData = {
            model,
            prompt,
            magic_prompt_option,
            n,
            aspect_ratio
        };

        if (style_type) {
            requestData.style_type = style_type;
        }

        return this.post('/ideogram/generate', requestData);
    }

    /**
     * 下载图像到临时目录
     * @param {string} imageUrl - 图像URL
     * @returns {Promise<string>} 本地文件路径
     */
    async downloadImage(imageUrl) {
        const response = await this.client.get(imageUrl, {
            responseType: 'stream'
        });

        const tempDir = './temp';
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const fileName = `temp_${Date.now()}.jpg`;
        const filePath = `${tempDir}/${fileName}`;

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });
    }

    /**
     * 批量生成图像
     * @param {Object} options - 批量生成参数
     * @param {Array} options.prompts - 提示词数组
     * @param {string} options.model - 模型名称
     * @param {Object} options.imageOptions - 图像生成选项
     * @param {Function} options.onProgress - 进度回调函数
     * @returns {Promise<Array>} 生成结果数组
     */
    async batchCreateImages(options = {}) {
        const {
            prompts,
            model = 'dall-e-3',
            imageOptions = {},
            onProgress
        } = options;

        if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
            throw new Error('prompts参数是必需的，且必须是数组格式');
        }

        const results = [];
        const total = prompts.length;

        for (let i = 0; i < total; i++) {
            try {
                const result = await this.createImage({
                    prompt: prompts[i],
                    model,
                    ...imageOptions
                });
                results.push({ success: true, result, prompt: prompts[i] });

                if (onProgress) {
                    onProgress({
                        current: i + 1,
                        total,
                        progress: ((i + 1) / total) * 100,
                        prompt: prompts[i]
                    });
                }
            } catch (error) {
                results.push({ success: false, error, prompt: prompts[i] });
                console.error(`生成图像失败 (${i + 1}/${total}):`, error.message);
            }
        }

        return results;
    }

    /**
     * GEMINI 2.5 Flash 图像生成 (通过聊天接口)
     * @param {Object} options - GEMINI生成参数
     * @param {string} options.prompt - 图像描述提示词
     * @param {string} options.model - 模型名称 (默认: "gemini-2.5-flash-image-preview")
     * @param {number} options.max_tokens - 最大token数 (默认: 1000)
     * @param {boolean} options.enable_logging - 是否启用日志记录 (默认: true)
     * @returns {Promise<Object>} 生成结果和日志信息
     */
    async createGemini25FlashImage(options = {}) {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        const {
            prompt,
            model = 'gemini-2.5-flash-image-preview',
            max_tokens = 1000,
            enable_logging = true
        } = options;

        // 记录请求日志
        const requestLog = {
            timestamp,
            type: 'GEMINI_2_5_FLASH_IMAGE_REQUEST',
            model,
            parameters: {
                prompt,
                max_tokens
            }
        };

        if (enable_logging) {
            console.log(`[GEMINI 2.5 FLASH] 开始生成图像 - ${timestamp}`);
            console.log(`[GEMINI 2.5 FLASH] 提示词: ${prompt}`);
        }

        try {
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('prompt参数是必需的，且必须是字符串');
            }

            // 使用聊天接口生成图像
            const requestData = {
                model,
                messages: [{
                    role: 'user',
                    content: `请生成一张图片：${prompt}`
                }],
                max_tokens
            };

            const response = await this.post('/v1/chat/completions', requestData);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 记录成功响应日志
            const successLog = {
                timestamp: new Date().toISOString(),
                type: 'GEMINI_2_5_FLASH_IMAGE_SUCCESS',
                duration: `${duration}ms`,
                response: response
            };

            if (enable_logging) {
                console.log(`[GEMINI 2.5 FLASH] 生成成功 - 耗时: ${duration}ms`);
                console.log(`[GEMINI 2.5 FLASH] 生成结果预览:`, response.choices?.[0]?.message?.content?.substring(0, 100) + '...');
            }

            // 解析图像数据
            const content = response.choices?.[0]?.message?.content || '';
            const imageData = this.extractImageData(content);

            return {
                success: true,
                data: {
                    model,
                    prompt,
                    content,
                    image_data: imageData,
                    raw_response: response
                },
                logs: [requestLog, successLog],
                duration
            };

        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 记录错误日志
            const errorLog = {
                timestamp: new Date().toISOString(),
                type: 'GEMINI_2_5_FLASH_IMAGE_ERROR',
                duration: `${duration}ms`,
                error: {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                }
            };

            if (enable_logging) {
                console.error(`[GEMINI 2.5 FLASH] 生成失败 - 耗时: ${duration}ms`);
                console.error(`[GEMINI 2.5 FLASH] 错误信息:`, error.message);
                if (error.response?.data) {
                    console.error(`[GEMINI 2.5 FLASH] 错误详情:`, JSON.stringify(error.response.data, null, 2));
                }
            }

            return {
                success: false,
                error: error.message,
                logs: [requestLog, errorLog],
                duration
            };
        }
    }

    /**
     * GEMINI 3.0 Flash 图像生成
     * @param {Object} options - GEMINI生成参数
     * @param {string} options.prompt - 图像描述提示词
     * @param {string} options.model - 模型名称 (默认: "gemini-3.0-flash-exp-image-generation")
     * @param {number} options.width - 图像宽度 (默认: 1024)
     * @param {number} options.height - 图像高度 (默认: 1024)
     * @param {number} options.n - 生成图像数量 (默认: 1)
     * @param {string} options.response_format - 响应格式 ("url" 或 "b64_json", 默认: "url")
     * @param {boolean} options.safety_filter_level - 安全过滤级别 (默认: true)
     * @param {boolean} options.enable_logging - 是否启用日志记录 (默认: true)
     * @param {string} options.style - 图像风格 ("realistic" 或 "artistic", 默认: "realistic")
     * @returns {Promise<Object>} 生成结果和日志信息
     */
    async createGemini30FlashImage(options = {}) {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        const {
            prompt,
            model = 'gemini-3.0-flash-exp-image-generation',
            width = 1024,
            height = 1024,
            n = 1,
            response_format = 'url',
            safety_filter_level = true,
            enable_logging = true,
            style = 'realistic'
        } = options;

        // 记录请求日志
        const requestLog = {
            timestamp,
            type: 'GEMINI_3_0_FLASH_IMAGE_REQUEST',
            model,
            parameters: {
                prompt,
                width,
                height,
                n,
                response_format,
                safety_filter_level,
                style
            }
        };

        if (enable_logging) {
            console.log(`[GEMINI 3.0 FLASH] 开始生成图像 - ${timestamp}`);
            console.log(`[GEMINI 3.0 FLASH] 提示词: ${prompt}`);
            console.log(`[GEMINI 3.0 FLASH] 图像风格: ${style}`);
        }

        try {
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('prompt参数是必需的，且必须是字符串');
            }

            const requestData = {
                model,
                prompt,
                width,
                height,
                n,
                response_format,
                safety_filter_level,
                style
            };

            const response = await this.post('/gemini/v1/images/generations', requestData);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 记录成功响应日志
            const successLog = {
                timestamp: new Date().toISOString(),
                type: 'GEMINI_3_0_FLASH_IMAGE_SUCCESS',
                duration: `${duration}ms`,
                response: response
            };

            if (enable_logging) {
                console.log(`[GEMINI 3.0 FLASH] 生成成功 - 耗时: ${duration}ms`);
                console.log(`[GEMINI 3.0 FLASH] 生成结果:`, JSON.stringify(response, null, 2));
            }

            return {
                success: true,
                data: response,
                logs: [requestLog, successLog],
                duration
            };

        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 记录错误日志
            const errorLog = {
                timestamp: new Date().toISOString(),
                type: 'GEMINI_3_0_FLASH_IMAGE_ERROR',
                duration: `${duration}ms`,
                error: {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                }
            };

            if (enable_logging) {
                console.error(`[GEMINI 3.0 FLASH] 生成失败 - 耗时: ${duration}ms`);
                console.error(`[GEMINI 3.0 FLASH] 错误信息:`, error.message);
                if (error.response?.data) {
                    console.error(`[GEMINI 3.0 FLASH] 错误详情:`, JSON.stringify(error.response.data, null, 2));
                }
            }

            return {
                success: false,
                error: error.message,
                logs: [requestLog, errorLog],
                duration
            };
        }
    }

    /**
     * 通用GEMINI图像生成方法 (支持多版本)
     * @param {Object} options - 生成参数
     * @param {string} options.prompt - 图像描述提示词
     * @param {string} options.version - GEMINI版本 ("2.5" 或 "3.0", 默认: "3.0")
     * @param {Object} options.imageOptions - 其他图像生成参数
     * @returns {Promise<Object>} 生成结果和完整日志
     */
    async createGeminiImage(options = {}) {
        const { version = '3.0', imageOptions = {} } = options;

        if (version === '2.5') {
            return await this.createGemini25FlashImage({
                ...imageOptions,
                prompt: options.prompt
            });
        } else if (version === '3.0') {
            return await this.createGemini30FlashImage({
                ...imageOptions,
                prompt: options.prompt
            });
        } else {
            throw new Error(`不支持的GEMINI版本: ${version}。支持的版本: 2.5, 3.0`);
        }
    }

    /**
     * GEMINI 3.0 Flash 图像生成 (通过聊天接口)
     * @param {Object} options - GEMINI生成参数
     * @param {string} options.prompt - 图像描述提示词
     * @param {string} options.model - 模型名称 (默认: "gemini-3-pro-image-preview")
     * @param {number} options.max_tokens - 最大token数 (默认: 1000)
     * @param {boolean} options.enable_logging - 是否启用日志记录 (默认: true)
     * @returns {Promise<Object>} 生成结果和日志信息
     */
    async createGemini30FlashImage(options = {}) {
        const startTime = Date.now();
        const timestamp = new Date().toISOString();

        const {
            prompt,
            model = 'gemini-3-pro-image-preview',
            max_tokens = 1000,
            enable_logging = true
        } = options;

        // 记录请求日志
        const requestLog = {
            timestamp,
            type: 'GEMINI_3_0_FLASH_IMAGE_REQUEST',
            model,
            parameters: {
                prompt,
                max_tokens
            }
        };

        if (enable_logging) {
            console.log(`[GEMINI 3.0 FLASH] 开始生成图像 - ${timestamp}`);
            console.log(`[GEMINI 3.0 FLASH] 提示词: ${prompt}`);
        }

        try {
            if (!prompt || typeof prompt !== 'string') {
                throw new Error('prompt参数是必需的，且必须是字符串');
            }

            // 使用聊天接口生成图像
            const requestData = {
                model,
                messages: [{
                    role: 'user',
                    content: `请生成一张图片：${prompt}`
                }],
                max_tokens
            };

            const response = await this.post('/v1/chat/completions', requestData);
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 记录成功响应日志
            const successLog = {
                timestamp: new Date().toISOString(),
                type: 'GEMINI_3_0_FLASH_IMAGE_SUCCESS',
                duration: `${duration}ms`,
                response: response
            };

            if (enable_logging) {
                console.log(`[GEMINI 3.0 FLASH] 生成成功 - 耗时: ${duration}ms`);
                console.log(`[GEMINI 3.0 FLASH] 生成结果预览:`, response.choices?.[0]?.message?.content?.substring(0, 100) + '...');
            }

            // 解析图像数据
            const content = response.choices?.[0]?.message?.content || '';
            const imageData = this.extractImageData(content);

            return {
                success: true,
                data: {
                    model,
                    prompt,
                    content,
                    image_data: imageData,
                    raw_response: response
                },
                logs: [requestLog, successLog],
                duration
            };

        } catch (error) {
            const endTime = Date.now();
            const duration = endTime - startTime;

            // 记录错误日志
            const errorLog = {
                timestamp: new Date().toISOString(),
                type: 'GEMINI_3_0_FLASH_IMAGE_ERROR',
                duration: `${duration}ms`,
                error: {
                    message: error.message,
                    status: error.response?.status,
                    statusText: error.response?.statusText,
                    data: error.response?.data
                }
            };

            if (enable_logging) {
                console.error(`[GEMINI 3.0 FLASH] 生成失败 - 耗时: ${duration}ms`);
                console.error(`[GEMINI 3.0 FLASH] 错误信息:`, error.message);
                if (error.response?.data) {
                    console.error(`[GEMINI 3.0 FLASH] 错误详情:`, JSON.stringify(error.response.data, null, 2));
                }
            }

            return {
                success: false,
                error: error.message,
                logs: [requestLog, errorLog],
                duration
            };
        }
    }

    /**
     * 从内容中提取图像数据
     * @param {string} content - 包含图像的内容
     * @returns {Object} 提取的图像信息
     */
    extractImageData(content) {
        const imageData = {
            has_image: false,
            base64_data: null,
            image_format: null,
            description: '',
            markdown_images: []
        };

        if (!content) {
            return imageData;
        }

        // 查找base64图像
        const base64Regex = /data:image\/(\w+);base64,([a-zA-Z0-9+/=]+)/g;
        const matches = content.matchAll(base64Regex);

        for (const match of matches) {
            imageData.has_image = true;
            imageData.image_format = match[1];
            imageData.base64_data = match[0];
            break; // 只取第一个图像
        }

        // 查找Markdown图像链接
        const markdownRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
        const markdownMatches = content.matchAll(markdownRegex);

        for (const match of markdownMatches) {
            imageData.markdown_images.push({
                alt: match[1],
                url: match[2]
            });
        }

        // 提取图像描述文本
        const lines = content.split('\n');
        const descriptionLines = [];
        let inImageSection = false;

        for (const line of lines) {
            if (line.includes('图片') || line.includes('图像') || line.includes('picture') || line.includes('image')) {
                inImageSection = true;
            }

            if (inImageSection && !line.includes('data:image') && !line.includes('![') && line.trim()) {
                descriptionLines.push(line.trim());
            }

            // 如果遇到了图像数据，跳过描述部分
            if (line.includes('data:image')) {
                break;
            }
        }

        imageData.description = descriptionLines.slice(0, 3).join(' '); // 只取前3行作为描述

        return imageData;
    }

    /**
     * 保存base64图像到文件
     * @param {string} base64Data - base64图像数据
     * @param {string} filename - 文件名 (可选)
     * @returns {Promise<string>} 保存的文件路径
     */
    async saveBase64Image(base64Data, filename = null) {
        if (!base64Data) {
            throw new Error('base64Data参数是必需的');
        }

        // 提取base64数据
        let base64Content = base64Data;
        let fileExtension = 'png';

        if (base64Data.includes('data:image/')) {
            const matches = base64Data.match(/data:image\/(\w+);base64,/);
            if (matches) {
                fileExtension = matches[1];
                base64Content = base64Data.split(',')[1];
            }
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultFilename = `gemini-image-${timestamp}.${fileExtension}`;
        const finalFilename = filename || defaultFilename;

        const outputDir = './output';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        const filePath = `${outputDir}/${finalFilename}`;

        try {
            const buffer = Buffer.from(base64Content, 'base64');
            fs.writeFileSync(filePath, buffer);
            console.log(`[IMAGE] 图像已保存到: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error(`[IMAGE] 保存图像失败:`, error.message);
            throw error;
        }
    }

    /**
     * 保存日志到文件
     * @param {Array} logs - 日志数组
     * @param {string} filename - 文件名 (可选，默认使用时间戳)
     * @returns {Promise<string>} 保存的文件路径
     */
    async saveLogsToFile(logs, filename = null) {
        if (!logs || !Array.isArray(logs)) {
            throw new Error('logs参数是必需的，且必须是数组格式');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const defaultFilename = `gemini-image-logs-${timestamp}.json`;
        const finalFilename = filename || defaultFilename;

        const logDir = './logs';
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const filePath = `${logDir}/${finalFilename}`;
        const logData = {
            generated_at: new Date().toISOString(),
            total_logs: logs.length,
            logs: logs
        };

        // 美化JSON输出
        const jsonContent = JSON.stringify(logData, null, 2);

        try {
            fs.writeFileSync(filePath, jsonContent, 'utf8');
            console.log(`[LOG] 日志已保存到: ${filePath}`);
            return filePath;
        } catch (error) {
            console.error(`[LOG] 保存日志失败:`, error.message);
            throw error;
        }
    }
}

export default ImageAPI;