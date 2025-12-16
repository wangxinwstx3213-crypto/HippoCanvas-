import express from 'express';
import path from 'path';
import { generateImage, generateImage3Pro } from './src/GeminiAPI.js';

/**
 * GMAPI Web服务示例
 * 展示如何将图像生成组件集成到Web服务中
 */

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(express.json());
app.use(express.static('./generated')); // 提供生成的图像文件

// 健康检查端点
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'GMAPI服务运行正常',
        timestamp: new Date().toISOString()
    });
});

// 图像生成端点
app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, model = '2.5', options = {} } = req.body;

        if (!prompt || typeof prompt !== 'string') {
            return res.status(400).json({
                success: false,
                error: '提示词参数是必需的'
            });
        }

        console.log(`[API] 收到生成请求: ${prompt.substring(0, 50)}...`);
        console.log(`[API] 使用模型: ${model}`);

        let result;
        if (model === '3.0' || model === '3-pro') {
            result = await generateImage3Pro(prompt, {
                filename: `api-gen-${Date.now()}`,
                saveImage: true,
                ...options
            });
        } else {
            result = await generateImage(prompt, {
                filename: `api-gen-${Date.now()}`,
                saveImage: true,
                ...options
            });
        }

        if (result.success) {
            console.log(`[API] 生成成功: ${result.imagePath}`);
            res.json({
                success: true,
                data: {
                    prompt: result.prompt,
                    model: result.model,
                    imageUrl: `/generated/${path.basename(result.imagePath)}`,
                    format: result.imageData?.format,
                    duration: result.duration,
                    timestamp: result.timestamp
                }
            });
        } else {
            console.log(`[API] 生成失败: ${result.error}`);
            res.status(500).json({
                success: false,
                error: result.error,
                requestId: result.requestId
            });
        }

    } catch (error) {
        console.error('[API] 服务器错误:', error);
        res.status(500).json({
            success: false,
            error: '服务器内部错误'
        });
    }
});

// 批量生成端点
app.post('/api/generate-batch', async (req, res) => {
    try {
        const { prompts, options = {} } = req.body;

        if (!Array.isArray(prompts) || prompts.length === 0) {
            return res.status(400).json({
                success: false,
                error: '提示词数组不能为空'
            });
        }

        if (prompts.length > 5) {
            return res.status(400).json({
                success: false,
                error: '单次批量生成最多支持5个提示词'
            });
        }

        console.log(`[API] 收到批量生成请求: ${prompts.length}个提示词`);

        const generator = new (await import('./src/GeminiImageGenerator.js')).default({
            apiKey: process.env.VECTOR_ENGINE_API_KEY
        });

        const results = await generator.batchGenerate(
            prompts.map(prompt => ({ prompt })),
            options,
            (progress) => {
                console.log(`[API] 批量进度: ${progress.current}/${progress.total}`);
            }
        );

        const successCount = results.filter(r => r.success).length;
        console.log(`[API] 批量生成完成: ${successCount}/${results.length} 成功`);

        res.json({
            success: true,
            data: {
                total: results.length,
                successful: successCount,
                failed: results.length - successCount,
                results: results.map(r => ({
                    success: r.success,
                    prompt: r.prompt || r.originalPrompt,
                    imagePath: r.imagePath ? `/generated/${path.basename(r.imagePath)}` : null,
                    error: r.error,
                    duration: r.duration
                }))
            }
        });

    } catch (error) {
        console.error('[API] 批量生成错误:', error);
        res.status(500).json({
            success: false,
            error: '批量生成失败'
        });
    }
});

// 获取支持的模型信息
app.get('/api/models', (req, res) => {
    res.json({
        success: true,
        data: {
            models: [
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
            ],
            defaultModel: 'gemini-2.5-flash-image-preview'
        }
    });
});

// 提供图像文件
app.use('/generated', express.static('./output'));

// 错误处理中间件
app.use((error, req, res, next) => {
    console.error('[API] 未处理的错误:', error);
    res.status(500).json({
        success: false,
        error: '服务器内部错误'
    });
});

// 404处理
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: '端点不存在'
    });
});

// 启动服务器
app.listen(PORT, () => {
    console.log(`🚀 GMAPI Web服务启动成功`);
    console.log(`📡 服务地址: http://localhost:${PORT}`);
    console.log(`📊 健康检查: http://localhost:${PORT}/health`);
    console.log(`🎨 生成接口: POST http://localhost:${PORT}/api/generate`);
    console.log(`📦 批量接口: POST http://localhost:${PORT}/api/generate-batch`);
    console.log(`🤖 模型信息: GET http://localhost:${PORT}/api/models`);
    console.log('');
    console.log('💡 测试命令:');
    console.log('curl -X POST http://localhost:3000/api/generate \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"prompt":"一只可爱的小猫"}\'');
});

// 优雅关闭
process.on('SIGINT', () => {
    console.log('\n🛑 正在关闭服务器...');
    process.exit(0);
});

export default app;