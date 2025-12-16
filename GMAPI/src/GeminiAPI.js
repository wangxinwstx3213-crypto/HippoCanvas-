import GeminiImageGenerator from './GeminiImageGenerator.js';
import fs from 'fs';

/**
 * GEMINI图像生成API - 简化接口
 * 提供最简单的调用方式，适合快速集成
 *
 * @example
 * // 最简单的使用方式
 * import { generateImage } from './GeminiAPI.js';
 *
 * const result = await generateImage('一只可爱的小猫');
 * console.log(result.imagePath); // 图像文件路径
 */

// 全局配置
let globalGenerator = null;

/**
 * 初始化全局GEMINI图像生成器
 * @param {Object} config - 配置选项
 */
export function initGemini(config) {
    globalGenerator = new GeminiImageGenerator(config);
    return globalGenerator;
}

/**
 * 生成图像 - 最简化的接口
 * @param {string} prompt - 图像描述提示词
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImage(prompt, options = {}) {
    if (!prompt || typeof prompt !== 'string') {
        throw new Error('prompt参数是必需的字符串');
    }

    // 如果没有初始化全局生成器，使用默认配置
    if (!globalGenerator) {
        // 尝试从GE.txt读取配置
        let apiKey = process.env.VECTOR_ENGINE_API_KEY;
        if (!apiKey) {
            try {
                const fs = await import('fs');
                if (fs.existsSync('./GE.txt')) {
                    const geContent = fs.readFileSync('./GE.txt', 'utf8');
                    const config = JSON.parse(geContent);
                    apiKey = config.api_key;
                }
            } catch (error) {
                // 忽略读取错误
            }
        }

        if (!apiKey) {
            throw new Error('API密钥未配置，请设置环境变量VECTOR_ENGINE_API_KEY或初始化组件时提供apiKey参数');
        }

        globalGenerator = new GeminiImageGenerator({
            apiKey: apiKey,
            baseUrl: process.env.VECTOR_ENGINE_BASE_URL || 'https://api.vectorengine.ai'
        });
    }

    return await globalGenerator.generate({
        prompt,
        ...options
    });
}

/**
 * 生成多个图像
 * @param {Array} prompts - 提示词数组
 * @param {Object} options - 可选配置
 * @param {Function} onProgress - 进度回调
 * @returns {Promise<Array>} 生成结果数组
 */
export async function generateMultipleImages(prompts, options = {}, onProgress = null) {
    if (!globalGenerator) {
        globalGenerator = new GeminiImageGenerator({
            apiKey: process.env.VECTOR_ENGINE_API_KEY,
            baseUrl: process.env.VECTOR_ENGINE_BASE_URL || 'https://api.vectorengine.ai'
        });
    }

    return await globalGenerator.batchGenerate(
        prompts.map(prompt => ({ prompt })),
        options,
        onProgress
    );
}

/**
 * 使用GEMINI 2.5生成图像
 * @param {string} prompt - 图像描述提示词
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImage25(prompt, options = {}) {
    return await generateImage(prompt, {
        model: '2.5',
        ...options
    });
}

/**
 * 使用GEMINI 3 Pro生成图像
 * @param {string} prompt - 图像描述提示词
 * @param {Object} options - 可选配置
 * @returns {Promise<Object>} 生成结果
 */
export async function generateImage3Pro(prompt, options = {}) {
    return await generateImage(prompt, {
        model: '3.0',
        maxTokens: 1500,
        ...options
    });
}

/**
 * 快速测试API连接
 * @param {Object} config - 配置选项
 * @returns {Promise<Object>} 测试结果
 */
export async function testAPI(config = {}) {
    try {
        // 如果没有提供配置，尝试读取GE.txt
        let finalConfig = config;
        if (!config.apiKey && fs.existsSync('./GE.txt')) {
            try {
                const geContent = fs.readFileSync('./GE.txt', 'utf8');
                const geConfig = JSON.parse(geContent);
                finalConfig = {
                    apiKey: geConfig.api_key,
                    baseUrl: geConfig.base_url || 'https://api.vectorengine.ai'
                };
            } catch (error) {
                // 忽略读取错误
            }
        }

        const generator = new GeminiImageGenerator(finalConfig);

        const result = await generator.generate({
            prompt: '测试图像生成：一只简单的小太阳',
            saveImage: false,
            saveLog: false
        });

        return {
            success: true,
            connected: true,
            canGenerate: result.success,
            message: result.success ? 'API连接正常，可以生成图像' : 'API连接正常但生成失败',
            details: result
        };

    } catch (error) {
        return {
            success: false,
            connected: false,
            canGenerate: false,
            message: `API连接失败: ${error.message}`,
            error: error.message
        };
    }
}

/**
 * 获取组件状态
 * @returns {Object} 组件状态信息
 */
export function getGeneratorStatus() {
    if (!globalGenerator) {
        return {
            initialized: false,
            message: '组件未初始化，请先调用 initGemini() 或使用 generateImage() 自动初始化'
        };
    }

    return globalGenerator.getStatus();
}

/**
 * 清理全局生成器
 */
export function cleanup() {
    globalGenerator = null;
}

// 默认导出生成器类
export { GeminiImageGenerator as default };
export { GeminiImageGenerator };