// 测试模型选择功能
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testModelSelection() {
  console.log('🧪 测试不同模型的图像生成...\n');

  const apiKey = process.env.VECTOR_ENGINE_API_KEY;
  const baseUrl = process.env.VECTOR_ENGINE_BASE_URL || 'https://api.vectorengine.ai';

  if (!apiKey) {
    console.log('❌ 找不到 API Key');
    return;
  }

  const models = [
    'gemini-2.5-flash-image-preview',
    'gemini-3-pro-image-preview',
    'gemini-2.0-flash-preview-image-generation'
  ];

  for (const model of models) {
    console.log(`\n🤖 测试模型: ${model}`);

    try {
      const requestBody = {
        model: model,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "生成一个简单的小太阳图标，简洁的设计风格"
              }
            ]
          }
        ],
        max_tokens: 1000,
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
        console.log(`✅ ${model} 请求成功`);
        const result = await response.json();

        if (result.choices && result.choices[0]?.message?.content) {
          const content = result.choices[0].message.content;
          const imageMatch = content.match(/!\[image\]\((data:image\/[^)]+)\)/);
          if (imageMatch) {
            console.log(`✅ ${model} 图像生成成功 (${imageMatch[1].substring(0, 50)}...)`);
          } else {
            console.log(`⚠️ ${model} 响应格式: ${content.substring(0, 100)}...`);
          }
        }
      } else {
        console.log(`❌ ${model} 请求失败: ${response.status} ${response.statusText}`);
        const errorText = await response.text();
        console.log('错误详情:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log(`❌ ${model} 请求异常: ${error.message}`);
    }

    // 添加延迟避免速率限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  console.log('\n🎉 模型测试完成！');
}

testModelSelection().catch(console.error);