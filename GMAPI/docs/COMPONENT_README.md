# GEMINI图像生成组件

一个功能完整、易于集成的GEMINI图像生成组件，封装了所有复杂的API调用和图像处理逻辑。

## 🚀 快速开始

### 最简单的使用方式

```javascript
import { generateImage } from './src/GeminiAPI.js';

// 一行代码生成图像
const result = await generateImage('一只可爱的小猫');

if (result.success) {
    console.log('图像保存到:', result.imagePath);
    console.log('图像格式:', result.imageData.format);
} else {
    console.error('生成失败:', result.error);
}
```

### 高级使用方式

```javascript
import GeminiImageGenerator from './src/GeminiImageGenerator.js';

// 初始化组件
const generator = new GeminiImageGenerator({
    apiKey: 'your-api-key',
    baseUrl: 'https://api.vectorengine.ai',
    outputDir: './my-images',
    logDir: './my-logs'
});

// 生成图像
const result = await generator.generate({
    prompt: '未来科技城市的夜景',
    model: '3.0',
    filename: 'cyber-city',
    maxTokens: 1500
});
```

## 📦 安装和配置

### 环境要求
- Node.js 14+
- npm 或 yarn

### 依赖安装
```bash
npm install axios dotenv form-data
```

### 环境变量配置
```env
# .env 文件
VECTOR_ENGINE_API_KEY=your-api-key
VECTOR_ENGINE_BASE_URL=https://api.vectorengine.ai
```

## 🔧 API接口

### 主要接口

#### `GeminiImageGenerator` 类

```javascript
const generator = new GeminiImageGenerator({
    apiKey: 'your-api-key',           // 必需
    baseUrl: 'https://api.vectorengine.ai',  // 可选
    outputDir: './output',             // 可选，图像输出目录
    logDir: './logs',                  // 可选，日志输出目录
    enableLogging: true,               // 可选，是否记录日志
    defaultModel: 'gemini-2.5-flash-image-preview',  // 可选，默认模型
    timeout: 60000                     // 可选，超时时间(毫秒)
});
```

#### `generate()` 方法

```javascript
const result = await generator.generate({
    prompt: '图像描述提示词',           // 必需
    model: '2.5',                      // 可选，模型版本
    filename: 'my-image',              // 可选，自定义文件名
    saveImage: true,                   // 可选，是否保存图像文件
    saveLog: true,                     // 可选，是否保存日志文件
    maxTokens: 1000,                   // 可选，最大token数
    imageFormat: 'png',                // 可选，图像格式
    customOptions: {}                  // 可选，自定义API选项
});
```

#### 返回结果格式

```javascript
{
    success: true,                     // 是否成功
    prompt: '原始提示词',
    model: '使用的模型',
    requestId: 'req_1234567890_abc',  // 请求ID
    timestamp: '2025-01-15T10:30:00.000Z',
    duration: 15000,                   // 总耗时(毫秒)
    hasImage: true,                    // 是否包含图像
    imageData: {
        format: 'png',                 // 图像格式
        base64Data: 'data:image/png;base64,...',  // base64数据
        description: '图像描述',
        markdownImages: []             // Markdown图像链接
    },
    imagePath: './output/image.png',   // 图像文件路径
    logPath: './logs/logs.json'       // 日志文件路径
}
```

### 简化接口

#### `generateImage()` 函数

```javascript
import { generateImage } from './src/GeminiAPI.js';

// 最简单的调用
const result = await generateImage('一只可爱的小猫');

// 带选项的调用
const result = await generateImage('一只可爱的小猫', {
    model: '3.0',
    filename: 'cute-cat',
    maxTokens: 1500
});
```

#### `generateMultipleImages()` 函数

```javascript
import { generateMultipleImages } from './src/GeminiAPI.js';

const prompts = [
    '一只可爱的小猫',
    '未来科技城市',
    '美丽的山水风景'
];

const results = await generateMultipleImages(
    prompts,
    { model: '2.5' },
    (progress) => {
        console.log(`进度: ${progress.progress}%`);
    }
);
```

#### 模型特定函数

```javascript
import { generateImage25, generateImage3Pro } from './src/GeminiAPI.js';

// 使用GEMINI 2.5
const result25 = await generateImage25('提示词');

// 使用GEMINI 3 Pro
const result3Pro = await generateImage3Pro('提示词');
```

## 🎯 支持的模型

| 模型ID | 名称 | 描述 | 格式 |
|--------|------|------|------|
| `gemini-2.5-flash-image-preview` | GEMINI 2.5 Flash | 快速生成，适合大多数场景 | PNG |
| `gemini-3-pro-image-preview` | GEMINI 3 Pro | 高质量生成，细节丰富 | PNG/JPEG |

### 简化版本号

- `'2.5'` → `gemini-2.5-flash-image-preview`
- `'3.0'` → `gemini-3-pro-image-preview`
- `'3-pro'` → `gemini-3-pro-image-preview`

## 📝 使用示例

### 示例1：基本图像生成

```javascript
import { generateImage } from './src/GeminiAPI.js';

const result = await generateImage(
    '一只可爱的橙色小猫坐在樱花树下，动漫风格，高质量'
);

if (result.success) {
    console.log('✅ 生成成功!');
    console.log('📁 图像路径:', result.imagePath);
    console.log('🖼️  图像格式:', result.imageData.format);
} else {
    console.error('❌ 生成失败:', result.error);
}
```

### 示例2：使用指定模型

```javascript
import GeminiImageGenerator from './src/GeminiImageGenerator.js';

const generator = new GeminiImageGenerator({
    apiKey: 'your-api-key'
});

const result = await generator.generate({
    prompt: '未来科技城市的夜景，霓虹灯闪烁',
    model: '3.0',  // 使用GEMINI 3 Pro
    maxTokens: 1500,
    filename: 'cyber-city'
});
```

### 示例3：批量生成

```javascript
import GeminiImageGenerator from './src/GeminiImageGenerator.js';

const generator = new GeminiImageGenerator({
    apiKey: 'your-api-key'
});

const requests = [
    { prompt: '山间湖泊' },
    { prompt: '城市夜景' },
    { prompt: '抽象艺术' }
];

const results = await generator.batchGenerate(
    requests,
    { model: '2.5' },
    (progress) => {
        console.log(`进度: ${progress.current}/${progress.total}`);
    }
);

results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.success ? '✅' : '❌'} ${result.imagePath || result.error}`);
});
```

### 示例4：错误处理

```javascript
import { generateImage } from './src/GeminiAPI.js';

try {
    const result = await generateImage('测试提示词');

    if (!result.success) {
        console.log('生成失败，但程序继续运行');
        console.log('错误信息:', result.error);
        console.log('请求ID:', result.requestId);
        // 根据错误类型进行不同处理
        if (result.error.includes('timeout')) {
            // 处理超时错误
        } else if (result.error.includes('API key')) {
            // 处理API密钥错误
        }
    }
} catch (error) {
    console.error('程序异常:', error.message);
    // 处理网络连接等严重错误
}
```

### 示例5：集成到Web服务

```javascript
import express from 'express';
import { generateImage } from './src/GeminiAPI.js';

const app = express();
app.use(express.json());

// 图像生成API端点
app.post('/api/generate-image', async (req, res) => {
    try {
        const { prompt, options = {} } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: '缺少prompt参数' });
        }

        const result = await generateImage(prompt, {
            saveImage: true,
            saveLog: true,
            ...options
        });

        if (result.success) {
            res.json({
                success: true,
                imageUrl: `/images/${path.basename(result.imagePath)}`,
                format: result.imageData.format,
                duration: result.duration
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

// 提供静态图像文件
app.use('/images', express.static('./output'));

app.listen(3000, () => {
    console.log('服务器运行在 http://localhost:3000');
});
```

## 🛠️ 高级功能

### 自定义配置

```javascript
const generator = new GeminiImageGenerator({
    apiKey: 'your-api-key',
    outputDir: './custom-output',
    logDir: './custom-logs',
    enableLogging: false,  // 关闭日志记录
    defaultModel: 'gemini-3-pro-image-preview',
    timeout: 120000  // 2分钟超时
});
```

### 状态检查

```javascript
import { getGeneratorStatus, testAPI } from './src/GeminiAPI.js';

// 检查组件状态
const status = getGeneratorStatus();
console.log('组件状态:', status);

// 测试API连接
const testResult = await testAPI({
    apiKey: 'your-api-key'
});
console.log('API测试:', testResult);
```

### 组件清理

```javascript
import { cleanup } from './src/GeminiAPI.js';

// 清理全局生成器
cleanup();
```

## 📁 文件结构

```
├── src/
│   ├── GeminiImageGenerator.js  # 主组件类
│   ├── GeminiAPI.js             # 简化API接口
│   ├── ImageAPI.js              # 底层API调用
│   └── VectorEngineClient.js    # HTTP客户端
├── examples/
│   ├── component-usage.js       # 组件使用示例
│   └── gemini-image-example.js  # 基础示例
├── output/                      # 图像输出目录
├── logs/                        # 日志输出目录
└── COMPONENT_README.md         # 本文档
```

## ⚠️ 注意事项

1. **API密钥安全**: 不要在客户端代码中暴露API密钥
2. **超时设置**: 图像生成可能需要较长时间，建议设置合适的超时时间
3. **文件管理**: 定期清理生成的图像和日志文件
4. **错误处理**: 始终检查返回结果的success字段
5. **网络连接**: 确保网络连接稳定，避免中断

## 🔄 更新日志

### v1.0.0
- 初始版本发布
- 支持GEMINI 2.5和3.0图像生成
- 完整的日志记录系统
- 批量生成功能
- 多种调用接口

## 📄 许可证

MIT License

## 🆘 技术支持

如果遇到问题，请检查：
1. API密钥是否正确
2. 网络连接是否正常
3. 日志文件中的详细错误信息
4. 确保输出目录有写入权限