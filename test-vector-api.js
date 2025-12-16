// 测试 Vector Engine API
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testVectorAPI() {
  console.log('🧪 测试 Vector Engine API 连接...\n');

  const apiKey = process.env.VECTOR_ENGINE_API_KEY;
  const baseUrl = process.env.VECTOR_ENGINE_BASE_URL || 'https://api.vectorengine.ai';

  if (!apiKey) {
    console.log('❌ 找不到 API Key');
    return;
  }

  console.log('1. 测试 API 连接...');
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      console.log('✅ API 连接成功');
      const models = await response.json();
      console.log('可用模型:', models.data?.map(m => m.id).join(', ') || '未找到模型');
    } else {
      console.log('❌ API 连接失败:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('错误详情:', errorText);
    }
  } catch (error) {
    console.log('❌ API 连接异常:', error.message);
  }

  console.log('\n2. 测试图像生成...');
  try {
    const requestBody = {
      model: "gemini-2.5-flash-image-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "生成一个简单的小太阳图像"
            }
          ]
        }
      ],
      max_tokens: 1500,
      temperature: 0.7
    };

    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestBody)
    });

    if (response.ok) {
      console.log('✅ 图像生成请求成功');
      const result = await response.json();
      console.log('响应结构:', JSON.stringify(result, null, 2).substring(0, 500) + '...');
    } else {
      console.log('❌ 图像生成失败:', response.status, response.statusText);
      const errorText = await response.text();
      console.log('错误详情:', errorText);
    }
  } catch (error) {
    console.log('❌ 图像生成异常:', error.message);
  }

  console.log('\n🎉 测试完成！');
}

testVectorAPI().catch(console.error);