# GMAPI - GEMINI图像生成组件

[![npm version](https://img.shields.io/npm/v/gmapi-gemini-image-generator.svg)](https://www.npmjs.org/package/gmapi-gemini-image-generator)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen.svg)](https://nodejs.org/)

一个功能完整、易于集成的GEMINI图像生成组件，提供简单易用的API接口来生成高质量图像。

## ✨ 特性

- 🎨 **多模型支持**: 支持GEMINI 2.5 Flash和3.0 Pro模型
- 🚀 **简单易用**: 一行代码生成图像
- 📁 **自动管理**: 自动保存图像和日志
- 🛡️ **错误处理**: 完整的异常处理机制
- 📊 **详细日志**: 完整的请求和响应日志记录
- 🔄 **批量生成**: 支持批量图像生成
- 📦 **轻量级**: 核心功能文件少，易于移植

## 🚀 快速开始

### 安装

```bash
# 克隆项目
git clone <repository-url>
cd gmapi

# 安装依赖
npm install
```

### 基本使用

```javascript
import { generateImage } from './src/GeminiAPI.js';

// 一行代码生成图像
const result = await generateImage('一只可爱的小猫坐在樱花树下');

if (result.success) {
    console.log('图像保存到:', result.imagePath);
    console.log('图像格式:', result.imageData.format);
} else {
    console.error('生成失败:', result.error);
}
```

### 高级使用

```javascript
import GeminiImageGenerator from './src/GeminiImageGenerator.js';

// 初始化组件
const generator = new GeminiImageGenerator({
    apiKey: 'your-api-key',
    outputDir: './my-images',
    logDir: './my-logs'
});

// 生成图像
const result = await generator.generate({
    prompt: '未来科技城市的夜景，霓虹灯闪烁',
    model: '3.0',  // 使用GEMINI 3 Pro
    filename: 'cyber-city',
    maxTokens: 1500
});
```

## 📁 项目结构

```
GMAPI/
├── src/                          # 核心代码
│   ├── VectorEngineClient.js     # HTTP客户端基础类
│   ├── ImageAPI.js               # 图像生成API
│   ├── GeminiImageGenerator.js   # 主组件类 ⭐
│   └── GeminiAPI.js              # 简化API接口 ⭐
├── examples/                     # 使用示例
│   └── component-usage.js        # 完整使用示例
├── docs/                         # 文档
│   ├── COMPONENT_README.md       # 详细组件文档
│   ├── QUICK_DEPLOY.md           # 快速部署指南
│   └── DEPLOY_FILES.txt          # 部署文件清单
├── package.json                  # 项目配置
├── README.md                     # 本文件
├── .env.example                  # 环境变量模板
└── GE.txt                        # API配置文件
```

## 🔧 配置

### 方法1: 环境变量

创建 `.env` 文件：
```env
VECTOR_ENGINE_API_KEY=your-api-key
VECTOR_ENGINE_BASE_URL=https://api.vectorengine.ai
DEFAULT_GEMINI_IMAGE_VERSION=3.0
ENABLE_DETAILED_LOGGING=true
```

### 方法2: 配置文件

项目已包含 `GE.txt` 配置文件：
```json
{
  "base_url": "https://api.vectorengine.ai",
  "api_key": "your-api-key",
  "model": "gemini-2.5-flash-image-preview"
}
```

### 方法3: 代码配置

```javascript
const generator = new GeminiImageGenerator({
    apiKey: 'your-api-key',
    baseUrl: 'https://api.vectorengine.ai',
    outputDir: './output',
    logDir: './logs',
    enableLogging: true,
    defaultModel: 'gemini-2.5-flash-image-preview'
});
```

## 🎯 API接口

### 简化接口

```javascript
import { generateImage, generateImage3Pro, generateMultipleImages } from './src/GeminiAPI.js';

// 基本图像生成
const result1 = await generateImage('提示词');

// 使用特定模型
const result2 = await generateImage3Pro('提示词');

// 批量生成
const results = await generateMultipleImages(['提示词1', '提示词2', '提示词3']);
```

### 高级接口

```javascript
import GeminiImageGenerator from './src/GeminiImageGenerator.js';

const generator = new GeminiImageGenerator({ apiKey: 'your-key' });

// 单个图像生成
const result = await generator.generate({
    prompt: '图像描述',
    model: '3.0',
    filename: 'my-image',
    maxTokens: 1000
});

// 批量生成
const results = await generator.batchGenerate([
    { prompt: '图像1', model: '2.5' },
    { prompt: '图像2', model: '3.0' },
    { prompt: '图像3' }
]);
```

## 📊 返回结果格式

```javascript
{
    success: true,                     // 是否成功
    prompt: '原始提示词',
    model: 'gemini-2.5-flash-image-preview',
    requestId: 'req_1234567890_abc',
    timestamp: '2025-01-15T10:30:00.000Z',
    duration: 15000,                   // 总耗时(毫秒)
    hasImage: true,                    // 是否包含图像
    imageData: {
        format: 'png',                 // 图像格式
        base64Data: 'data:image/png;base64,...',
        description: '图像描述',
        markdownImages: []
    },
    imagePath: './output/image.png',   // 图像文件路径
    logPath: './logs/logs.json'       // 日志文件路径
}
```

## 🧪 测试

```bash
# 运行基础测试
npm test

# 运行高级示例
npm run test-advanced

# 运行演示
npm run demo

# 查看文档
npm run docs
```

## 🎨 支持的模型

| 模型ID | 简化调用 | 描述 | 格式 |
|--------|----------|------|------|
| `gemini-2.5-flash-image-preview` | `'2.5'` | 快速生成，适合大多数场景 | PNG |
| `gemini-3-pro-image-preview` | `'3.0'` | 高质量生成，细节丰富 | PNG/JPEG |

## 📚 示例代码

### Web服务集成

```javascript
import express from 'express';
import { generateImage } from './src/GeminiAPI.js';

const app = express();
app.use(express.json());

app.post('/api/generate', async (req, res) => {
    try {
        const { prompt, options = {} } = req.body;
        const result = await generateImage(prompt, options);

        if (result.success) {
            res.json({
                success: true,
                imageUrl: result.imagePath,
                format: result.imageData.format
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(3000);
```

### React组件集成

```javascript
import React, { useState } from 'react';
import { generateImage } from './src/GeminiAPI.js';

function ImageGenerator() {
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleGenerate = async () => {
        setLoading(true);
        try {
            const imageResult = await generateImage(prompt, {
                saveImage: true,
                filename: `react-gen-${Date.now()}`
            });
            setResult(imageResult);
        } catch (error) {
            console.error('生成失败:', error);
        }
        setLoading(false);
    };

    return (
        <div>
            <input
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="输入图像描述..."
            />
            <button onClick={handleGenerate} disabled={loading}>
                {loading ? '生成中...' : '生成图像'}
            </button>
            {result && result.success && (
                <div>
                    <p>生成成功！</p>
                    <p>图像路径: {result.imagePath}</p>
                </div>
            )}
        </div>
    );
}
```

## ⚠️ 注意事项

1. **API密钥**: 不要在客户端代码中暴露API密钥
2. **配额限制**: 注意API使用配额，避免过度消耗
3. **网络连接**: 确保网络连接稳定
4. **文件权限**: 确保输出目录有写入权限
5. **Node.js版本**: 需要Node.js 14.0.0或更高版本

## 🔄 更新日志

### v1.0.0 (2025-01-15)
- 🎉 初始版本发布
- ✅ 支持GEMINI 2.5和3.0图像生成
- ✅ 完整的日志记录系统
- ✅ 批量生成功能
- ✅ 多种调用接口
- ✅ 完整的文档和示例

## 📄 许可证

MIT License

## 🆘 技术支持

如有问题，请：
1. 查看 `docs/` 目录中的详细文档
2. 检查日志文件中的错误信息
3. 确认API密钥和网络连接正常

---

🚀 **GMAPI - 让GEMINI图像生成变得简单！**