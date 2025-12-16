#!/usr/bin/env node

/**
 * GMAPI 快速启动脚本
 * 一键部署和测试GEMINI图像生成组件
 */

import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * 显示欢迎信息
 */
function showWelcome() {
    console.log('🎨 GMAPI - GEMINI图像生成组件');
    console.log('================================');
    console.log('');
    console.log('📦 这是一个完整的GEMINI图像生成解决方案');
    console.log('🚀 包含所有必要的组件和功能');
    console.log('💡 一行代码即可生成高质量图像');
    console.log('');
}

/**
 * 检查环境
 */
function checkEnvironment() {
    console.log('🔍 检查部署环境...');
    console.log('');

    // 检查Node.js版本
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion < 14) {
        console.log('❌ Node.js版本过低');
        console.log(`   当前版本: ${nodeVersion}`);
        console.log('   需要版本: Node.js >= 14.0.0');
        return false;
    }

    console.log(`✅ Node.js版本: ${nodeVersion}`);

    // 检查必要文件
    const requiredFiles = [
        'src/GeminiImageGenerator.js',
        'src/GeminiAPI.js',
        'package.json',
        'GE.txt'
    ];

    let filesOk = true;
    requiredFiles.forEach(file => {
        if (fs.existsSync(file)) {
            console.log(`✅ ${file}`);
        } else {
            console.log(`❌ ${file} - 缺失`);
            filesOk = false;
        }
    });

    return filesOk;
}

/**
 * 安装依赖
 */
async function installDependencies() {
    console.log('\n📦 安装依赖包...');

    try {
        const { stdout, stderr } = await execAsync('npm install', { timeout: 120000 });

        if (stderr && stderr.includes('ERROR')) {
            console.log('⚠️  安装时有警告:', stderr);
        } else {
            console.log('✅ 依赖安装成功');
        }

        return true;
    } catch (error) {
        console.error('❌ 依赖安装失败:', error.message);
        return false;
    }
}

/**
 * 运行测试
 */
async function runTests() {
    console.log('\n🧪 运行功能测试...');

    try {
        const { stdout, stderr } = await execAsync('node test.js', { timeout: 60000 });

        if (stdout.includes('✅ 组件状态')) {
            console.log('✅ 所有测试通过');

            // 提取生成信息
            const lines = stdout.split('\n');
            const successLine = lines.find(line => line.includes('成功: ✅'));
            const timeLine = lines.find(line => line.includes('耗时:'));

            if (successLine && timeLine) {
                console.log('📊 测试详情:');
                console.log(`   ${successLine.trim()}`);
                console.log(`   ${timeLine.trim()}`);
            }

            return true;
        } else {
            console.log('⚠️  测试部分成功');
            console.log(stdout);
            return false;
        }
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        return false;
    }
}

/**
 * 显示使用示例
 */
function showUsageExamples() {
    console.log('\n📚 使用示例:');
    console.log('');
    console.log('// 1. 基本图像生成');
    console.log('import { generateImage } from "./src/GeminiAPI.js";');
    console.log('const result = await generateImage("一只可爱的小猫");');
    console.log('console.log("图像路径:", result.imagePath);');
    console.log('');

    console.log('// 2. 使用GEMINI 3 Pro模型');
    console.log('import { generateImage3Pro } from "./src/GeminiAPI.js";');
    console.log('const result = await generateImage3Pro("高清细节图像");');
    console.log('');

    console.log('// 3. 批量生成');
    console.log('const prompts = ["图像1", "图像2", "图像3"];');
    console.log('const results = await generateMultipleImages(prompts);');
    console.log('');

    console.log('// 4. 高级使用');
    console.log('import GeminiImageGenerator from "./src/GeminiImageGenerator.js";');
    console.log('const generator = new GeminiImageGenerator({');
    console.log('    apiKey: "your-key",');
    console.log('    outputDir: "./my-images"');
    console.log('});');
    console.log('const result = await generator.generate({');
    console.log('    prompt: "你的提示词",');
    console.log('    model: "3.0",');
    console.log('    filename: "custom-name"');
    console.log('});');
    console.log('');
}

/**
 * 显示文件信息
 */
function showFileStructure() {
    console.log('📁 GMAPI文件结构:');
    console.log('');
    console.log('GMAPI/');
    console.log('├── src/                    # 核心组件代码');
    console.log('│   ├── VectorEngineClient.js');
    console.log('│   ├── ImageAPI.js');
    console.log('│   ├── GeminiImageGenerator.js  # 主组件 ⭐');
    console.log('│   └── GeminiAPI.js             # 简化接口 ⭐');
    console.log('├── examples/');
    console.log('│   └── component-usage.js       # 使用示例');
    console.log('├── docs/                   # 详细文档');
    console.log('├── output/                 # 生成的图像');
    console.log('├── logs/                   # 日志文件');
    console.log('├── package.json            # 项目配置');
    console.log('├── README.md              # 说明文档');
    console.log('├── server-example.js        # Web服务示例');
    console.log('├── test.js                 # 快速测试');
    console.log('├── .env.example            # 环境变量模板');
    console.log('��── GE.txt                 # API配置');
    console.log('');
}

/**
 * 显示快速命令
 */
function showQuickCommands() {
    console.log('⚡ 快速命令:');
    console.log('');
    console.log('npm test                 # 运行测试');
    console.log('npm run test-advanced    # 运行高级示例');
    console.log('npm run demo            # 运行演示');
    console.log('');

    console.log('# 手动测试');
    console.log('node -e "import(\\"./src/GeminiAPI.js\\\").then(m => m.generateImage(\\"测试图像\\\").then(r => console.log(r.imagePath))"');
    console.log('');

    console.log('# 启动Web服务 (需要安装express)');
    console.log('npm install express');
    console.log('node server-example.js');
    console.log('');
}

/**
 * 主函数
 */
async function main() {
    showWelcome();

    // 检查环境
    if (!checkEnvironment()) {
        console.log('\n❌ 环境检查失败，请修复后重试');
        console.log('💡 建议: 确保所有必要文件存在且Node.js版本 >= 14.0.0');
        process.exit(1);
    }

    // 检查是否需要安装依赖
    let needsInstall = false;
    try {
        require('axios');
        require('dotenv');
    } catch (error) {
        needsInstall = true;
    }

    if (needsInstall) {
        if (!await installDependencies()) {
            console.log('\n❌ 依赖安装失败，请手动运行 npm install');
            process.exit(1);
        }
    } else {
        console.log('✅ 依赖包已安装');
    }

    // 运行测试
    const testSuccess = await runTests();

    // 显示后续信息
    showUsageExamples();
    showFileStructure();
    showQuickCommands();

    console.log('🎉 GMAPI部署完成！');
    console.log('');

    if (testSuccess) {
        console.log('✅ 所有功能正常，可以开始使用GEMINI图像生成组件');
        console.log('📖 查看上面的使用示例开始生成图像');
        console.log('📚 查看 docs/ 目录获取详细文档');
    } else {
        console.log('⚠️  部署部分成功，请检查错误信息');
        console.log('💡 建议查看 logs/ 目录中的日志文件');
    }
}

// 运行主函数
main().catch(error => {
    console.error('❌ 启动脚本出错:', error);
    process.exit(1);
});