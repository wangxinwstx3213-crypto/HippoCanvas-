// 加载环境变量
import { config } from 'dotenv';
config({ path: '.env.local' });

// 测试 GMAPI 接口
import { generateImage, testAPI } from './GMAPI/src/GeminiAPI.js';

async function testGMAPI() {
  console.log('🧪 开始测试 GMAPI 接口...\n');

  // 测试 API 连接
  console.log('1. 测试 API 连接...');
  try {
    // 使用配置文件中的 API Key
    const testResult = await testAPI({
      apiKey: process.env.VECTOR_ENGINE_API_KEY,
      baseUrl: process.env.VECTOR_ENGINE_BASE_URL
    });
    if (testResult.success) {
      console.log('✅ API 连接成功');
    } else {
      console.log('❌ API 连接失败:', testResult.message);
      return;
    }
  } catch (error) {
    console.log('❌ API 连接异常:', error.message);
    return;
  }

  // 测试图像生成
  console.log('\n2. 测试图像生成...');
  try {
    // 初始化 GMAPI
    const { initGemini } = await import('./GMAPI/src/GeminiAPI.js');
    initGemini({
      apiKey: process.env.VECTOR_ENGINE_API_KEY,
      baseUrl: process.env.VECTOR_ENGINE_BASE_URL
    });

    const result = await generateImage('测试图像：一朵简单的小太阳', {
      saveImage: true,
      filename: 'test-image',
      model: '2.5'
    });

    if (result.success) {
      console.log('✅ 图像生成成功');
      console.log('   - 图像路径:', result.imagePath);
      console.log('   - 图像格式:', result.imageData?.format);
      console.log('   - 生成时间:', result.duration, 'ms');
    } else {
      console.log('❌ 图像生成失败:', result.error);
    }
  } catch (error) {
    console.log('❌ 图像生成异常:', error.message);
  }

  console.log('\n🎉 测试完成！');
}

// 运行测试
testGMAPI().catch(console.error);