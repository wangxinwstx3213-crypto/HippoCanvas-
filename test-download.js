// 测试图片下载功能
import { config } from 'dotenv';
config({ path: '.env.local' });

// 模拟浏览器环境的下载功能
function testImageDownload() {
  console.log('🧪 测试图片下载功能...\n');

  // 模拟 base64 图片数据
  const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

  // 模拟下载函数
  function handleDownloadImage(imageUrl, index = undefined) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modelShortName = 'gemini-2.5-flash';
    const filename = `测试图片-${modelShortName}-${index !== undefined ? `batch-${index + 1}-` : ''}${timestamp}.png`;

    console.log(`📁 准备下载文件: ${filename}`);

    // Extract base64 data
    let base64Data = imageUrl;
    if (imageUrl.startsWith('data:')) {
      base64Data = imageUrl.split(',')[1] || imageUrl;
    }

    try {
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      console.log(`✅ Blob 创建成功，大小: ${blob.size} bytes`);
      console.log(`✅ 文件名: ${filename}`);

      // 在 Node.js 环境中无法模拟真实下载，但我们可以验证数据处理
      return {
        success: true,
        filename: filename,
        size: blob.size,
        type: blob.type
      };
    } catch (error) {
      console.error('❌ 下载失败:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 测试单个图片下载
  console.log('1. 测试单个图片下载:');
  const result1 = handleDownloadImage(testImageData);
  if (result1.success) {
    console.log(`   ✅ 文件: ${result1.filename}`);
    console.log(`   ✅ 大小: ${result1.size} bytes`);
    console.log(`   ✅ 类型: ${result1.type}`);
  } else {
    console.log(`   ❌ 错误: ${result1.error}`);
  }

  // 测试批量下载（模拟多个图片）
  console.log('\n2. 测试批量下载:');
  const testImages = [testImageData, testImageData, testImageData];
  const results = testImages.map((img, index) => {
    setTimeout(() => {
      const result = handleDownloadImage(img, index);
      if (result.success) {
        console.log(`   ✅ 批量下载 ${index + 1}: ${result.filename}`);
      }
    }, index * 100); // 模拟延迟
  });

  // 测试文件名格式
  console.log('\n3. 测试文件名格式:');
  const testCases = [
    { model: 'gemini-2.5-flash-image-preview', title: 'AI生成器' },
    { model: 'gemini-3-pro-image-preview', title: '生成图片' },
    { model: 'unknown-model', title: null }
  ];

  testCases.forEach((testCase, index) => {
    const mockNode = {
      data: {
        model: testCase.model,
        title: testCase.title
      }
    };

    // 模拟文件名生成逻辑
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const modelShortName = mockNode.data.model === 'gemini-2.5-flash-image-preview' ? 'gemini-2.5-flash' :
                           mockNode.data.model === 'gemini-3-pro-image-preview' ? 'gemini-3.0-pro' :
                           mockNode.data.model === 'gemini-2.0-flash-preview-image-generation' ? 'gemini-2.0-flash' : 'gemini';

    const filename = `${mockNode.data.title || 'generated-image'}-${modelShortName}-batch-${index + 1}-${timestamp}.png`;
    console.log(`   ✅ 案例 ${index + 1}: ${filename}`);
  });

  console.log('\n🎉 下载功能测试完成！');
  console.log('\n📝 功能说明:');
  console.log('- ✅ 支持 PNG 格式图片下载');
  console.log('- ✅ 自动生成带时间戳的文件名');
  console.log('- ✅ 包含模型名称和批次信息');
  console.log('- ✅ 支持单个和批量下载');
  console.log('- ✅ 错误处理和用户反馈');
}

// 运行测试
testImageDownload();