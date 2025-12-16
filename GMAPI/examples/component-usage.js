import GeminiImageGenerator from '../src/GeminiImageGenerator.js';

/**
 * GEMINI图像生成组件使用示例
 * 展示如何在其他系统中集成和使用该组件
 */

async function demonstrateComponentUsage() {
    console.log('🚀 GEMINI图像生成组件使用示例');
    console.log('=====================================');
    console.log('');

    // 1. 初始化组件
    const generator = new GeminiImageGenerator({
        apiKey: "sk-Su2GtfkFxls0BKw7Xi4UfG5ycaxCHO1yBQWYRirPfDhFJmtP",
        baseUrl: "https://api.vectorengine.ai",
        outputDir: "./generated-images",
        logDir: "./component-logs",
        enableLogging: true,
        defaultModel: "gemini-2.5-flash-image-preview"
    });

    console.log('✅ 组件初始化完成');
    console.log('');

    // 2. 检查组件状态
    const status = generator.getStatus();
    console.log('📊 组件状态:');
    console.log(`  - 配置有效: ${status.validation.valid ? '✅' : '❌'}`);
    console.log(`  - 支持的模型: ${status.supportedModels.length} 个`);
    console.log(`  - 输出目录: ${status.config.outputDir}`);
    console.log(`  - 日志目录: ${status.config.logDir}`);
    console.log('');

    // 3. 简单图像生成示例
    console.log('🎨 示例 1: 简单图像生成');
    console.log('');

    try {
        const result1 = await generator.generate({
            prompt: "一只可爱的橙色小猫坐在樱花树下，动漫风格",
            filename: "cute-cat"
        });

        console.log('📄 生成结果:');
        console.log(`  - 成功: ${result1.success ? '✅' : '❌'}`);
        console.log(`  - 耗时: ${result1.duration}ms`);
        console.log(`  - 模型: ${result1.model}`);

        if (result1.success) {
            console.log(`  - 有图像: ${result1.hasImage ? '✅' : '❌'}`);
            if (result1.imagePath) {
                console.log(`  - 图像路径: ${result1.imagePath}`);
            }
            if (result1.logPath) {
                console.log(`  - 日志路径: ${result1.logPath}`);
            }
        } else {
            console.log(`  - 错误: ${result1.error}`);
        }
        console.log('');

    } catch (error) {
        console.error('❌ 生成失败:', error.message);
        console.log('');
    }

    // 4. 使用不同模型的示例
    console.log('🎨 示例 2: 使用GEMINI 3 Pro模型');
    console.log('');

    try {
        const result2 = await generator.generate({
            prompt: "未来科技城市的夜景，霓虹灯闪烁，赛博朋克风格，高清细节",
            model: "3.0",  // 使用简化版本号
            maxTokens: 1500,
            filename: "cyber-city"
        });

        console.log('📄 生成结果:');
        console.log(`  - 成功: ${result2.success ? '✅' : '❌'}`);
        console.log(`  - 耗时: ${result2.duration}ms`);
        console.log(`  - 模型: ${result2.model}`);

        if (result2.success && result2.hasImage) {
            console.log(`  - 图像格式: ${result2.imageData.format}`);
            if (result2.imagePath) {
                console.log(`  - 图像路径: ${result2.imagePath}`);
            }
        }
        console.log('');

    } catch (error) {
        console.error('❌ 生成失败:', error.message);
        console.log('');
    }

    // 5. 批量生成示例
    console.log('🎨 示例 3: 批量图像生成');
    console.log('');

    const batchPrompts = [
        "一片宁静的山间湖泊，清晨时分，薄雾缭绕",
        "一条金色巨龙盘旋在雪山之巅，月光洒下",
        "精美的中国传统建筑，红色宫殿屋顶"
    ];

    try {
        const batchResults = await generator.batchGenerate(
            batchPrompts.map(prompt => ({ prompt })),
            {
                saveImage: true,
                saveLog: true
            },
            (progress) => {
                console.log(`⏳ 进度: ${progress.current}/${progress.total} (${progress.progress.toFixed(1)}%)`);
                console.log(`   当前: ${progress.prompt.substring(0, 30)}...`);
            }
        );

        console.log('📄 批量生成结果:');
        const successCount = batchResults.filter(r => r.success).length;
        const imageCount = batchResults.filter(r => r.hasImage).length;

        console.log(`  - 总数: ${batchResults.length}`);
        console.log(`  - 成功: ${successCount}`);
        console.log(`  - 有图像: ${imageCount}`);

        batchResults.forEach((result, index) => {
            const status = result.success ? '✅' : '❌';
            const image = result.hasImage ? '🖼️' : '📝';
            console.log(`  ${index + 1}. ${status} ${image} ${result.originalPrompt.substring(0, 40)}...`);
        });
        console.log('');

    } catch (error) {
        console.error('❌ 批量生成失败:', error.message);
        console.log('');
    }

    // 6. 错误处理示例
    console.log('🎨 示例 4: 错误处理');
    console.log('');

    try {
        const result4 = await generator.generate({
            prompt: "",  // 空提示词，应该会失败
            saveImage: false,
            saveLog: false
        });

        console.log('📄 错误处理结果:');
        console.log(`  - 成功: ${result4.success ? '✅' : '❌'}`);
        if (!result4.success) {
            console.log(`  - 错误信息: ${result4.error}`);
            console.log(`  - 请求ID: ${result4.requestId}`);
        }
        console.log('');

    } catch (error) {
        console.log('📄 捕获的异常:');
        console.log(`  - 错误: ${error.message}`);
        console.log('');
    }

    console.log('🎉 所有示例演示完成!');
    console.log('');
    console.log('💡 使用建议:');
    console.log('1. 在生产环境中，建议设置合理的超时时间');
    console.log('2. 批量生成时注意添加适当的延迟');
    console.log('3. 定期清理生成的图像和日志文件');
    console.log('4. 根据需要选择合适的模型版本');
}

// 运行示例
demonstrateComponentUsage().catch(error => {
    console.error('❌ 演示程序出错:', error);
    process.exit(1);
});