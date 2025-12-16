# 快速部署指南

## 🚀 一键部署

### 方案1: 最简部署 (推荐)

将以下文件复制到你的项目中：
```
your-project/
├── src/
│   ├── VectorEngineClient.js
│   ├── GeminiImageGenerator.js
│   └── GeminiAPI.js
├── package.json
└── .env.example
```

### 安装和配置

1. **安装依赖**
```bash
npm install
```

2. **配置API密钥**
```bash
# 复制环境变量模板
cp .env.example .env

# 编辑 .env 文件
nano .env
```

3. **测试部署**
```bash
npm test
```

## 📋 详细步骤

### 第一步：复制核心文件

#### 必需文件清单：
- `src/VectorEngineClient.js` - HTTP客户端
- `src/GeminiImageGenerator.js` - 主组件 ⭐
- `src/GeminiAPI.js` - 简化接口 ⭐
- `package.json` - 项目配置
- `.env.example` - 环境变量模板

#### 复制命令：
```bash
# 创建目录
mkdir -p your-project/src

# 复制核心文件
cp src/VectorEngineClient.js your-project/src/
cp src/GeminiImageGenerator.js your-project/src/
cp src/GeminiAPI.js your-project/src/
cp package-deploy.json your-project/package.json
cp .env.example your-project/
```

### 第二步：安装依赖

```bash
cd your-project
npm install
```

### 第三步：配置API

#### 方法1: 环境变量 (推荐)
```bash
# 编辑 .env 文件
VECTOR_ENGINE_API_KEY=your-api-key-here
VECTOR_ENGINE_BASE_URL=https://api.vectorengine.ai
```

#### 方法2: GE.txt配置文件
```bash
# 创建 GE.txt
echo '{
  "base_url": "https://api.vectorengine.ai",
  "api_key": "your-api-key-here",
  "model": "gemini-2.5-flash-image-preview"
}' > GE.txt
```

### 第四步：验证部署

#### 创建测试文件 `test-deploy.js`:
```javascript
import { generateImage } from './src/GeminiAPI.js';

async function test() {
    try {
        console.log('🧪 开始测试...');
        const result = await generateImage('测试图像：一朵简单的花');

        if (result.success) {
            console.log('✅ 部署成功!');
            console.log('📁 图像路径:', result.imagePath);
            console.log('⏱️  耗时:', result.duration + 'ms');
        } else {
            console.log('❌ 测试失败:', result.error);
        }
    } catch (error) {
        console.error('❌ 部署失败:', error.message);
    }
}

test();
```

#### 运行测试：
```bash
node test-deploy.js
```

## 🎯 基本使用

### 方法1: 简单调用
```javascript
import { generateImage } from './src/GeminiAPI.js';

const result = await generateImage('一只可爱的小猫');
console.log(result.imagePath);
```

### 方法2: 高级调用
```javascript
import GeminiImageGenerator from './src/GeminiImageGenerator.js';

const generator = new GeminiImageGenerator({
    apiKey: 'your-key',
    outputDir: './my-images'
});

const result = await generator.generate({
    prompt: '未来科技城市',
    model: '3.0',
    filename: 'cyber-city'
});
```

## ⚠️ 常见问题

### 1. "module not found" 错误
**解决**: 确保package.json中有 `"type": "module"`

### 2. "API密钥未配置" 错误
**解决**: 检查.env文件或GE.txt文件

### 3. "权限不足" 错误
**解决**: 确保输出目录有写入权限

### 4. "网络连接失败" 错误
**解决**: 检查网络连接和防火墙设置

## 🔧 高级配置

### 自定义输出目录
```javascript
const generator = new GeminiImageGenerator({
    apiKey: 'your-key',
    outputDir: './custom-images',
    logDir: './custom-logs'
});
```

### 使用不同模型
```javascript
// GEMINI 2.5
const result = await generateImage('提示词', { model: '2.5' });

// GEMINI 3 Pro
const result = await generateImage('提示词', { model: '3.0' });
```

### 批量生成
```javascript
const generator = new GeminiImageGenerator({ apiKey: 'your-key' });

const results = await generator.batchGenerate([
    { prompt: '图像1' },
    { prompt: '图像2' },
    { prompt: '图像3' }
]);
```

## 📞 技术支持

如果部署过程中遇到问题，请检查：
1. Node.js版本 >= 14.0.0
2. 网络连接正常
3. API密钥有效
4. 文件权限正确

🎉 部署完成后，你就可以在任何地方使用GEMINI图像生成功能了！