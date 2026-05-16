/**
 * Kimi API 法律文书生成模块
 * 用于塞上法桥的法律智能体模式中的法律文书生成功能
 */

// Kimi API 配置
const KIMI_CONFIG = {
    apiKey: 'sk-RFRdcfdcZVI1KGn6hHQyNWeDdp3T1AbPtFGI1mjoBv6ckESj',
    baseURL: 'https://api.moonshot.cn/v1',
    model: 'moonshot-v1-128k', // 使用 128k 上下文模型
    maxTokens: 8000,
    temperature: 0.3 // 低温度保证严谨
};

// 法律文书系统提示词（专业版）
const LEGAL_DOCUMENT_SYSTEM_PROMPT = `你是一位资深中国执业律师，精通民商事、刑事、行政、劳动、合同、公司等领域实务。
请根据用户描述的法律问题，自动生成可直接提交法院/仲裁委/行政机关的规范法律文书。

生成要求：
1. 文书类型：自动判断或按用户指定生成（起诉状、答辩状、仲裁申请书、律师函、合同审查意见、法律意见书等）
2. 格式规范：符合中国司法机关标准格式，包含标题、当事人信息、案由、事实与理由、法律依据、诉讼请求/主张、证据清单、落款
3. 法条引用：必须引用具体法律条文（如"《中华人民共和国民法典》第XXX条"），不得虚构法条
4. 信息不足时：在相应位置标注"[待补充：XXX]"，并在文末列出需要用户补充的信息清单
5. 语言风格：严谨、专业、客观，避免口语化表达
6. 逻辑结构：事实陈述按时间线排列，法律论证采用"大前提-小前提-结论"三段论

输出格式：
- 直接输出完整文书正文，不要添加任何解释说明
- 如果案情信息不足以填写某些字段，标注"[待补充]"并在文末给出补充建议
- 确保引用的法律条文真实存在`;

/**
 * 调用 Kimi API 生成法律文书（流式输出）
 * @param {string} userQuestion - 用户案情描述
 * @param {HTMLElement} messageElement - 消息显示元素
 * @param {string} docType - 指定文书类型（可选）
 * @param {string} extraInfo - 补充信息（可选）
 * @returns {Promise<string>} 生成的法律文书内容
 */
async function generateLegalDocumentStream(userQuestion, messageElement, renderContext, requestMode, docType = '', extraInfo = '') {
    const chunks = [];

    // 用于更新消息内容的辅助函数
    const pushChunk = (txt) => {
        chunks.push(txt);
        if (messageElement && typeof updateMessageContent === 'function') {
            updateMessageContent(messageElement, chunks.join(''), renderContext);
        }
    };

    // 构建用户提示词
    const userContent = `
请根据以下信息生成法律文书：

【案情描述】
${userQuestion}

${docType ? `【指定文书类型】${docType}` : '【文书类型】请根据案情自动判断最合适的文书类型'}
${extraInfo ? `【补充信息】${extraInfo}` : ''}

要求：
1. 直接输出完整文书正文，不要添加任何解释说明
2. 如果案情信息不足以填写某些字段，标注"[待补充]"并在文末给出补充建议
3. 确保引用的法律条文真实存在
`;

    try {
        pushChunk('【塞上法桥 · 法律文书生成系统】\n\n');
        pushChunk('📝 正在为您生成专业法律文书...\n');
        pushChunk(`📋 案情分析：${userQuestion.substring(0, 50)}${userQuestion.length > 50 ? '...' : ''}\n`);
        if (docType) {
            pushChunk(`📄 文书类型：${docType}\n`);
        }
        pushChunk('\n⏳ 正在调用 Kimi 2.6 模型生成文书...\n\n');
        pushChunk('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');

        // 调用 Kimi API（流式输出）
        const response = await fetch(`${KIMI_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: KIMI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: LEGAL_DOCUMENT_SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: userContent
                    }
                ],
                temperature: KIMI_CONFIG.temperature,
                max_tokens: KIMI_CONFIG.maxTokens,
                stream: true // 开启流式输出
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Kimi API 调用失败: ${response.status} ${errorText}`);
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
                    console.warn('解析 Kimi API 响应失败:', e);
                }
            }
        }

        // 添加文书生成完成提示
        pushChunk('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n');
        pushChunk('✅ 【文书生成完成】\n\n');
        pushChunk('⚠️ 【重要提示】\n');
        pushChunk('1. 本文书由 AI 自动生成，仅供参考，不构成正式法律意见\n');
        pushChunk('2. 使用前请务必核对所有信息的准确性和完整性\n');
        pushChunk('3. 建议提交前由专业律师审核并根据实际情况调整\n');
        pushChunk('4. 标注"[待补充]"的部分需要您补充具体信息\n');
        pushChunk('5. 请核实所有引用的法律条文是否为现行有效版本\n\n');
        pushChunk('💡 如需进一步修改或有其他问题，请继续提问。\n');

        return chunks.join('');

    } catch (error) {
        console.error('Kimi API 调用失败:', error);
        const errMsg = String(error?.message || '未知错误');
        let hint = '';

        if (errMsg.includes('401') || errMsg.includes('403')) {
            hint = '\n可能是 API Key 无效或权限不足，请检查 Kimi API 密钥。';
        } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
            hint = '\n可能是网络连接问题或跨域限制，请检查网络连接。';
        } else if (errMsg.includes('429')) {
            hint = '\n请求过于频繁，请稍后重试。';
        } else if (errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503')) {
            hint = '\nKimi 服务暂时不可用，请稍后重试。';
        }

        pushChunk(`\n\n❌ 法律文书生成失败：${errMsg}${hint}\n\n`);
        pushChunk('💡 建议：\n');
        pushChunk('1. 检查网络连接是否正常\n');
        pushChunk('2. 确认 API Key 是否有效\n');
        pushChunk('3. 稍后重试或联系技术支持\n');

        return chunks.join('');
    }
}

/**
 * 非流式版本：一次性生成法律文书
 * @param {string} userQuestion - 用户案情描述
 * @param {string} docType - 指定文书类型（可选）
 * @param {string} extraInfo - 补充信息（可选）
 * @returns {Promise<string>} 生成的法律文书内容
 */
async function generateLegalDocument(userQuestion, docType = '', extraInfo = '') {
    const userContent = `
请根据以下信息生成法律文书：

【案情描述】
${userQuestion}

${docType ? `【指定文书类型】${docType}` : '【文书类型】请根据案情自动判断最合适的文书类型'}
${extraInfo ? `【补充信息】${extraInfo}` : ''}

要求：
1. 直接输出完整文书正文，不要添加任何解释说明
2. 如果案情信息不足以填写某些字段，标注"[待补充]"并在文末给出补充建议
3. 确保引用的法律条文真实存在
`;

    try {
        const response = await fetch(`${KIMI_CONFIG.baseURL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${KIMI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: KIMI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: LEGAL_DOCUMENT_SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: userContent
                    }
                ],
                temperature: KIMI_CONFIG.temperature,
                max_tokens: KIMI_CONFIG.maxTokens,
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Kimi API 调用失败: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        return data.choices?.[0]?.message?.content || '生成失败，请重试';

    } catch (error) {
        console.error('Kimi API 调用失败:', error);
        throw new Error(error.message || '法律文书生成失败');
    }
}

// 导出函数供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        generateLegalDocumentStream,
        generateLegalDocument,
        KIMI_CONFIG
    };
}
