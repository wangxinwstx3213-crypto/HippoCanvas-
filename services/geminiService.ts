import { SystemSettings } from "../types";
import { supabase } from './supabaseService';
import { userApiService } from './userApiService';

interface GenerateImageOptions {
  prompt: string;
  referenceImages?: string[]; // Array of base64 strings
  aspectRatio?: '1:1' | '16:9' | '9:16' | '3:4' | '4:3';
  imageResolution?: '1K' | '2K' | '4K';
  numberOfImages?: number;
}

export const generateImageWithGemini = async (
  options: GenerateImageOptions,
  settings: SystemSettings,
  userId?: string
): Promise<string[]> => {

  // 确定用户ID
  let targetUserId = userId;

  // 如果没有传入userId，尝试从Supabase获取
  if (!targetUserId) {
    console.log('未传入userId，尝试从认证状态获取用户信息');

    let user = null;
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries && !user) {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      user = currentUser;

      if (!user) {
        console.log(`尝试获取用户信息，第 ${retryCount + 1} 次`);
        await new Promise(resolve => setTimeout(resolve, 100));
        retryCount++;
      }
    }

    if (!user) {
      // 如果仍然无法获取用户，尝试从session获取
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        user = session.user;
        console.log('从session获取到用户信息');
      }
    }

    if (!user) {
      console.error('无法获取用户信息，检查认证状态');
      throw new Error("用户未登录，请先登录后再使用图像生成功能。");
    }

    targetUserId = user.id;
    console.log('获取到用户信息:', user.email, 'ID:', targetUserId);
  }

  console.log('使用用户ID:', targetUserId);

  // 获取用户的Vector Engine API密钥
  const userApiKey = await userApiService.getVectorEngineKey(targetUserId);
  if (!userApiKey) {
    throw new Error("未配置API密钥，请先在用户菜单中配置您的Vector Engine API密钥。");
  }

  // 使用用户的API密钥
  const apiKey = userApiKey;
  const baseUrl = settings.baseUrl || 'https://api.vectorengine.ai';

  if (!apiKey) {
    throw new Error("API Key is missing. Please ensure you have configured an API key.");
  }

  const {
    prompt,
    referenceImages,
    aspectRatio = "1:1",
    imageResolution = "1K",
    numberOfImages = 1
  } = options;

  // 使用 GMAPI 的模型名称
  const modelId = settings.modelName || 'gemini-2.5-flash-image-preview';

  // 准备请求数据
  const performSingleGeneration = async (): Promise<string> => {
    const messages: any[] = [];

    // 构建消息内容
    const content: any[] = [];

    // 添加参考图像
    if (referenceImages && referenceImages.length > 0) {
      referenceImages.forEach((base64Data) => {
        // 处理 base64 数据
        const imageData = base64Data.startsWith('data:') ? base64Data : `data:image/png;base64,${base64Data}`;
        content.push({
          type: "image_url",
          image_url: {
            url: imageData
          }
        });
      });
    }

    // 添加文本提示
    content.push({
      type: "text",
      text: prompt
    });

    messages.push({
      role: "user",
      content: content
    });

    // 使用 Vector Engine API 格式
    const requestBody = {
      model: modelId,
      messages: messages,
      max_tokens: 1500,
      temperature: 0.7,
      // 图像生成参数
      response_format: {
        type: "image",
        quality: "standard"
      }
    };

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error ${response.status}: ${errorData}`);
      }

      const responseData = await response.json();

      // 提取图像数据
      if (responseData.choices && responseData.choices.length > 0) {
        const choice = responseData.choices[0];
        if (choice.message && choice.message.content) {
          const content = choice.message.content;

          // Vector Engine 返回 Markdown 格式的图像链接
          // 格式: ![image](data:image/png;base64,...)
          if (typeof content === 'string') {
            // 使用正则表达式提取 base64 图像数据
            const imageMatch = content.match(/!\[image\]\((data:image\/[^)]+)\)/);
            if (imageMatch && imageMatch[1]) {
              return imageMatch[1];
            }

            // 或者直接检查是否是 base64 数据
            if (content.startsWith('data:image')) {
              return content;
            }
          }

          // 处理 JSON 格式的响应
          const parsedContent = typeof content === 'string'
            ? (() => {
              try {
                return JSON.parse(content);
              } catch {
                return null;
              }
            })()
            : content;

          if (parsedContent) {
            if (parsedContent.url && parsedContent.url.startsWith('data:image')) {
              return parsedContent.url;
            }
            if (parsedContent.image && parsedContent.image.startsWith('data:image')) {
              return parsedContent.image;
            }
          }
        }
      }

      throw new Error("No image data found in response");
    } catch (error) {
      console.error("Vector Engine API Error:", error);
      throw error;
    }
  };

  try {
    // 根据数量并行生成图像
    const promises = Array.from({ length: numberOfImages }, () => performSingleGeneration());
    const results = await Promise.all(promises);
    return results;
  } catch (error) {
    console.error("Gemini Image Generation Error:", error);
    throw error;
  }
};

/**
 * 测试 API 连接
 * @param settings 系统设置
 * @returns 测试结果
 */
export const testGeminiConnection = async (settings: SystemSettings): Promise<any> => {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.VECTOR_ENGINE_API_KEY;
    const baseUrl = settings.baseUrl || process.env.VECTOR_ENGINE_BASE_URL || 'https://api.vectorengine.ai';

    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    return {
      success: response.ok,
      connected: response.ok,
      message: response.ok ? 'API连接正常' : `API连接失败: ${response.status}`,
      status: response.status
    };
  } catch (error) {
    return {
      success: false,
      connected: false,
      message: `API连接失败: ${error.message}`,
      error: error.message
    };
  }
};