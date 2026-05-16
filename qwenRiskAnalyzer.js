/**
 * 塞上法桥 - 通义千问法律风险分析器
 * 使用 qwen3.6-plus 模型进行流式风险分析
 */

// 通义千问 API 配置
const QWEN_CONFIG = {
    apiKey: 'sk-0c99c07f419a46f2855cf908a9091e63',  // 建议改为从环境变量读取
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen3.6-plus',
    temperature: 0.3,  // 降低随机性，保证法律分析严谨
    maxTokens: 2048
};

// 法律风险分析系统提示词
const RISK_ANALYSIS_SYSTEM_PROMPT = `你是塞上法桥的资深法律风险分析专家。请根据用户描述的情况，深入分析其中可能涉及的法律风险。

你的分析应包括以下结构化内容：

## 一、法律风险识别
- 明确指出可能违反的法律条文（注明具体法条编号，如《民法典》第XXX条）
- 识别涉及的法律关系类型（合同关系、侵权关系、劳动关系等）
- 分析行为的法律性质

## 二、法律后果分析
- **民事责任**：可能承担的赔偿、违约金、返还等责任
- **行政责任**：可能面临的行政处罚、罚款等
- **刑事责任**：是否可能触犯刑法（如有）

## 三、风险等级评估
- 🔴 高风险：可能导致重大经济损失或刑事责任
- 🟡 中风险：可能产生一定经济损失或行政处罚
- 🟢 低风险：风险可控，影响较小

## 四、防范措施与应对策略
- 立即应采取的紧急措施
- 中长期的风险防范建议
- 证据保全和固定的建议
- 诉讼时效提醒（如适用）

## 五、专业建议
- 是否需要立即咨询律师
- 建议的解决途径（协商、调解、仲裁、诉讼）

请用中文回答，语言专业但易懂，结构清晰，使用 Markdown 格式。重点突出风险点，给出可操作的建议。`;

/**
 * 调用通义千问进行流式风险分析
 * @param {string} userQuestion - 用户的法律咨询问题
 * @param {HTMLElement} messageElement - 消息显示元素
 * @returns {Promise<string>} 完整的风险分析内容
 */
async function analyzeRiskWithQwen(userQuestion, messageElement, renderContext, requestMode) {
    const chunks = [];

    // 用于更新消息内容的辅助函数
    const pushChunk = (text) => {
        chunks.push(text);
        updateMessageContent(messageElement, chunks.join(''), renderContext);
    };

    try {
        // 显示初始提示
        pushChunk('【法律风险分析中】\n正在使用通义千问 qwen3.6-plus 为您深度分析法律风险...\n\n');

        // 构建请求
        const response = await fetch(`${QWEN_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${QWEN_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: QWEN_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: RISK_ANALYSIS_SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: `请针对以下情况进行全面的法律风险分析：\n\n【用户情况】\n${userQuestion}\n\n请提供详细、专业的风险分析和应对建议。`
                    }
                ],
                temperature: QWEN_CONFIG.temperature,
                max_tokens: QWEN_CONFIG.maxTokens,
                stream: true  // 启用流式输出
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`通义千问API调用失败: ${response.status} ${errorText}`);
        }

        // 处理流式响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim() || !line.startsWith('data: ')) continue;

                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) {
                        pushChunk(delta);
                    }
                } catch (e) {
                    console.warn('解析通义千问API响应失败:', e);
                }
            }
        }

        // 添加免责声明
        if (!chunks.join('').includes('专业建议')) {
            pushChunk('\n\n---\n\n⚠️ **免责声明**：以上风险分析仅供参考，不构成正式法律意见。具体情况请咨询专业律师。');
        }

        return chunks.join('');

    } catch (error) {
        console.error('通义千问API调用失败:', error);
        const errMsg = String(error?.message || '未知错误');
        let hint = '';

        if (errMsg.includes('401') || errMsg.includes('403')) {
            hint = '\n可能是 API Key 无效或权限不足，请检查通义千问API密钥。';
        } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
            hint = '\n可能是网络连接问题或跨域限制，请检查网络连接。';
        } else if (errMsg.includes('429')) {
            hint = '\n请求过于频繁，请稍后再试。';
        }

        pushChunk(`\n\n❌ 风险分析失败：${errMsg}${hint}`);
        return chunks.join('');
    }
}

/**
 * 快速风险提示（简化版）
 * @param {string} userQuestion - 用户的法律咨询问题
 * @param {HTMLElement} messageElement - 消息显示元素
 * @returns {Promise<string>} 简化的风险提示内容
 */
async function quickRiskWarning(userQuestion, messageElement) {
    const chunks = [];

    const pushChunk = (text) => {
        chunks.push(text);
        updateMessageContent(messageElement, chunks.join(''));
    };

    const quickPrompt = `你是塞上法桥的法律风险预警助手。请简明扼要地指出用户情况中的主要法律风险点。

输出格式：
⚠️ **主要风险**
- 风险点1
- 风险点2
- 风险点3

💡 **核心建议**
- 建议1
- 建议2

请保持简洁，每个风险点和建议不超过30字。`;

    try {
        pushChunk('【快速风险扫描】\n正在识别主要风险点...\n\n');

        const response = await fetch(`${QWEN_CONFIG.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${QWEN_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: QWEN_CONFIG.model,
                messages: [
                    { role: 'system', content: quickPrompt },
                    { role: 'user', content: userQuestion }
                ],
                temperature: 0.3,
                max_tokens: 800,
                stream: true
            })
        });

        if (!response.ok) {
            throw new Error(`API调用失败: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                if (!line.trim() || !line.startsWith('data: ')) continue;
                const data = line.slice(6).trim();
                if (data === '[DONE]') continue;

                try {
                    const json = JSON.parse(data);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) pushChunk(delta);
                } catch (e) {
                    console.warn('解析响应失败:', e);
                }
            }
        }

        return chunks.join('');

    } catch (error) {
        console.error('快速风险扫描失败:', error);
        pushChunk(`\n\n❌ 风险扫描失败：${error.message}`);
        return chunks.join('');
    }
}

// 导出函数供外部使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        analyzeRiskWithQwen,
        quickRiskWarning,
        QWEN_CONFIG
    };
}
