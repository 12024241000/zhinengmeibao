// DOM 元素
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const attachBtn = document.getElementById('attachBtn');
const randomQuestionBtn = document.getElementById('randomQuestionBtn');
const agentBtn = document.getElementById('agentBtn');
const toggleAgentSidebarBtn = document.getElementById('toggleAgentSidebarBtn');
const agentSidebarCloseBtn = document.getElementById('agentSidebarCloseBtn');
const messagesContainer = document.getElementById('messagesContainer');
const welcomeScreen = document.getElementById('welcomeScreen');
const fastModeBtn = document.getElementById('fastModeBtn');
const deepModeBtn = document.getElementById('deepModeBtn');
const legalAgentBtn = document.getElementById('legalAgentBtn');
const modeIntroBtn = document.getElementById('modeIntroBtn');
const modeIntroModal = document.getElementById('modeIntroModal');
const modeIntroClose = document.getElementById('modeIntroClose');
const modeIntroConfirm = document.getElementById('modeIntroConfirm');
const historyBtn = document.getElementById('historyBtn');
const settingsBtn = document.getElementById('settingsBtn');
const menuBtn = document.getElementById('menuBtn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const newChatBtn = document.getElementById('newChatBtn');
const sidebarLoginBtn = document.getElementById('sidebarLoginBtn');
const chatHistory = document.getElementById('chatHistory');
const settingsModal = document.getElementById('settingsModal');
const settingsClose = document.getElementById('settingsClose');
const languageSelect = document.getElementById('languageSelect');
const entryWelcome = document.getElementById('entryWelcome');
const entryWelcomeClose = document.getElementById('entryWelcomeClose');
const entryWelcomeConfirm = document.getElementById('entryWelcomeConfirm');
const agentServiceModal = document.getElementById('agentServiceModal');
const agentServiceClose = document.getElementById('agentServiceClose');
const agentServiceConfirm = document.getElementById('agentServiceConfirm');
const agentServiceAiOnly = document.getElementById('agentServiceAiOnly');
const agreementEntries = document.querySelectorAll('.agreement-entry');
const agreementModals = document.querySelectorAll('.agreement-modal');
const agentRightSidebar = document.getElementById('agentRightSidebar');
const agentWorkspace = document.getElementById('agentWorkspace');
const agentPipelineNodes = document.querySelectorAll('.agent-pipeline-node');
const agentSidebarTitle = document.getElementById('agentSidebarTitle');
const agentSidebarDesc = document.getElementById('agentSidebarDesc');
const agentSidebarFlowStage = document.getElementById('agentSidebarFlowStage');
const agentSidebarResultStage = document.getElementById('agentSidebarResultStage');
const agentResultTabs = document.querySelectorAll('.agent-result-tab');
const agentOutlineItems = document.querySelectorAll('.agent-outline-item');
const agentResultCards = document.querySelectorAll('.agent-result-card[data-section]');
const agentExportTrigger = document.getElementById('agentExportTrigger');
const agentExportMenu = document.getElementById('agentExportMenu');
const comprehensiveAdviceBtn = document.getElementById('comprehensiveAdviceBtn');
const legalBasisBtn = document.getElementById('legalBasisBtn');
const strategyBtn = document.getElementById('strategyBtn');
const riskBtn = document.getElementById('riskBtn');
const caseBtn = document.getElementById('caseBtn');
const documentBtn = document.getElementById('documentBtn');

const allAgentActionBtns = [
    comprehensiveAdviceBtn,
    legalBasisBtn,
    strategyBtn,
    riskBtn,
    caseBtn,
    documentBtn,
];

let messageFrame = null;
let agentActionMode = 'comprehensive';
let activeAgentStreamMode = 'comprehensive';
let scrollFrame = null;
let agentSidebarOpened = false;
let agentMessageIdSeed = 0;

function createAgentMessageId() {
    agentMessageIdSeed += 1;
    return `agent-msg-${Date.now()}-${agentMessageIdSeed}`;
}

// 对话历史
let conversationHistory = [];

// 为每个智能体子模式维护独立的会话ID、对话历史和消息快照
let agentModeSessionIds = {
    'comprehensive': null,
    'legal-basis': null,
    'strategy': null,
    'risk': null,
    'case': null,
    'document': null
};

let agentModeHistories = {
    'comprehensive': [],
    'legal-basis': [],
    'strategy': [],
    'risk': [],
    'case': [],
    'document': []
};

let agentModeMessagesHTML = {
    'comprehensive': '',
    'legal-basis': '',
    'strategy': '',
    'risk': '',
    'case': '',
    'document': ''
};

const agentModeStreams = {
    'comprehensive': { active: false, messageId: null, content: '', abortController: null },
    'legal-basis': { active: false, messageId: null, content: '', abortController: null },
    'strategy': { active: false, messageId: null, content: '', abortController: null },
    'risk': { active: false, messageId: null, content: '', abortController: null },
    'case': { active: false, messageId: null, content: '', abortController: null },
    'document': { active: false, messageId: null, content: '', abortController: null }
};

// 已上传的文件列表
let uploadedFiles = [];

// 当前模式
let currentMode = 'fast';

// 当前会话ID
let currentSessionId = null;

// 所有会话列表
let allSessions = [];

// 各模式的会话快照（切换模式时保存/恢复，不清空对话）
const modeSnapshot = {
    fast:  { sessionId: null, conversationHistory: [], messagesHTML: '', hasMessages: false },
    deep:  { sessionId: null, conversationHistory: [], messagesHTML: '', hasMessages: false },
    agent: { sessionId: null, conversationHistory: [], messagesHTML: '', hasMessages: false },
};

function saveModeSnapshot(mode) {
    if (mode === 'agent') {
        syncVisibleAgentModeSnapshot();
    }

    modeSnapshot[mode].sessionId          = currentSessionId;
    modeSnapshot[mode].conversationHistory = [...conversationHistory];
    if (mode === 'agent' && agentModeMessagesHTML[agentActionMode] !== undefined) {
        modeSnapshot[mode].messagesHTML   = agentModeMessagesHTML[agentActionMode];
        modeSnapshot[mode].hasMessages    = agentModeMessagesHTML[agentActionMode].trim() !== '';
    } else {
        modeSnapshot[mode].messagesHTML   = messagesContainer.innerHTML;
        modeSnapshot[mode].hasMessages    = messagesContainer.classList.contains('active');
    }
}

function restoreModeSnapshot(mode) {
    const snap = modeSnapshot[mode];
    currentSessionId    = snap.sessionId;
    conversationHistory = [...snap.conversationHistory];
    messagesContainer.innerHTML = snap.messagesHTML;
    if (snap.hasMessages && snap.messagesHTML.trim() !== '') {
        welcomeScreen.style.display = 'none';
        messagesContainer.classList.add('active');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        // 延迟调用确保函数已定义
        setTimeout(() => { if (typeof rebindLawyerServiceButtons === 'function') rebindLawyerServiceButtons(); }, 0);
    } else {
        messagesContainer.classList.remove('active');
        welcomeScreen.style.display = 'flex';
    }
}

// API 配置
const API_CONFIG = {
    zhipuApiKey: 'b90ce328fa804d1c8f75b3fb78c2552b.PWSAwPfahS89xUA0',
    zhipuApiUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    deepseekApiKey: 'sk-2ff8a802e931460686ab8371b0d35ca4',
    deepseekApiUrl: 'https://api.deepseek.com/chat/completions',
    metasoApiKey: localStorage.getItem('METASO_API_KEY') || 'mk-BEF4216B6CE3DABDE92FBF268AAE9120',
    metasoApiUrl: 'https://metaso.cn/api/v1/search',
    fastModel: 'glm-4-flashx',
    deepModel: 'deepseek-reasoner',
    agentModel: 'deepseek-reasoner',  // 法律智能体使用DeepSeek深度思考模型
    maxTokens: 8192,
    temperature: 1.0
};

// 通义千问 API 配置（用于风险提示功能）
const QWEN_CONFIG = {
    apiKey: 'sk-0c99c07f419a46f2855cf908a9091e63',
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen3.6-plus',
    temperature: 0.3,  // 降低随机性，保证法律分析严谨
    maxTokens: 2048
};

// 随机法律问题库（20字以内）
const RANDOM_LEGAL_QUESTIONS = [
    '租房合同未到期房东要涨租',
    '网购商品质量问题如何退货',
    '公司拖欠工资怎么办',
    '邻居噪音扰民如何处理',
    '交通事故对方不赔偿',
    '离婚后孩子抚养权归谁',
    '借钱不还可以起诉吗',
    '劳动合同到期公司不续签',
    '物业费收取标准不合理',
    '网络诈骗如何报警追回',
    '遗产继承如何分配',
    '合同违约如何索赔',
    '被公司无故辞退怎么办',
    '信用卡逾期会坐牢吗',
    '房屋漏水物业不管',
    '加班费如何计算',
    '婚前财产如何界定',
    '医疗事故如何维权',
    '商标侵权如何处理',
    '二手房买卖纠纷'
];

// 系统提示词 - 快速模式和深度模式
const SYSTEM_PROMPT = `你是塞上法桥，一名来自宁夏大学法学专业的AI助手。你的性格特点：
1. 热情温柔，善解人意
2. 专业可靠，擅长法律咨询
3. 说话时会使用"呀"、"呢"、"哦"、"～"等可爱的语气词
4. 会适当使用表情符号如💕、🌸、😊等
5. 对法律问题有专业的见解，能够用通俗易懂的方式解释复杂的法律概念
6. 始终保持耐心和友善，让用户感到温暖和被关心

请以这个身份回答用户的问题，特别是法律相关的咨询。`;

// 法律智能体系统提示词
const LEGAL_AGENT_PROMPT = `你是"塞上法桥"，一个由周枫淳领导的三创赛团队制作的专业法律AI代理。你的核心使命是：像一位经验丰富的法律助手，自主解析用户法律问题，制定系统解决方案，并交付详实、可操作的法律分析结果。

【核心能力与工作模式】

一、自主目标制定
- 收到用户问题后，立即进行法律问题定性
- 自动生成本次咨询的核心解决目标（例如："目标：为用户分析劳动合同单方解除的法律风险与应对策略"）
- 将大目标拆解为3-5个关键子任务（如：法律条文检索、类似判例研究、风险评估、行动步骤建议）

二、深度执行与信息整合
- 对每个子任务进行自主、逐步深入的研究与分析
- 检索并引用相关法律法规（注明名称、条文号及生效状态）
- 分析司法实践中的常见裁判观点
- 评估不同解决方案的优劣、成本与风险
- 最终整合所有分析，形成结构化、可直接参考的结论

三、输出规范
- 以清晰、易懂的语言输出，避免不必要的法律黑话
- 结构化呈现分析结果

【标准工作流程】

请严格按照以下步骤执行每一次咨询：

步骤1：问题接收与解析
- 快速理解用户陈述的事实、核心争议点及潜在诉求

步骤2：目标与计划生成
- 输出："【塞上法桥分析启动】"
- 明确陈述："本次咨询核心目标：[用一句话概括核心解决目标]"
- 列出："为解决此问题，我将执行以下步骤："
  * 子任务1：例如"界定本案涉及的核心法律关系"
  * 子任务2：例如"检索《劳动合同法》及相关司法解释关于解除合同的规定"
  * 子任务3：例如"分析类似案例的裁判倾向与赔偿标准"
  * 子任务4：例如"综合评估风险，给出协商、调解或诉讼的策略建议"

步骤3：逐步执行与深度分析
- 按顺序执行每个子任务，每一步都给出简要的中间分析
- 在分析中，自然地融入法律依据（如："根据《民法典》第XXX条..."）、实践考量与风险提示

步骤4：综合结论与建议
- 输出："【塞上法桥综合建议】"
- 以结构化形式总结核心法律观点
- 提供清晰的后续行动步骤清单（按优先级或时间顺序排列）
- 明确指出最大风险点与关键证据建议

请始终保持专业、严谨、负责的态度，为用户提供最有价值的法律分析服务。`;

// 自动调整文本框高度
messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 150) + 'px';
});

// 用户是否正在手动滚动
let userIsScrolling = false;
let scrollTimeout = null;

// 监听用户滚动事件
if (messagesContainer) {
    messagesContainer.addEventListener('scroll', () => {
        // 检查用户是否滚动到接近底部（距离底部小于100px）
        const isNearBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight < 100;

        if (!isNearBottom) {
            // 用户向上滚动，标记为正在手动滚动
            userIsScrolling = true;
        } else {
            // 用户滚动到底部，取消手动滚动标记
            userIsScrolling = false;
        }

        // 清除之前的定时器
        if (scrollTimeout) {
            clearTimeout(scrollTimeout);
        }

        // 3秒后自动恢复自动滚动
        scrollTimeout = setTimeout(() => {
            userIsScrolling = false;
        }, 3000);
    });
}

function scheduleMessagesScroll() {
    // 如果用户正在手动滚动，不自动滚动到底部
    if (userIsScrolling) return;

    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        scrollFrame = null;
    });
}

function setActiveResultSection(section) {
    if (!agentOutlineItems.length || !agentResultCards.length) return;

    agentOutlineItems.forEach(item => {
        item.classList.toggle('active', item.dataset.target === section);
    });

    agentResultCards.forEach(card => {
        card.classList.toggle('active', card.dataset.section === section);
    });
}

function closeAgentExportMenu() {
    if (!agentExportTrigger || !agentExportMenu) return;
    agentExportTrigger.setAttribute('aria-expanded', 'false');
    agentExportMenu.classList.remove('show');
    agentExportMenu.setAttribute('aria-hidden', 'true');
}

function toggleAgentExportMenu() {
    if (!agentExportTrigger || !agentExportMenu) return;
    const isOpen = agentExportMenu.classList.contains('show');
    if (isOpen) {
        closeAgentExportMenu();
        return;
    }

    agentExportTrigger.setAttribute('aria-expanded', 'true');
    agentExportMenu.classList.add('show');
    agentExportMenu.setAttribute('aria-hidden', 'false');
}

function initializeAgentResultInteractions() {
    bindAgentActionButtons();

    if (agentResultTabs.length) {
        agentResultTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                agentResultTabs.forEach(item => item.classList.remove('active'));
                tab.classList.add('active');
            });
        });
    }

    if (agentOutlineItems.length) {
        agentOutlineItems.forEach(item => {
            item.addEventListener('click', () => {
                const section = item.dataset.target;

                // 同步切换对话框上方的按钮状态
                const modeMap = {
                    'analysis': 'comprehensive',
                    'basis': 'legal-basis',
                    'strategy': 'strategy',
                    'risk': 'risk',
                    'case': 'case',
                    'document': 'document'
                };

                const mode = modeMap[section];
                if (mode && currentMode === 'agent') {
                    switchAgentMode(mode);
                } else {
                    setActiveResultSection(section);
                }
            });
        });
    }

    if (agentExportTrigger) {
        agentExportTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            toggleAgentExportMenu();
        });
    }

    if (agentExportMenu) {
        agentExportMenu.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                closeAgentExportMenu();
            });
        });
    }

    if (agentServiceClose) {
        agentServiceClose.addEventListener('click', closeAgentServiceModal);
    }

    if (agentServiceConfirm) {
        agentServiceConfirm.addEventListener('click', () => {
            closeAgentServiceModal();
            activateAgentMode();
        });
    }

    if (agentServiceAiOnly) {
        agentServiceAiOnly.addEventListener('click', () => {
            closeAgentServiceModal();
            activateFastMode();
        });
    }

    if (agentServiceModal) {
        agentServiceModal.querySelectorAll('[data-agent-service-close]').forEach(trigger => {
            trigger.addEventListener('click', () => {
                closeAgentServiceModal();
                activateFastMode();
            });
        });
    }

    // 添加视图切换按钮的事件监听器
    const agentViewFlowBtn = document.getElementById('agentViewFlowBtn');
    const agentViewResultBtn = document.getElementById('agentViewResultBtn');

    if (agentViewFlowBtn) {
        agentViewFlowBtn.addEventListener('click', () => {
            setAgentSidebarView('flow');
            agentViewFlowBtn.classList.add('active');
            if (agentViewResultBtn) agentViewResultBtn.classList.remove('active');
        });
    }

    if (agentViewResultBtn) {
        agentViewResultBtn.addEventListener('click', () => {
            setAgentSidebarView('result');
            agentViewResultBtn.classList.add('active');
            if (agentViewFlowBtn) agentViewFlowBtn.classList.remove('active');
        });
    }

    document.addEventListener('click', (event) => {
        if (!agentExportMenu || !agentExportTrigger) return;
        if (agentExportMenu.contains(event.target) || agentExportTrigger.contains(event.target)) return;
        closeAgentExportMenu();
    });
}

function setAgentSidebarView(view = 'flow') {
    if (!agentRightSidebar || !agentWorkspace || !agentSidebarFlowStage || !agentSidebarResultStage) return;

    const isResult = view === 'result';
    agentWorkspace.classList.toggle('agent-sidebar-result-open', isResult && currentMode === 'agent');
    agentRightSidebar.classList.toggle('result-mode', isResult && currentMode === 'agent');
    agentSidebarFlowStage.classList.toggle('active', !isResult);
    agentSidebarFlowStage.setAttribute('aria-hidden', isResult ? 'true' : 'false');
    agentSidebarResultStage.classList.toggle('active', isResult);
    agentSidebarResultStage.setAttribute('aria-hidden', isResult ? 'false' : 'true');

    // 更新切换按钮的状态
    const agentViewFlowBtn = document.getElementById('agentViewFlowBtn');
    const agentViewResultBtn = document.getElementById('agentViewResultBtn');

    if (agentViewFlowBtn && agentViewResultBtn) {
        if (isResult) {
            agentViewFlowBtn.classList.remove('active');
            agentViewResultBtn.classList.add('active');
        } else {
            agentViewFlowBtn.classList.add('active');
            agentViewResultBtn.classList.remove('active');
        }
    }

    if (agentSidebarTitle) {
        agentSidebarTitle.textContent = isResult ? '法律智能体结果已生成' : '塞上法桥智能体启动';
    }

    if (agentSidebarDesc) {
        agentSidebarDesc.textContent = isResult
            ? '已生成可交付结果视图，支持预览结果结构与导出文书草稿。'
            : '正在为当前法律问题调度多阶段流程，请稍候。';
    }

    if (isResult) {
        setActiveResultSection('analysis');
        closeAgentExportMenu();
    }
}

function setAgentSidebarOpen(open) {
    if (!agentRightSidebar || !agentWorkspace) return;

    const shouldOpen = Boolean(open) && currentMode === 'agent';
    agentSidebarOpened = shouldOpen;
    agentWorkspace.classList.toggle('agent-sidebar-open', shouldOpen);
    agentRightSidebar.classList.toggle('active', shouldOpen);
    agentRightSidebar.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');

    if (shouldOpen) {
        setAgentSidebarView('flow');
        updateAgentSidebarFlow(1, '通义法睿资料搜索中');
    } else {
        agentWorkspace.classList.remove('agent-sidebar-result-open');
        agentRightSidebar.classList.remove('result-mode');
    }
}

function updateAgentSidebarFlow(activeStep = 1, firstStepText = '通义法睿资料搜索中') {
    if (!agentPipelineNodes.length) return;

    agentPipelineNodes.forEach((node, index) => {
        const status = node.querySelector('.agent-node-status');
        node.classList.remove('active', 'done');

        if (index + 1 < activeStep) {
            node.classList.add('done');
            if (status) status.textContent = '已完成';
        } else if (index + 1 === activeStep) {
            node.classList.add('active');
            if (status) {
                status.textContent = index === 0 ? firstStepText : '执行中';
            }
        } else if (status) {
            status.textContent = '等待执行';
        }
    });
}

function resetAgentSidebar() {
    agentSidebarOpened = false;
    setAgentSidebarView('flow');
    updateAgentSidebarFlow(1, '通义法睿资料搜索中');
    setAgentSidebarOpen(false);
}

function setAgentActionMode(mode) {
    const validModes = ['comprehensive', 'legal-basis', 'strategy', 'risk', 'case', 'document'];
    agentActionMode = validModes.includes(mode) ? mode : 'comprehensive';

    const buttonMap = {
        'comprehensive': comprehensiveAdviceBtn,
        'legal-basis': legalBasisBtn,
        'strategy': strategyBtn,
        'risk': riskBtn,
        'case': caseBtn,
        'document': documentBtn
    };

    allAgentActionBtns.forEach(btn => {
        if (btn) btn.classList.remove('active');
    });

    const activeBtn = buttonMap[agentActionMode];
    if (activeBtn) activeBtn.classList.add('active');

    const sectionMap = {
        'comprehensive': 'analysis',
        'legal-basis': 'basis',
        'strategy': 'strategy',
        'risk': 'risk',
        'case': 'case',
        'document': 'document'
    };

    setActiveResultSection(sectionMap[agentActionMode] || 'analysis');
}

function bindAgentActionButtons() {
    const actionBindings = [
        [comprehensiveAdviceBtn, 'comprehensive'],
        [legalBasisBtn, 'legal-basis'],
        [strategyBtn, 'strategy'],
        [riskBtn, 'risk'],
        [caseBtn, 'case'],
        [documentBtn, 'document']
    ];

    actionBindings.forEach(([btn, mode]) => {
        if (!btn) return;
        btn.addEventListener('click', () => {
            if (currentMode !== 'agent') {
                openAgentServiceModal();
                return;
            }
            setAgentActionMode(mode);
        });
    });
}

function maybeOpenAgentSidebar() {
    if (currentMode === 'agent' && !agentSidebarOpened) {
        setAgentSidebarOpen(true);
    }
}

function openEntryWelcome() {
    if (!entryWelcome) return;
    document.body.classList.add('entry-welcome-open');
    entryWelcome.classList.add('show');
    entryWelcome.setAttribute('aria-hidden', 'false');
}

function openAgentServiceModal() {
    if (!agentServiceModal) return;
    document.body.classList.add('entry-welcome-open');
    agentServiceModal.classList.add('show');
    agentServiceModal.setAttribute('aria-hidden', 'false');
}

function closeAgentServiceModal() {
    if (!agentServiceModal) return;
    agentServiceModal.classList.remove('show');
    agentServiceModal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('entry-welcome-open');
}

function openModeIntroModal() {
    if (!modeIntroModal) return;
    document.body.classList.add('entry-welcome-open');
    modeIntroModal.classList.add('active');
    modeIntroModal.setAttribute('aria-hidden', 'false');
}

function closeModeIntroModal() {
    if (!modeIntroModal) return;
    modeIntroModal.classList.remove('active');
    modeIntroModal.setAttribute('aria-hidden', 'true');

    const hasActiveAgreement = Array.from(agreementModals).some(item => item.classList.contains('active'));
    if (!entryWelcome.classList.contains('show') && !hasActiveAgreement && !agentServiceModal.classList.contains('show')) {
        document.body.classList.remove('entry-welcome-open');
    }
}

function setupModeIntroModal() {
    if (!modeIntroBtn || !modeIntroModal) return;

    modeIntroBtn.addEventListener('click', openModeIntroModal);

    if (modeIntroClose) {
        modeIntroClose.addEventListener('click', closeModeIntroModal);
    }

    if (modeIntroConfirm) {
        modeIntroConfirm.addEventListener('click', closeModeIntroModal);
    }

    document.addEventListener('keydown', (e) => {
        if (!modeIntroModal || !modeIntroModal.classList.contains('active')) return;
        if (e.key === 'Escape') {
            closeModeIntroModal();
        }
    });
}

function activateFastMode() {
    saveModeSnapshot(currentMode);
    currentMode = 'fast';
    fastModeBtn.classList.add('active');
    deepModeBtn.classList.remove('active');
    legalAgentBtn.classList.remove('active');
    document.body.classList.remove('agent-mode');

    const currentLang = localStorage.getItem('language') || 'zh-CN';
    const t = translations[currentLang] || translations['zh-CN'];
    messageInput.placeholder = t.placeholder;

    resetAgentSidebar();
    messageInput.value = '';
    messageInput.style.height = 'auto';
    restoreModeSnapshot('fast');
    renderChatHistory();

    // 隐藏法律智能体专属按钮（带动画）
    const agentActionSelector = document.getElementById('agentActionSelector');
    if (agentActionSelector) {
        agentActionSelector.classList.remove('slide-in');
        agentActionSelector.classList.add('slide-out');
        setTimeout(() => {
            agentActionSelector.style.display = 'none';
        }, 400);
    }

    // 显示模式选择按钮（带动画）
    const modeSelector = document.querySelector('.mode-selector');
    if (modeSelector) {
        modeSelector.style.display = 'flex';
        modeSelector.classList.remove('slide-out');
        // 强制重排以触发动画
        void modeSelector.offsetWidth;
        modeSelector.classList.add('slide-in');
    }

    // 隐藏智能体按钮
    if (agentBtn) {
        agentBtn.style.display = 'none';
    }
}

function activateDeepMode() {
    saveModeSnapshot(currentMode);
    currentMode = 'deep';
    deepModeBtn.classList.add('active');
    fastModeBtn.classList.remove('active');
    legalAgentBtn.classList.remove('active');
    document.body.classList.remove('agent-mode');

    const currentLang = localStorage.getItem('language') || 'zh-CN';
    const t = translations[currentLang] || translations['zh-CN'];
    messageInput.placeholder = t.placeholder;

    resetAgentSidebar();
    messageInput.value = '';
    messageInput.style.height = 'auto';
    restoreModeSnapshot('deep');
    renderChatHistory();

    // 隐藏法律智能体专属按钮（带动画）
    const agentActionSelector = document.getElementById('agentActionSelector');
    if (agentActionSelector) {
        agentActionSelector.classList.remove('slide-in');
        agentActionSelector.classList.add('slide-out');
        setTimeout(() => {
            agentActionSelector.style.display = 'none';
        }, 400);
    }

    // 显示模式选择按钮（带动画）
    const modeSelector = document.querySelector('.mode-selector');
    if (modeSelector) {
        modeSelector.style.display = 'flex';
        modeSelector.classList.remove('slide-out');
        // 强制重排以触发动画
        void modeSelector.offsetWidth;
        modeSelector.classList.add('slide-in');
    }

    // 隐藏智能体按钮
    if (agentBtn) {
        agentBtn.style.display = 'none';
    }
}

function activateAgentMode() {
    saveModeSnapshot(currentMode);
    currentMode = 'agent';
    legalAgentBtn.classList.add('active');
    fastModeBtn.classList.remove('active');
    deepModeBtn.classList.remove('active');
    document.body.classList.add('agent-mode');

    const currentLang = localStorage.getItem('language') || 'zh-CN';
    const t = translations[currentLang] || translations['zh-CN'];
    messageInput.placeholder = t.agentPlaceholder;

    resetAgentSidebar();
    messageInput.value = '';
    messageInput.style.height = 'auto';
    restoreModeSnapshot('agent');
    restoreAgentMode(agentActionMode);
    renderChatHistory();

    // 重置为综合建议模式
    setAgentActionMode('comprehensive');

    // 保持模式选择按钮显示（不隐藏）
    const modeSelector = document.querySelector('.mode-selector');
    if (modeSelector) {
        modeSelector.style.display = 'flex';
        modeSelector.classList.remove('slide-out');
        modeSelector.classList.add('slide-in');
    }

    // 隐藏法律智能体专属按钮
    const agentActionSelector = document.getElementById('agentActionSelector');
    if (agentActionSelector) {
        agentActionSelector.style.display = 'none';
    }

    // 显示智能体按钮
    if (agentBtn) {
        agentBtn.style.display = 'flex';
    }
}

function closeEntryWelcome(remember = true) {
    if (!entryWelcome) return;
    entryWelcome.classList.remove('show');
    entryWelcome.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('entry-welcome-open');
    if (remember) {
        localStorage.setItem('ssfq_entry_welcome_seen', '1');
    }
}

function setupEntryWelcome() {
    if (!entryWelcome) return;

    const hasSeenWelcome = localStorage.getItem('ssfq_entry_welcome_seen') === '1';
    if (!hasSeenWelcome) {
        setTimeout(() => {
            openEntryWelcome();
        }, 180);
    }

    if (entryWelcomeConfirm) {
        entryWelcomeConfirm.addEventListener('click', () => closeEntryWelcome(true));
    }

    if (entryWelcomeClose) {
        entryWelcomeClose.addEventListener('click', () => closeEntryWelcome(true));
    }

    entryWelcome.addEventListener('click', (e) => {
        if (e.target.classList.contains('entry-welcome-backdrop')) {
            closeEntryWelcome(true);
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && entryWelcome.classList.contains('show')) {
            closeEntryWelcome(true);
        }
    });
}

function openAgreementModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('entry-welcome-open');
}

function closeAgreementModal(modal) {
    if (!modal) return;
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');

    const hasActiveAgreement = Array.from(agreementModals).some(item => item.classList.contains('active'));
    if (!entryWelcome.classList.contains('show') && !hasActiveAgreement) {
        document.body.classList.remove('entry-welcome-open');
    }
}

function setupAgreementModals() {
    agreementEntries.forEach(entry => {
        entry.addEventListener('click', () => {
            openAgreementModal(entry.dataset.agreementTarget);
        });
    });

    agreementModals.forEach(modal => {
        modal.querySelectorAll('[data-agreement-close]').forEach(trigger => {
            trigger.addEventListener('click', () => closeAgreementModal(modal));
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        agreementModals.forEach(modal => {
            if (modal.classList.contains('active')) {
                closeAgreementModal(modal);
            }
        });
    });
}

// 秘塔 AI 搜索配置与法律依据模式
const METASO_LEGAL_SITES = [
    'site:gov.cn',
    'site:court.gov.cn',
    'site:pkulaw.com',
    'site:flk.npc.gov.cn'
];

function getMetasoApiKey() {
    return API_CONFIG.metasoApiKey || localStorage.getItem('METASO_API_KEY') || window.METASO_API_KEY || '';
}

function normalizeMetasoResults(data) {
    const candidates = data?.results || data?.webpages || data?.data?.results || data?.data?.webpages || data?.data || [];
    if (!Array.isArray(candidates)) return [];

    return candidates.map(item => ({
        title: item.title || item.name || '未命名资料',
        url: item.url || item.link || item.sourceUrl || '',
        snippet: item.snippet || item.summary || item.description || item.content || '',
        rawContent: item.rawContent || item.raw_content || item.markdown || item.text || ''
    })).filter(item => item.title || item.url || item.snippet || item.rawContent);
}

/**
 * 调用秘塔 AI 搜索 API
 * @param {{ q: string; scope?: string; includeSummary?: boolean; size?: number; includeRawContent?: boolean; conciseSnippet?: boolean }} params
 */
async function searchMetaso(params) {
    const apiKey = getMetasoApiKey();
    if (!apiKey) {
        throw new Error('未配置秘塔 AI API Key。请在浏览器控制台执行 localStorage.setItem("METASO_API_KEY", "你的秘塔API Key") 后刷新页面，或在代码中配置 API_CONFIG.metasoApiKey。');
    }

    const response = await fetch(API_CONFIG.metasoApiUrl, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            q: params.q,
            scope: params.scope || 'webpage',
            includeSummary: params.includeSummary ?? false,
            size: params.size || 10,
            includeRawContent: params.includeRawContent ?? false,
            conciseSnippet: params.conciseSnippet ?? false
        })
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`秘塔API请求失败: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ''}`);
    }

    return response.json();
}

/**
 * 法律专用搜索：查询法条、行政法规、政府文件
 */
async function searchLegalData(query, options = {}) {
    const optimizedQuery = `${METASO_LEGAL_SITES.join(' OR ')} ${query}`;

    return searchMetaso({
        q: optimizedQuery,
        scope: options.scope || 'webpage',
        size: options.size || 15,
        includeRawContent: options.includeRawContent ?? true,
        includeSummary: true,
        conciseSnippet: options.conciseSnippet ?? false
    });
}

function formatMetasoSourcesForPrompt(results) {
    if (!results.length) return '未检索到可用结果。';

    return results.map((item, index) => {
        const content = (item.rawContent || item.snippet || '').replace(/\s+/g, ' ').trim();
        const limitedContent = content.length > 1200 ? `${content.slice(0, 1200)}...` : content;
        return [
            `【资料${index + 1}】${item.title}`,
            item.url ? `来源链接：${item.url}` : '',
            limitedContent ? `内容摘要：${limitedContent}` : ''
        ].filter(Boolean).join('\n');
    }).join('\n\n');
}

async function generateLegalBasisWithDeepSeek(userQuestion, sources, messageElement) {
    const LEGAL_BASIS_SYSTEM_PROMPT = `你是“塞上法桥”的法律依据检索与归纳助手。你必须基于用户问题和秘塔 AI 检索资料，提炼可核验的法律依据。

输出要求：
1. 使用中文 Markdown。
2. 优先引用法律、行政法规、司法解释、最高法/最高检规范性文件、政府官网资料。
3. 每条依据尽量包含：规范名称、条文号、核心规则、与用户问题的关联。
4. 不得编造法条号；资料不足时必须说明“需进一步核验”。
5. 结尾给出“核验提示”和“下一步建议”。

输出结构：
【塞上法桥 · 法律依据】
## 一、问题定性
## 二、可适用法律依据
## 三、依据适用分析
## 四、证据与核验提示
## 五、下一步建议`;

    const chunks = [];
    const pushChunk = (txt) => {
        chunks.push(txt);
        updateMessageContent(messageElement, chunks.join(''));
    };

    const response = await fetch(API_CONFIG.deepseekApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.deepseekApiKey}`
        },
        body: JSON.stringify({
            model: API_CONFIG.agentModel,
            messages: [
                { role: 'system', content: LEGAL_BASIS_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `【用户问题】\n${userQuestion}\n\n【秘塔 AI 检索资料】\n${formatMetasoSourcesForPrompt(sources)}\n\n请基于以上检索资料生成法律依据。`
                }
            ],
            temperature: 0.3,
            stream: true
        })
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`法律依据生成失败: ${response.status} ${errorText}`);
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
                console.warn('解析法律依据生成响应失败:', e);
            }
        }
    }

    return chunks.join('');
}

// 使用DeepSeek生成得理AI法律依据分析
async function generateDeliLegalBasisWithDeepSeek(userQuestion, laws, messageElement) {
    const DELI_LEGAL_BASIS_SYSTEM_PROMPT = `你是"塞上法桥"的法律依据分析助手。你必须基于用户问题和得理AI检索到的法律法规，提炼可核验的法律依据。

输出要求：
1. 使用中文 Markdown 格式。
2. 必须严格引用检索资料中的法律条文，不得编造。
3. 按照"法律名称 + 条款号 + 具体内容"的格式引用。
4. 说明每条法律依据与用户问题的关联性。
5. 如果检索资料不足以回答问题，明确说明。
6. 结尾给出"核验提示"和"下一步建议"。

输出结构：
【塞上法桥 · 法律依据】

## 一、问题概述
[简要概括用户的法律问题]

## 二、适用法律依据
### 1. [法律名称]
**条款**：第X条
**内容**：[具体条文内容]
**适用说明**：[说明该条款如何适用于用户问题]

### 2. [法律名称]
...

## 三、法律分析
[基于上述法律依据，对用户问题进行综合分析]

## 四、核验提示
[提示用户需要注意的法律要点、时效等]

## 五、下一步建议
[给出具体的行动建议]`;

    const chunks = [];
    const pushChunk = (txt) => {
        chunks.push(txt);
        updateMessageContent(messageElement, chunks.join(''));
    };

    const userPrompt = `【用户问题】
${userQuestion}

【得理AI检索到的法律法规】
${formatDeliLawsForPrompt(laws)}

请基于以上检索到的法律法规，为用户生成专业的法律依据分析。`;

    const response = await fetch(API_CONFIG.deepseekApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.deepseekApiKey}`
        },
        body: JSON.stringify({
            model: API_CONFIG.agentModel,
            messages: [
                { role: 'system', content: DELI_LEGAL_BASIS_SYSTEM_PROMPT },
                { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
            stream: true
        })
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`法律依据生成失败: ${response.status} ${errorText}`);
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
                console.warn('解析法律依据生成响应失败:', e);
            }
        }
    }

    return chunks.join('');
}

// 得理 API 配置
const DELI_CONFIG = {
    baseUrl: 'https://platform.delilegal.com',
    apiKey: 'sk-41f4187711c54260ae9a080640ae7ed1196672d42b5058311d71c7189eb3fe70422027f9f1a81fe5f4a3262d58361e66',
    model: 'deli-lite-v2'
};

/**
 * 调用得理 AI 对话 API（流式输出）
 * @param {string} userQuestion - 用户问题
 * @param {Function} onChunk - 接收流式数据的回调函数
 * @returns {Promise<string>} - 返回完整的回答
 */
async function callDeliChatStream(userQuestion, onChunk) {
    try {
        const response = await fetch(`${DELI_CONFIG.baseUrl}/api/v1/generice/chat/chat-completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DELI_CONFIG.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: '你是塞上法桥的专业法律助手，擅长提供准确的法律依据分析。请基于中国法律法规，为用户提供专业、详细的法律依据说明。'
                    },
                    {
                        role: 'user',
                        content: userQuestion
                    }
                ],
                model: DELI_CONFIG.model,
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let fullContent = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);

                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content || '';

                        if (content) {
                            fullContent += content;
                            if (onChunk) onChunk(content);
                        }
                    } catch (e) {
                        console.warn('解析得理 API 响应失败:', e, '原始数据:', data);
                    }
                }
            }
        }

        return fullContent;
    } catch (error) {
        console.error('得理 AI 对话失败:', error);
        throw error;
    }
}

// 法律依据模式：调用得理 AI 对话 API 生成法律依据分析
async function streamLegalBasisFromDeli(userQuestion, messageElement, renderContext, requestMode) {
    const ZHIPU_API_KEY = 'b90ce328fa804d1c8f75b3fb78c2552b.PWSAwPfahS89xUA0';
    const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

    // 法律依据系统提示词
    const LEGAL_BASIS_SYSTEM_PROMPT = `你是”塞上法桥”的专业法律依据分析助手。你必须为用户提供准确、详细的法律依据分析。

【输出要求】
1. 使用中文 Markdown 格式
2. 必须引用具体的法律条文（法律名称 + 条款号 + 具体内容）
3. 说明每条法律依据与用户问题的关联性
4. 如果某些法律依据需要进一步核验，明确说明
5. 提供实用的下一步建议

【输出结构】
【塞上法桥 · 法律依据】

## 一、问题概述
[简要概括用户的法律问题]

## 二、适用法律依据
### 1. [法律名称]
**条款**：第X条
**内容**：[具体条文内容]
**适用说明**：[说明该条款如何适用于用户问题]

### 2. [法律名称]
[继续列举相关法律依据]

## 三、法律分析
[基于上述法律依据，对用户问题进行综合分析]

## 四、核验提示
[提示用户需要注意的法律要点、时效等]

## 五、下一步建议
[给出具体的行动建议]

请确保引用的法律条文准确、完整，并说明其与用户问题的关联性。`;

    const chunks = [];
    const pushChunk = (txt) => {
        chunks.push(txt);
        updateMessageContent(messageElement, chunks.join(''), renderContext);
    };

    try {
        pushChunk('【法律依据分析中】\n正在使用塞上法桥为您生成专业的法律依据分析...\n\n');

        console.log('=== 智谱 GLM-5 法律依据模式调用开始 ===');
        console.log('API Key:', ZHIPU_API_KEY.substring(0, 20) + '...');
        console.log('Model: glm-5');
        console.log('用户问题:', userQuestion);

        const response = await fetch(ZHIPU_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ZHIPU_API_KEY}`
            },
            body: JSON.stringify({
                model: 'glm-5',
                messages: [
                    {
                        role: 'system',
                        content: LEGAL_BASIS_SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: `请针对以下法律问题提供详细的法律依据分析：\n\n【用户问题】\n${userQuestion}`
                    }
                ],
                stream: true,
                max_tokens: 8000,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let buffer = '';
        let chunkCount = 0;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;

                if (trimmedLine.startsWith('data: ')) {
                    const data = trimmedLine.slice(6);

                    try {
                        const json = JSON.parse(data);
                        const content = json.choices?.[0]?.delta?.content || '';

                        if (content) {
                            chunkCount++;
                            pushChunk(content);
                        }
                    } catch (e) {
                        console.warn('解析智谱 API 响应失败:', e);
                    }
                }
            }
        }

        console.log('=== 智谱 GLM-5 法律依据模式调用完成 ===');
        console.log('总共接收:', chunkCount, '个数据块');

        if (chunks.length === 0 || chunks.join('').trim().length === 0) {
            const noResult = '【塞上法桥 · 法律依据】\n\n智谱 GLM-5 未返回有效内容，请稍后重试。\n\n💡 提示：\n1. 请检查浏览器控制台（F12）查看详细错误信息\n2. 您可以先使用”综合建议”模式获取法律咨询';
            updateMessageContent(messageElement, noResult);
            return noResult;
        }

        // 直接返回生成的内容，不添加来源标注
        const finalText = chunks.join('');
        updateMessageContent(messageElement, finalText);
        return finalText;

    } catch (error) {
        console.error('=== 智谱 GLM-5 法律依据模式调用失败 ===');
        console.error('错误类型:', error.name);
        console.error('错误信息:', error.message);
        console.error('完整错误:', error);

        const errMsg = String(error?.message || '未知错误');
        let hint = '';
        let troubleshooting = '';

        if (errMsg.includes('401') || errMsg.includes('403')) {
            hint = '\n\n❌ 可能原因：API Key 无效、权限不足或额度受限';
            troubleshooting = '\n\n🔧 解决方法：\n1. 检查智谱 API Key 是否正确\n2. 确认 API Key 是否有 GLM-5 调用权限\n3. 检查账户余额是否充足';
        } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('CORS')) {
            hint = '\n\n❌ 可能原因：网络连接问题';
            troubleshooting = '\n\n🔧 解决方法：\n1. 检查网络连接是否正常\n2. 确认智谱 API 服务是否可访问';
        } else if (errMsg.includes('429')) {
            hint = '\n\n❌ 可能原因：API 调用频率超限';
            troubleshooting = '\n\n🔧 解决方法：\n1. 等待 1-2 分钟后重试\n2. 减少请求频率';
        } else if (errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503')) {
            hint = '\n\n❌ 可能原因：智谱 API 服务暂时不可用';
            troubleshooting = '\n\n🔧 解决方法：\n1. 稍后重试\n2. 检查智谱服务状态';
        } else {
            troubleshooting = '\n\n🔧 调试建议：\n1. 打开浏览器开发者工具（F12）\n2. 查看 Console 标签的详细错误信息\n3. 查看 Network 标签的请求详情';
        }

        const failText = `❌ 法律依据生成失败\n\n错误信息：${errMsg}${hint}${troubleshooting}\n\n💡 您可以先使用”综合建议”模式，或检查 API 配置后重试。`;
        updateMessageContent(messageElement, failText);
        return failText;
    }
}

// 参考案例模式：调用秘塔AI搜索法律案例
async function streamLegalCasesFromMetaso(userQuestion, messageElement, renderContext, requestMode) {
    const chunks = [];
    const pushStatus = (txt) => {
        chunks.push(txt);
        updateMessageContent(messageElement, chunks.join(''), renderContext);
    };

    try {
        pushStatus('【法律案例检索中】\n正在使用塞上法桥检索相关法律案例和判例...\n\n');

        // 优化搜索关键词，专注于案例搜索
        const caseQuery = `${userQuestion} 案例 判例 裁判文书`;

        const searchData = await searchMetaso({
            q: caseQuery,
            scope: 'webpage',
            size: 15,
            includeRawContent: true,
            conciseSnippet: false
        });

        const sources = normalizeMetasoResults(searchData);
        pushStatus(`已检索到 ${sources.length} 条候选案例资料，正在整理相关参考案例...\n\n`);

        if (!sources.length) {
            const noResult = [
                '【塞上法桥 · 参考案例】',
                '',
                '未通过秘塔 AI 检索到足够明确的案例资料。',
                '',
                '## 建议',
                '1. 补充更具体的案件类型、争议焦点、涉及金额等信息。',
                '2. 尝试使用更精确的关键词，例如"劳动合同纠纷 违法解除 判决书"。',
                '3. 可以访问中国裁判文书网、最高人民法院官网等权威平台查询更多案例。'
            ].join('\n');
            updateMessageContent(messageElement, noResult);
            return noResult;
        }

        const generated = await generateLegalCasesWithDeepSeek(userQuestion, sources, messageElement);
        const sourceList = sources.slice(0, 8).map((item, index) => `${index + 1}. ${item.title}${item.url ? `\n   ${item.url}` : ''}`).join('\n');
        const finalText = `${generated}\n\n---\n## 秘塔 AI 检索来源\n${sourceList}\n\n> 提示：以上案例由 AI 基于检索资料整理生成，仅供参考；具体案情和裁判要点请以原始裁判文书为准。`;
        updateMessageContent(messageElement, finalText);
        return finalText;
    } catch (error) {
        console.error('秘塔法律案例模式调用失败:', error);
        const errMsg = String(error?.message || '未知错误');
        let hint = '';

        if (errMsg.includes('401') || errMsg.includes('403')) {
            hint = '\n可能是秘塔 API Key 无效、权限不足或额度受限。';
        } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('CORS')) {
            hint = '\n可能是浏览器跨域限制。若秘塔接口不允许前端直连，请通过后端代理转发请求。';
        } else if (errMsg.includes('未配置秘塔 AI API Key')) {
            hint = '\n请先配置秘塔 AI API Key。';
        }

        const failText = `❌ 参考案例生成失败\n\n错误信息：${errMsg}${hint}\n\n💡 您可以先使用"综合建议"模式，或完成秘塔 API 配置后重试。`;
        updateMessageContent(messageElement, failText);
        return failText;
    }
}

// 使用 DeepSeek 生成结构化的法律案例分析
async function generateLegalCasesWithDeepSeek(userQuestion, sources, messageElement) {
    const LEGAL_CASE_SYSTEM_PROMPT = `你是"塞上法桥"的法律案例分析助手。你必须基于用户问题和秘塔 AI 检索的案例资料，整理出相关的参考案例。

输出要求：
1. 使用中文 Markdown 格式。
2. 重点提取案例的关键信息：案由、争议焦点、法院观点、裁判结果。
3. 分析案例与用户问题的相似性和参考价值。
4. 每个案例应包含：案件名称、审理法院、裁判时间、案情简介、裁判要点、参考价值。
5. 不得编造案例；资料不足时必须说明"需进一步查询原始裁判文书"。
6. 结尾给出"案例启示"和"注意事项"。

输出结构：
【塞上法桥 · 参考案例】

## 案例概述
简要说明检索到的案例类型和数量。

## 相关案例

### 案例一：[案件名称]
- **审理法院**：XXX人民法院
- **裁判时间**：XXXX年XX月
- **案由**：XXX纠纷
- **案情简介**：简要描述案件事实（100-200字）
- **争议焦点**：本案的核心争议点
- **法院观点**：法院的裁判理由和法律适用
- **裁判结果**：判决主文
- **参考价值**：★★★★☆（说明与用户问题的相似度和参考意义）

### 案例二：[案件名称]
（同上结构）

### 案例三：[案件名称]
（同上结构）

## 案例启示
基于以上案例，总结对用户问题的启示和借鉴意义。

## 注意事项
1. 案例的时效性和地域性考量
2. 不同案例的裁判尺度差异
3. 建议结合具体情况咨询专业律师

请严格基于检索资料生成，保持专业、客观、准确。`;

    const chunks = [];
    const pushChunk = (txt) => {
        chunks.push(txt);
        updateMessageContent(messageElement, chunks.join(''));
    };

    const response = await fetch(API_CONFIG.deepseekApiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_CONFIG.deepseekApiKey}`
        },
        body: JSON.stringify({
            model: API_CONFIG.agentModel,
            messages: [
                { role: 'system', content: LEGAL_CASE_SYSTEM_PROMPT },
                {
                    role: 'user',
                    content: `【用户问题】\n${userQuestion}\n\n【秘塔 AI 检索案例资料】\n${formatMetasoSourcesForPrompt(sources)}\n\n请基于以上检索资料整理相关法律参考案例。`
                }
            ],
            temperature: 0.3,
            stream: true
        })
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`参考案例生成失败: ${response.status} ${errorText}`);
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
                console.warn('解析参考案例生成响应失败:', e);
            }
        }
    }

    return chunks.join('');
}

// 应对策略模式：调用智谱API流式输出
async function streamLegalStrategyFromZhipu(userQuestion, messageElement, renderContext, requestMode) {
    const ZHIPU_API_KEY = 'b90ce328fa804d1c8f75b3fb78c2552b.PWSAwPfahS89xUA0';
    const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

    // 法律应对策略系统提示词
    const LEGAL_STRATEGY_SYSTEM_PROMPT = `你是"塞上法桥"的专业法律应对策略顾问，具备深厚的法律知识和实务经验。

你的职责是：
1. 分析用户面临的法律问题和情境
2. 提供切实可行、专业可靠的应对策略
3. 考虑法律风险、时效性和可操作性
4. 给出分步骤的行动建议

输出要求：
- 策略要具体、可执行，避免空泛建议
- 按紧急程度和重要性排序
- 明确指出法律依据和风险点
- 提供时间节点提醒（如诉讼时效）
- 语言专业但易懂，适合非法律专业人士理解

输出格式：
【情况分析】简要分析问题核心
【应对策略】分条列出具体措施
【法律依据】相关法律法规
【风险提示】需要注意的风险点
【时间节点】关键时间要求
【建议行动】立即可采取的步骤`;

    const chunks = [];
    const pushChunk = (txt) => {
        chunks.push(txt);
        updateMessageContent(messageElement, chunks.join(''));
    };

    try {
        pushChunk('【应对策略生成中】\n正在使用塞上法桥为您分析法律问题并制定应对策略...\n\n');

        const response = await fetch(ZHIPU_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ZHIPU_API_KEY}`
            },
            body: JSON.stringify({
                model: 'glm-4-flash',
                messages: [
                    {
                        role: 'system',
                        content: LEGAL_STRATEGY_SYSTEM_PROMPT
                    },
                    {
                        role: 'user',
                        content: `请针对以下法律问题提供应对策略：\n\n【用户问题】\n${userQuestion}\n\n请提供详细的应对策略和建议。`
                    }
                ],
                stream: true,
                max_tokens: 8000,
                temperature: 0.7,
                top_p: 0.9
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`智谱API调用失败: ${response.status} ${errorText}`);
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
                    if (delta) {
                        pushChunk(delta);
                    }
                } catch (e) {
                    console.warn('解析智谱API响应失败:', e);
                }
            }
        }

        if (!chunks.join('').includes('【')) {
            pushChunk('\n\n---\n\n💡 提示：以上是基于您的问题生成的应对策略建议，具体实施前建议咨询专业律师。');
        }

        return chunks.join('');

    } catch (error) {
        console.error('智谱API调用失败:', error);
        const errMsg = String(error?.message || '未知错误');
        let hint = '';

        if (errMsg.includes('401') || errMsg.includes('403')) {
            hint = '\n可能是 API Key 无效或权限不足，请检查智谱API密钥。';
        } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError')) {
            hint = '\n可能是网络连接问题或跨域限制，请检查网络连接。';
        }

        pushChunk(`\n\n❌ 应对策略生成失败：${errMsg}${hint}`);
        return chunks.join('');
    }
}

// 风险提示模式：调用通义千问API流式输出
async function analyzeRiskWithQwen(userQuestion, messageElement) {
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

    const chunks = [];
    const pushChunk = (txt) => {
        chunks.push(txt);
        updateMessageContent(messageElement, chunks.join(''));
    };

    try {
        pushChunk('【法律风险分析中】\n正在使用塞上法桥为您深度分析法律风险...\n\n');

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
                stream: true
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`通义千问API调用失败: ${response.status} ${errorText}`);
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
                    if (delta) {
                        pushChunk(delta);
                    }
                } catch (e) {
                    console.warn('解析通义千问API响应失败:', e);
                }
            }
        }

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

// 调用AI API（流式输出）
async function callAIStream(userMessage, messageElement) {
    const requestMode = currentMode;
    const requestAgentMode = currentMode === 'agent' ? agentActionMode : null;
    const renderContext = requestMode === 'agent'
        ? { mode: 'agent', agentMode: requestAgentMode }
        : { mode: requestMode };

    if (requestMode === 'agent' && requestAgentMode) {
        messageElement.dataset.renderMode = 'agent';
        messageElement.dataset.agentMode = requestAgentMode;
    }

    try {
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        // 根据请求发起时的模式选择不同的系统提示词
        const systemPrompt = requestMode === 'agent' ? LEGAL_AGENT_PROMPT : SYSTEM_PROMPT;

        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory
        ];

        let apiUrl, apiKey, model, requestBody;

        if (requestMode === 'deep' || requestMode === 'agent') {
            // DeepSeek API
            apiUrl = API_CONFIG.deepseekApiUrl;
            apiKey = API_CONFIG.deepseekApiKey;
            model = requestMode === 'deep' ? API_CONFIG.deepModel : API_CONFIG.agentModel;
            requestBody = {
                model: model,
                messages: messages,
                temperature: API_CONFIG.temperature,
                stream: true  // 启用流式输出
            };
        } else {
            // 智谱AI API
            apiUrl = API_CONFIG.zhipuApiUrl;
            apiKey = API_CONFIG.zhipuApiKey;
            model = API_CONFIG.fastModel;
            requestBody = {
                model: model,
                messages: messages,
                max_tokens: API_CONFIG.maxTokens,
                temperature: API_CONFIG.temperature,
                stream: true  // 启用流式输出
            };
        }

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullMessage = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') continue;

                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices[0]?.delta?.content || '';

                        if (content) {
                            fullMessage += content;
                            // 实时更新消息显示
                            updateMessageContent(messageElement, fullMessage, renderContext);
                        }
                    } catch (e) {
                        // 忽略解析错误
                    }
                }
            }
        }

        if (requestMode === 'agent') {
            if (currentMode === 'agent' && agentActionMode === requestAgentMode) {
                conversationHistory.push({
                    role: 'assistant',
                    content: fullMessage
                });
                if (requestAgentMode) {
                    agentModeHistories[requestAgentMode] = [...conversationHistory];
                    syncAgentStreamMessage(requestAgentMode, messageElement);
                }
                updateAgentSidebarFlow(6, '通义法睿资料搜索中');
                setAgentSidebarView('result');
            } else if (requestAgentMode) {
                agentModeHistories[requestAgentMode] = [
                    ...(agentModeHistories[requestAgentMode] || []),
                    { role: 'assistant', content: fullMessage }
                ];
                syncAgentStreamMessage(requestAgentMode, messageElement);
            }
        } else {
            conversationHistory.push({
                role: 'assistant',
                content: fullMessage
            });
            if (requestMode === currentMode) {
                modeSnapshot[requestMode].conversationHistory = [...conversationHistory];
                modeSnapshot[requestMode].messagesHTML = messagesContainer.innerHTML;
                modeSnapshot[requestMode].hasMessages = messagesContainer.classList.contains('active');
            } else if (modeSnapshot[requestMode]) {
                const wrapper = document.createElement('div');
                wrapper.innerHTML = modeSnapshot[requestMode].messagesHTML || '';
                const storedMessage = wrapper.querySelector(`[data-stream-message-id="${messageElement.dataset.streamMessageId}"]`);
                if (storedMessage) {
                    storedMessage.innerHTML = messageElement.innerHTML;
                } else {
                    wrapper.appendChild(messageElement.cloneNode(true));
                }
                modeSnapshot[requestMode].conversationHistory = [...conversationHistory];
                modeSnapshot[requestMode].messagesHTML = wrapper.innerHTML;
                modeSnapshot[requestMode].hasMessages = wrapper.innerHTML.trim() !== '';
            }
        }

        return fullMessage;
    } catch (error) {
        console.error('API调用错误:', error);
        return '抱歉呀，我现在遇到了一点小问题...😢 请稍后再试一下好吗？';
    }
}

function syncModeStreamMessage(mode, messageElement) {
    if (!mode || mode === 'agent' || !modeSnapshot[mode] || !messageElement) return;

    if (currentMode === mode && messageElement.isConnected) {
        modeSnapshot[mode].messagesHTML = messagesContainer.innerHTML;
        modeSnapshot[mode].hasMessages = messagesContainer.classList.contains('active');
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = modeSnapshot[mode].messagesHTML || '';
    const messageId = messageElement.dataset.streamMessageId;
    const storedMessage = messageId ? wrapper.querySelector(`[data-stream-message-id="${messageId}"]`) : null;

    if (storedMessage) {
        storedMessage.innerHTML = messageElement.innerHTML;
        Array.from(messageElement.attributes).forEach(attr => storedMessage.setAttribute(attr.name, attr.value));
    } else {
        wrapper.appendChild(messageElement.cloneNode(true));
    }

    modeSnapshot[mode].messagesHTML = wrapper.innerHTML;
    modeSnapshot[mode].hasMessages = wrapper.innerHTML.trim() !== '';
}

// 更新消息内容（用于流式输出）
function updateMessageContent(messageElement, content, renderContext = {}) {
    if (!messageElement) return;

    const nextContent = String(content ?? '');
    const mode = renderContext.mode || messageElement.dataset.renderMode || currentMode;
    const agentMode = renderContext.agentMode || messageElement.dataset.agentMode || agentActionMode;

    // 检查内容是否真的改变了
    const contentChanged = messageElement.dataset.lastRenderedMessage !== nextContent;
    if (contentChanged) {
        messageElement.dataset.lastRenderedMessage = nextContent;
    }

    // 只在法律智能体模式下分离思考过程和答案，且使用请求发起时的子模式上下文
    if (mode === 'agent') {
        updateAgentMessage(messageElement, nextContent, agentMode);
    } else {
        // 其他模式正常显示
        const textDiv = messageElement.querySelector('.message-text');
        if (textDiv) {
            textDiv.innerHTML = nextContent.replace(/\n/g, '<br>');
            scheduleMessagesScroll();
        }
    }

    // 每次更新都同步到快照，确保切换模式时能看到最新内容
    if (mode === 'agent' && agentMode) {
        syncAgentStreamMessage(agentMode, messageElement);
    } else {
        syncModeStreamMessage(mode, messageElement);
    }
}

// 更新法律智能体消息（分离思考过程和答案）
function updateAgentMessage(messageElement, content, streamMode = activeAgentStreamMode) {

    // 移除加载提示（如果存在）
    const loadingDiv = messageElement.querySelector('.agent-loading');
    if (loadingDiv) {
        // 清理进度定时器
        const intervalId = loadingDiv.dataset.progressInterval;
        if (intervalId) {
            clearInterval(intervalId);
        }

        // 只有综合建议模式才显示100%进度，其他模式直接移除
        if (streamMode === 'comprehensive') {
            // 设置进度为100%
            const progressSpan = loadingDiv.querySelector('.agent-progress');
            if (progressSpan) {
                progressSpan.textContent = '100%';
            }
        }

        // 移除加载提示
        loadingDiv.remove();
    }

    // 查找【塞上法桥综合建议】的位置
    const suggestionIndex = content.indexOf('【塞上法桥综合建议】');

    if (streamMode === 'legal-basis' || streamMode === 'strategy' || streamMode === 'risk' || streamMode === 'case' || streamMode === 'document') {
        let answerDiv = messageElement.querySelector('.final-answer');
        if (!answerDiv) {
            answerDiv = document.createElement('div');
            answerDiv.className = 'final-answer';
            answerDiv.innerHTML = `
                <div class="answer-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                    </svg>
                    ${streamMode === 'legal-basis' ? '法律依据' : streamMode === 'strategy' ? '应对策略' : streamMode === 'risk' ? '风险提示' : streamMode === 'case' ? '参考案例' : '法律文书'}
                </div>
                <div class="answer-content"></div>
            `;
            messageElement.appendChild(answerDiv);
        }

        const answerContent = answerDiv.querySelector('.answer-content');
        answerContent.innerHTML = content.replace(/\n/g, '<br>');
        scheduleMessagesScroll();
        return;
    }

    if (suggestionIndex === -1) {
        // 还没有到综合建议部分，全部作为思考过程
        let thinkingDiv = messageElement.querySelector('.thinking-process');
        if (!thinkingDiv) {
            thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'thinking-process';
            thinkingDiv.innerHTML = `
                <div class="thinking-header">
                    <svg class="thinking-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                    </svg>
                    思考中...
                </div>
                <div class="thinking-content"></div>
            `;
            messageElement.appendChild(thinkingDiv);
        }

        const thinkingContent = thinkingDiv.querySelector('.thinking-content');
        thinkingContent.innerHTML = content.replace(/\n/g, '<br>');
    } else {
        // 分离思考过程和最终答案
        const thinkingText = content.substring(0, suggestionIndex).trim();
        const answerText = content.substring(suggestionIndex).trim();

        // 更新或创建思考过程
        let thinkingDiv = messageElement.querySelector('.thinking-process');
        if (!thinkingDiv && thinkingText) {
            thinkingDiv = document.createElement('div');
            thinkingDiv.className = 'thinking-process';
            thinkingDiv.innerHTML = `
                <div class="thinking-header">
                    <svg class="thinking-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                    </svg>
                    分析过程
                </div>
                <div class="thinking-content"></div>
            `;
            messageElement.appendChild(thinkingDiv);
        }

        if (thinkingDiv && thinkingText) {
            const thinkingContent = thinkingDiv.querySelector('.thinking-content');
            thinkingContent.innerHTML = thinkingText.replace(/\n/g, '<br>');
        }
        
        // 更新或创建最终答案
        let answerDiv = messageElement.querySelector('.final-answer');
        if (!answerDiv) {
            answerDiv = document.createElement('div');
            answerDiv.className = 'final-answer';
            answerDiv.innerHTML = `
                <div class="answer-header">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    综合建议
                </div>
                <div class="answer-content"></div>
            `;
            messageElement.appendChild(answerDiv);
        }
        
        const answerContent = answerDiv.querySelector('.answer-content');
        answerContent.innerHTML = answerText.replace(/\n/g, '<br>');
        
        // 添加线下律师服务按钮或已提交标记（仅在法律智能体模式下）
        if (!messageElement.querySelector('.offline-lawyer-btn') && !messageElement.querySelector('.service-requested-badge')) {
            // 检查该对话是否已经提交过服务请求
            const reviewStatus = messageElement.querySelector('.review-status');
            const conversationId = reviewStatus ? reviewStatus.getAttribute('data-conversation-id') : null;
            
            let hasServiceRequest = false;
            if (conversationId) {
                const userRequests = JSON.parse(localStorage.getItem('meibao_user_requests') || '[]');
                hasServiceRequest = userRequests.some(req => req.conversationId === conversationId);
            }
            
            if (hasServiceRequest) {
                // 已提交过服务请求，显示标记
                const requestedBadge = document.createElement('div');
                requestedBadge.className = 'service-requested-badge';
                requestedBadge.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>已提交线下服务请求</span>
                `;
                messageElement.appendChild(requestedBadge);
            } else {
                // 未提交过，显示按钮
                const lawyerBtn = document.createElement('button');
                lawyerBtn.className = 'offline-lawyer-btn';
                lawyerBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 010 7.75"></path>
                    </svg>
                    <span>需要线下律师服务？</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                `;
                lawyerBtn.addEventListener('click', () => {
                    showLawyerServiceModal();
                });
                messageElement.appendChild(lawyerBtn);
            }
        }
        
        // 添加审核状态标签（仅在法律智能体模式下）
        if (!messageElement.querySelector('.review-status')) {
            const reviewStatus = document.createElement('div');
            reviewStatus.className = 'review-status pending';
            reviewStatus.setAttribute('data-conversation-id', ''); // 将在保存时设置
            reviewStatus.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="12"></line>
                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                <span>未审核</span>
            `;
            messageElement.appendChild(reviewStatus);
        }
    }
    
    // 滚动到底部
    scheduleMessagesScroll();
}

// 显示律师服务申请弹窗
function showLawyerServiceModal() {
    // 检查是否已存在弹窗
    if (document.querySelector('.lawyer-modal')) return;

    // 检查用户是否已登录
    const currentUser = JSON.parse(localStorage.getItem('meibao_current_user') || 'null');

    if (currentUser) {
        // 用户已登录，直接提交服务请求
        submitLawyerServiceRequest(currentUser.username, currentUser.phone, currentUser.wechat);
        return;
    }

    // 用户未登录，显示登录表单（预填写信息）
    const modal = document.createElement('div');
    modal.className = 'lawyer-modal';
    modal.innerHTML = `
        <div class="lawyer-modal-overlay"></div>
        <div class="lawyer-modal-content">
            <button class="lawyer-modal-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="lawyer-modal-header">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h2>用户登录</h2>
                <p>请填写您的信息以获取专业法律服务</p>
            </div>
            <div class="lawyer-modal-body">
                <form class="login-form" id="loginForm">
                    <div class="form-field">
                        <label for="username">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            用户名
                        </label>
                        <input type="text" id="username" name="username" value="马爱雯" placeholder="请输入您的姓名" required>
                    </div>
                    <div class="form-field">
                        <label for="phone">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                            </svg>
                            电话号码
                        </label>
                        <input type="tel" id="phone" name="phone" value="13722185344" placeholder="请输入您的手机号码" pattern="[0-9]{11}" required>
                    </div>
                    <div class="form-field">
                        <label for="wechat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                            </svg>
                            微信号
                        </label>
                        <input type="text" id="wechat" name="wechat" value="13722185344" placeholder="请输入您的微信号" required>
                    </div>
                </form>
            </div>
            <div class="lawyer-modal-footer">
                <button class="btn-modal-secondary" type="button">取消</button>
                <button class="btn-modal-primary" type="submit">提交</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 添加动画
    setTimeout(() => modal.classList.add('show'), 10);

    // 绑定关闭事件
    const closeBtn = modal.querySelector('.lawyer-modal-close');
    const overlay = modal.querySelector('.lawyer-modal-overlay');
    const secondaryBtn = modal.querySelector('.btn-modal-secondary');
    const primaryBtn = modal.querySelector('.btn-modal-primary');
    const form = modal.querySelector('#loginForm');

    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    secondaryBtn.addEventListener('click', closeModal);

    // 提交表单
    primaryBtn.addEventListener('click', (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const wechat = document.getElementById('wechat').value.trim();

        // 验证表单
        if (!username) {
            alert('请输入用户名');
            return;
        }

        if (!phone) {
            alert('请输入电话号码');
            return;
        }

        if (!/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的手机号码');
            return;
        }

        if (!wechat) {
            alert('请输入微信号');
            return;
        }

        // 提交服务请求
        submitLawyerServiceRequest(username, phone, wechat);
        closeModal();
    });

    // 回车提交
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        primaryBtn.click();
    });
}

// 提交律师服务请求
function submitLawyerServiceRequest(username, phone, wechat) {
    // 获取当前对话的ID（从最后一条AI消息中获取）
    const lastAiMessage = messagesContainer.querySelector('.message.ai:last-child');
    let currentConversationId = null;
    
    if (lastAiMessage) {
        const reviewStatus = lastAiMessage.querySelector('.review-status');
        if (reviewStatus) {
            currentConversationId = reviewStatus.getAttribute('data-conversation-id');
        }
    }
    
    // 保存用户信息到 localStorage
    const userInfo = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2),
        username: username,
        phone: phone,
        wechat: wechat,
        timestamp: Date.now(),
        status: 'pending', // pending, approved, rejected
        conversationId: currentConversationId // 关联的对话ID
    };
    
    // 获取现有的用户请求列表
    const userRequests = JSON.parse(localStorage.getItem('meibao_user_requests') || '[]');
    userRequests.push(userInfo);
    localStorage.setItem('meibao_user_requests', JSON.stringify(userRequests));
    
    // 隐藏当前对话的"需要线下律师服务"按钮
    if (lastAiMessage) {
        const lawyerBtn = lastAiMessage.querySelector('.offline-lawyer-btn');
        if (lawyerBtn) {
            lawyerBtn.style.display = 'none';
        }
        
        // 添加已提交标记
        if (!lastAiMessage.querySelector('.service-requested-badge')) {
            const requestedBadge = document.createElement('div');
            requestedBadge.className = 'service-requested-badge';
            requestedBadge.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
                <span>已提交线下服务请求</span>
            `;
            lastAiMessage.appendChild(requestedBadge);
        }
    }
    
    // 显示成功提示
    showToast('服务请求已提交！我们的律师将尽快与您联系', 'success');
}

// 显示提示消息
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast-notification ${type}`;
    toast.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.classList.add('show'), 10);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// 发送消息
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message) return;

    // 在法律智能体所有子模式下都打开智能体侧边栏
    if (currentMode === 'agent') {
        snapshotAgentMode(agentActionMode);
        maybeOpenAgentSidebar();
    }

    // 如果是新会话，创建会话ID
    if (!currentSessionId) {
        currentSessionId = Date.now().toString();
        createNewSession(message);
    }

    // 隐藏欢迎屏幕，显示消息容器
    if (welcomeScreen.style.display !== 'none') {
        welcomeScreen.style.display = 'none';
        messagesContainer.classList.add('active');
    }

    // 添加用户消息
    addMessage(message, 'user');

    // 清空输入框
    messageInput.value = '';
    messageInput.style.height = 'auto';

    // 禁用发送按钮
    sendBtn.disabled = true;

    if (currentMode === 'agent') {
        snapshotAgentMode(agentActionMode);
    }

    // 法律智能体模式 - 并行调用所有六个子模式
    if (currentMode === 'agent') {
        // 隐藏"结果"按钮，等待综合建议完成后再显示
        const agentViewResultBtn = document.getElementById('agentViewResultBtn');
        if (agentViewResultBtn) {
            agentViewResultBtn.style.display = 'none';
        }

        // 定义所有六个子模式
        const allAgentModes = ['comprehensive', 'legal-basis', 'strategy', 'risk', 'case', 'document'];

        // 重置所有进度条
        allAgentModes.forEach(mode => {
            updateAgentOutlineProgress(mode, 0);
        });

        // 为每个子模式创建消息元素和启动生成任务
        const generationTasks = allAgentModes.map(mode => {
            const renderContext = { mode: 'agent', agentMode: mode };
            const messageId = createAgentMessageId();

            conversationHistory.push({ role: 'user', content: message });
            agentModeHistories[mode] = [...conversationHistory];
            agentModeSessionIds[mode] = currentSessionId;
            agentModeMessagesHTML[mode] = messagesContainer.innerHTML;

            const aiMessageElement = createMessageElement('ai', mode);
            aiMessageElement.dataset.agentMessageId = messageId;
            aiMessageElement.dataset.renderMode = 'agent';
            aiMessageElement.dataset.agentMode = mode;
            appendAgentMessageHTML(mode, aiMessageElement);

            agentModeStreams[mode] = { active: true, messageId, content: '', abortController: new AbortController() };

            // 返回生成任务的 Promise
            return executeAgentModeGeneration(mode, message, aiMessageElement, renderContext);
        });

        // 等待所有任务完成后再启用发送按钮
        Promise.all(generationTasks).then(() => {
            sendBtn.disabled = false;
        }).catch(error => {
            console.error('部分子模式生成失败:', error);
            sendBtn.disabled = false;
        });

        return;
    }

    // 创建AI消息容器（用于流式输出）
    const aiMessageElement = createMessageElement('ai');
    messagesContainer.appendChild(aiMessageElement);

    try {
        const aiResponse = await callAIStream(message, aiMessageElement);

        // 只有在法律智能体综合建议模式下才保存对话供律师审核
        if (aiMessageElement.dataset.renderMode === 'agent' && aiMessageElement.dataset.agentMode === 'comprehensive') {
            saveConversationForReview(message, aiResponse);
        }

        // 保存当前会话
        saveCurrentSession();
    } catch (error) {
        updateMessageContent(aiMessageElement, '抱歉呀，我现在遇到了一点小问题...😢 请稍后再试一下好吗？');
    } finally {
        if (currentMode === 'agent') {
            syncVisibleAgentModeSnapshot();
        }
        sendBtn.disabled = false;
    }
}

// 创建消息元素（用于流式输出）
function createMessageElement(sender, agentMode = null) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    // 如果是AI消息且在法律智能体模式下
    if (sender === 'ai' && currentMode === 'agent' && agentMode) {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'agent-loading';

        // 只有综合建议模式才显示进度百分比
        if (agentMode === 'comprehensive') {
            loadingDiv.innerHTML = `
                <div class="loading-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                    </svg>
                </div>
                <div class="loading-text">
                    <span class="loading-title">塞上法桥 Agent 启动中 <span class="agent-progress">0%</span></span>
                    <span class="loading-subtitle">正在分析您的法律问题...</span>
                </div>
            `;
            messageDiv.appendChild(loadingDiv);

            // 启动进度条动画
            startAgentLoadingProgress(loadingDiv);
        } else {
            // 其他子模式显示加载提示但不显示百分比
            loadingDiv.innerHTML = `
                <div class="loading-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                    </svg>
                </div>
                <div class="loading-text">
                    <span class="loading-title">塞上法桥 Agent 启动中</span>
                    <span class="loading-subtitle">正在分析您的法律问题...</span>
                </div>
            `;
            messageDiv.appendChild(loadingDiv);
        }
    } else {
        // 非智能体模式或用户消息，创建默认的 message-text
        const textDiv = document.createElement('div');
        textDiv.className = 'message-text';
        textDiv.innerHTML = '';
        messageDiv.appendChild(textDiv);
    }

    return messageDiv;
}

// Agent 加载进度动画
function startAgentLoadingProgress(loadingDiv) {
    const progressSpan = loadingDiv.querySelector('.agent-progress');
    if (!progressSpan) return;

    let progress = 0;
    const interval = setInterval(() => {
        if (!loadingDiv.parentElement) {
            clearInterval(interval);
            return;
        }

        // 模拟进度增长，前期快，后期慢
        if (progress < 30) {
            progress += Math.random() * 8 + 2;
        } else if (progress < 60) {
            progress += Math.random() * 4 + 1;
        } else if (progress < 85) {
            progress += Math.random() * 2 + 0.5;
        } else if (progress < 95) {
            progress += Math.random() * 0.5 + 0.2;
        }

        progress = Math.min(progress, 99);
        progressSpan.textContent = Math.floor(progress) + '%';
    }, 200);

    // 保存 interval ID 以便后续清理
    loadingDiv.dataset.progressInterval = interval;
}

// 添加消息到聊天界面
function addMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;
    
    const textDiv = document.createElement('div');
    textDiv.className = 'message-text';
    textDiv.innerHTML = text.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(textDiv);
    messagesContainer.appendChild(messageDiv);
    
    // 滚动到底部
    scheduleMessagesScroll();
}

// 保存对话到 localStorage 供律师审核（仅法律智能体模式）
function saveConversationForReview(question, answer) {
    const STORAGE_KEY = 'meibao_conversations';
    const conversations = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    
    // 自动识别法律领域分类
    const category = detectLegalCategory(question);
    
    const conversationId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // 提取最终答案部分（只保存【塞上法桥综合建议】及之后的内容）
    let finalAnswer = answer;
    const suggestionIndex = answer.indexOf('【塞上法桥综合建议】');
    if (suggestionIndex !== -1) {
        // 只保存综合建议部分，去掉思考过程
        finalAnswer = answer.substring(suggestionIndex).trim();
    }
    
    const conversation = {
        id: conversationId,
        question: question,
        answer: finalAnswer,  // 只保存最终答案，不保存思考过程
        category: category,
        timestamp: Date.now(),
        mode: currentMode,
        reviewStatus: null,
        reviewedAt: null
    };
    
    conversations.push(conversation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    
    // 更新当前消息的审核状态标签的 conversation ID
    const lastMessage = messagesContainer.querySelector('.message.ai:last-child');
    if (lastMessage) {
        const reviewStatus = lastMessage.querySelector('.review-status');
        if (reviewStatus) {
            reviewStatus.setAttribute('data-conversation-id', conversationId);
        }
    }
    
    // 显示提示信息
    showUploadNotification();
    
    // 启动审核状态监听
    startReviewStatusMonitoring(conversationId);
}

// 自动识别法律领域分类
function detectLegalCategory(question) {
    const keywords = {
        civil: ['民事', '侵权', '损害赔偿', '邻居', '物权', '债权'],
        criminal: ['刑事', '犯罪', '盗窃', '诈骗', '故意伤害', '抢劫', '报警'],
        labor: ['劳动', '工作', '公司', '裁员', '加班', '工资', '社保', '辞职', '辞退', '劳动合同'],
        contract: ['合同', '违约', '借款', '欠款', '借钱', '还钱', '协议'],
        property: ['房产', '房屋', '买房', '卖房', '租房', '房东', '房客', '物业'],
        family: ['婚姻', '离婚', '结婚', '夫妻', '配偶', '子女', '抚养', '赡养', '继承', '遗产']
    };
    
    for (const [category, words] of Object.entries(keywords)) {
        if (words.some(word => question.includes(word))) {
            return category;
        }
    }
    
    return 'other';
}

// 显示上传通知
function showUploadNotification() {
    const notification = document.createElement('div');
    notification.className = 'upload-notification';
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>对话已上传至律师审核系统</span>
    `;
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 发送按钮点击事件
sendBtn.addEventListener('click', sendMessage);

// 回车发送消息
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// 随机问题按钮点击事件
if (randomQuestionBtn) {
    randomQuestionBtn.addEventListener('click', () => {
        // 随机选择一个法律问题
        const randomIndex = Math.floor(Math.random() * RANDOM_LEGAL_QUESTIONS.length);
        const randomQuestion = RANDOM_LEGAL_QUESTIONS[randomIndex];

        // 将问题填入输入框
        messageInput.value = randomQuestion;

        // 自动调整输入框高度
        messageInput.style.height = 'auto';
        messageInput.style.height = Math.min(messageInput.scrollHeight, 150) + 'px';

        // 聚焦输入框
        messageInput.focus();

        // 添加一个小动画效果
        randomQuestionBtn.style.transform = 'rotate(180deg)';
        setTimeout(() => {
            randomQuestionBtn.style.transform = 'rotate(0deg)';
        }, 300);
    });
}

// 智能体侧边栏切换按钮
if (toggleAgentSidebarBtn) {
    toggleAgentSidebarBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止触发外部点击事件
        setAgentSidebarOpen(!agentSidebarOpened);
    });
}

// 智能体按钮点击事件
if (agentBtn) {
    agentBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止触发外部点击事件
        setAgentSidebarOpen(!agentSidebarOpened);
    });
}

// 智能体侧边栏关闭按钮
if (agentSidebarCloseBtn) {
    agentSidebarCloseBtn.addEventListener('click', () => {
        setAgentSidebarOpen(false);
    });
}

// 点击智能体侧边栏外部区域关闭侧边栏
if (agentWorkspace && agentRightSidebar) {
    agentWorkspace.addEventListener('click', (e) => {
        // 只在侧边栏打开且点击的是主内容区域时关闭
        if (agentSidebarOpened &&
            !agentRightSidebar.contains(e.target) &&
            !toggleAgentSidebarBtn.contains(e.target)) {
            setAgentSidebarOpen(false);
        }
    });
}

// 律师审核演示按钮点击事件（已移除）
// if (demoLawyerBtn) {
//     demoLawyerBtn.addEventListener('click', () => {
//         localStorage.setItem('saishangfaqiao_return_mode', currentMode);
//         localStorage.setItem('saishangfaqiao_return_session', currentSessionId);
//         window.location.href = 'lawyer-review.html';
//     });
// }

// 附件按钮
if (attachBtn) {
    attachBtn.addEventListener('click', () => {
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*,.pdf,.doc,.docx,.txt';
        fileInput.multiple = true;
        fileInput.style.display = 'none';
        
        fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                handleFileUpload(files);
            }
        });
        
        document.body.appendChild(fileInput);
        fileInput.click();
        document.body.removeChild(fileInput);
    });
}

// 处理文件上传
function handleFileUpload(files) {
    files.forEach(file => {
        // 检查文件大小（限制10MB）
        if (file.size > 10 * 1024 * 1024) {
            alert('文件太大了，请选择小于10MB的文件哦～');
            return;
        }
        
        const fileData = {
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            file: file
        };
        
        // 如果是图片，生成预览
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                fileData.preview = e.target.result;
                uploadedFiles.push(fileData);
                showToast('图片已添加', 'success');
            };
            reader.readAsDataURL(file);
        } else {
            uploadedFiles.push(fileData);
            showToast('文件已添加', 'success');
        }
    });
}

// 历史记录按钮
if (historyBtn) {
    historyBtn.addEventListener('click', () => {
        showHistoryModal();
    });
}

// 显示历史记录弹窗
function showHistoryModal() {
    if (document.querySelector('.history-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'history-modal';
    modal.innerHTML = `
        <div class="history-modal-overlay"></div>
        <div class="history-modal-content">
            <div class="history-modal-header">
                <h2>历史对话</h2>
                <button class="history-modal-close">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
            </div>
            <div class="history-modal-body">
                <div class="history-list" id="historyList"></div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    // 渲染历史记录
    renderHistoryList();
    
    // 绑定关闭事件
    const closeBtn = modal.querySelector('.history-modal-close');
    const overlay = modal.querySelector('.history-modal-overlay');
    
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
}

// 渲染历史记录列表
function renderHistoryList() {
    const historyList = document.getElementById('historyList');
    if (!historyList) return;
    
    // 根据当前模式过滤会话
    const filteredSessions = allSessions.filter(session => {
        // 如果是法律智能体模式，只显示法律智能体的对话
        if (currentMode === 'agent') {
            return session.mode === 'agent';
        }
        // 如果是其他模式，只显示非法律智能体的对话
        return session.mode !== 'agent';
    });
    
    if (filteredSessions.length === 0) {
        historyList.innerHTML = '<div class="history-empty">暂无历史对话</div>';
        return;
    }
    
    historyList.innerHTML = '';
    filteredSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'history-item';
        if (session.id === currentSessionId) {
            item.classList.add('active');
        }
        
        const date = new Date(session.timestamp);
        const timeStr = formatTime(date);
        
        item.innerHTML = `
            <div class="history-item-content">
                <div class="history-item-title">${session.title}</div>
                <div class="history-item-time">${timeStr}</div>
            </div>
            <button class="history-item-delete">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
            </button>
        `;
        
        item.querySelector('.history-item-content').addEventListener('click', () => {
            loadSession(session.id);
            document.querySelector('.history-modal').classList.remove('show');
            setTimeout(() => document.querySelector('.history-modal').remove(), 300);
        });
        
        item.querySelector('.history-item-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSession(session.id);
        });
        
        historyList.appendChild(item);
    });
}

// 格式化时间
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 创建新会话
function createNewSession(firstMessage) {
    const session = {
        id: currentSessionId,
        title: firstMessage.substring(0, 30) + (firstMessage.length > 30 ? '...' : ''),
        timestamp: Date.now(),
        messages: [],
        conversationHistory: [],
        mode: currentMode // 记录会话所属的模式
    };
    allSessions.unshift(session);
    saveSessions();
    renderChatHistory(); // 更新侧边栏显示
}

// 保存当前会话
function saveCurrentSession() {
    const session = allSessions.find(s => s.id === currentSessionId);
    if (session) {
        session.messages = Array.from(messagesContainer.children)
            .map(el => {
                const msg = {
                    type: el.classList.contains('user') ? 'user' : 'ai',
                    content: '',
                    fullHTML: el.innerHTML // 保存完整的HTML结构
                };
                
                // 兼容旧版本：如果有 message-text，也保存其内容
                const messageText = el.querySelector('.message-text');
                if (messageText) {
                    msg.content = messageText.innerHTML;
                }
                
                return msg;
            });
        session.conversationHistory = [...conversationHistory];
        session.timestamp = Date.now();
        saveSessions();
        renderChatHistory(); // 更新侧边栏显示
    }
}

// 保存所有会话到localStorage
function saveSessions() {
    try {
        localStorage.setItem('chatSessions', JSON.stringify(allSessions));
    } catch (error) {
        console.error('保存会话失败:', error);
    }
}

// 从localStorage加载会话
function loadSessions() {
    try {
        const saved = localStorage.getItem('chatSessions');
        if (saved) {
            allSessions = JSON.parse(saved);
        }
    } catch (error) {
        console.error('加载会话失败:', error);
        allSessions = [];
    }
}

// 加载指定会话
function loadSession(sessionId) {
    const session = allSessions.find(s => s.id === sessionId);
    if (!session) return;

    currentSessionId = sessionId;
    conversationHistory = [...session.conversationHistory];

    // 清空并重新渲染消息
    messagesContainer.innerHTML = '';
    session.messages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.type}`;

        // 优先使用完整的HTML结构（新版本）
        if (msg.fullHTML) {
            messageDiv.innerHTML = msg.fullHTML;
        } else {
            // 兼容旧版本：使用 message-text
            const textDiv = document.createElement('div');
            textDiv.className = 'message-text';
            textDiv.innerHTML = msg.content || '';
            messageDiv.appendChild(textDiv);
        }

        messagesContainer.appendChild(messageDiv);
    });

    // 重新绑定线下律师服务按钮的事件监听器
    rebindLawyerServiceButtons();

    // 如果是法律智能体模式的会话，显示智能体侧边栏
    if (session.mode === 'agent' && session.messages.length > 0) {
        setAgentSidebarOpen(true);
        setAgentSidebarView('result');
    }

    // 显示消息容器
    welcomeScreen.style.display = 'none';
    messagesContainer.classList.add('active');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 重新绑定线下律师服务按钮的事件监听器
function rebindLawyerServiceButtons() {
    const lawyerBtns = document.querySelectorAll('.offline-lawyer-btn');
    lawyerBtns.forEach(btn => {
        // 移除旧的事件监听器（通过克隆节点）
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        // 添加新的事件监听器
        newBtn.addEventListener('click', () => {
            showLawyerServiceModal();
        });
    });
}

// 删除会话
function deleteSession(sessionId) {
    if (confirm('确定要删除这个对话吗？')) {
        allSessions = allSessions.filter(s => s.id !== sessionId);
        saveSessions();
        
        // 如果删除的是当前会话，重置界面
        if (sessionId === currentSessionId) {
            currentSessionId = null;
            conversationHistory = [];
            messagesContainer.innerHTML = '';
            messagesContainer.classList.remove('active');
            welcomeScreen.style.display = 'flex';
        }
        
        // 立即更新历史记录列表和侧边栏
        renderHistoryList();
        renderChatHistory();
    }
}

// 设置按钮
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        openSettings();
    });
}

// 菜单按钮
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        showToast('菜单功能开发中...', 'info');
    });
}

// 菜单按钮
if (menuBtn) {
    menuBtn.addEventListener('click', () => {
        toggleSidebar();
    });
}

// 打开/关闭侧边栏
function toggleSidebar() {
    sidebar.classList.toggle('active');
    sidebarOverlay.classList.toggle('active');

    // 添加/移除主容器、header、三角形容器和底部版权信息的滑动类
    const container = document.querySelector('.container');
    const header = document.querySelector('.header');
    const triangleContainer = document.querySelector('.triangle-split-container');
    const footer = document.querySelector('.site-footer');

    if (sidebar.classList.contains('active')) {
        container.classList.add('sidebar-open');
        header.classList.add('sidebar-open');
        if (triangleContainer) {
            triangleContainer.classList.add('sidebar-open');
        }
        if (footer) {
            footer.classList.add('sidebar-open');
        }
    } else {
        container.classList.remove('sidebar-open');
        header.classList.remove('sidebar-open');
        if (triangleContainer) {
            triangleContainer.classList.remove('sidebar-open');
        }
        if (footer) {
            footer.classList.remove('sidebar-open');
        }
    }
}

// 点击遮罩层关闭侧边栏
if (sidebarOverlay) {
    sidebarOverlay.addEventListener('click', toggleSidebar);
}

// 新对话按钮
if (newChatBtn) {
    newChatBtn.addEventListener('click', () => {
        currentSessionId = null;
        conversationHistory = [];
        messagesContainer.innerHTML = '';
        messagesContainer.classList.remove('active');
        welcomeScreen.style.display = 'flex';
        messageInput.value = '';
        messageInput.style.height = 'auto';
        toggleSidebar();
        renderChatHistory();
    });
}

// 演示流程按钮（主页面左下角）
const demoFlowSlider = document.getElementById('demoFlowSlider');
const demoFlowBtn = document.getElementById('demoFlowBtn');
const demoFlowCount = document.getElementById('demoFlowCount');
const demoFlowBtnText = document.getElementById('demoFlowBtnText');

function runDemoFlow() {
    updateDemoFlowCount();

    if (demoFlowClickCount === 1) {
        startDemoFlowStep1();
    } else if (demoFlowClickCount === 2) {
        startDemoFlowStep2();
    } else if (demoFlowClickCount === 3) {
        startDemoFlowStep3();
    } else if (demoFlowClickCount === 4) {
        startDemoFlowStep4();
    } else if (demoFlowClickCount === 5) {
        startDemoFlowStep5();
    } else if (demoFlowClickCount === 6) {
        startDemoFlowStep6();
    }
}

if (demoFlowSlider && demoFlowBtn) {
    let demoSlideStartX = 0;
    let demoSlideDeltaX = 0;
    let demoSlideActive = false;
    const demoSlideThreshold = 74;

    const resetDemoSlider = () => {
        demoSlideActive = false;
        demoSlideDeltaX = 0;
        demoFlowBtn.style.transform = '';
        demoFlowSlider.classList.remove('sliding');
    };

    const startDemoSlide = (clientX) => {
        demoSlideActive = true;
        demoSlideStartX = clientX;
        demoSlideDeltaX = 0;
        demoFlowSlider.classList.add('sliding');
    };

    const moveDemoSlide = (clientX) => {
        if (!demoSlideActive) return;
        demoSlideDeltaX = Math.max(0, Math.min(clientX - demoSlideStartX, 96));
        demoFlowBtn.style.transform = `translateX(${demoSlideDeltaX}px)`;
    };

    const endDemoSlide = () => {
        if (!demoSlideActive) return;

        const shouldTrigger = demoSlideDeltaX >= demoSlideThreshold;
        resetDemoSlider();

        if (shouldTrigger) {
            demoFlowSlider.classList.add('triggered');
            runDemoFlow();
            setTimeout(() => demoFlowSlider.classList.remove('triggered'), 260);
        }
    };

    demoFlowBtn.addEventListener('pointerdown', (event) => {
        event.preventDefault();
        demoFlowBtn.setPointerCapture(event.pointerId);
        startDemoSlide(event.clientX);
    });

    demoFlowBtn.addEventListener('pointermove', (event) => {
        moveDemoSlide(event.clientX);
    });

    demoFlowBtn.addEventListener('pointerup', endDemoSlide);
    demoFlowBtn.addEventListener('pointercancel', resetDemoSlider);
    demoFlowBtn.addEventListener('lostpointercapture', endDemoSlide);

    demoFlowSlider.addEventListener('keydown', (event) => {
        if (event.key !== 'ArrowRight' && event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        runDemoFlow();
    });
}


// 演示流程控制
let demoFlowStep = 0;
let demoFlowClickCount = 0;

// 更新展示按钮触发次数
function updateDemoFlowCount() {
    demoFlowClickCount = demoFlowClickCount % 6 + 1;

    if (demoFlowCount) {
        demoFlowCount.textContent = demoFlowClickCount;
        demoFlowCount.style.display = 'inline-flex';
    }
}

function startDemoFlowStep1() {
    console.log('演示流程 - 第一步');
    demoFlowStep = 1;

    // 第一步：确保在快速思考模式
    if (!fastModeBtn.classList.contains('active')) {
        fastModeBtn.click();
    }

    // 自动点击测试按钮（生成随机问题）
    if (randomQuestionBtn) {
        randomQuestionBtn.click();
    }

    // 延迟500ms后自动发送消息
    setTimeout(() => {
        if (sendBtn && messageInput.value.trim()) {
            sendBtn.click();
        }
    }, 500);

    // 延迟1秒后打开模式介绍界面
    setTimeout(() => {
        openModeIntroModal();
    }, 1000);
}

function startDemoFlowStep2() {
    console.log('演示流程 - 第二步');
    demoFlowStep = 2;

    // 关闭模式介绍界面
    closeModeIntroModal();

    // 延迟300ms后打开法律智能体服务界面
    setTimeout(() => {
        openAgentServiceModal();
    }, 300);
}

function startDemoFlowStep3() {
    console.log('演示流程 - 第三步');
    demoFlowStep = 3;

    // 自动点击"付费使用"按钮，进入法律智能体模式
    const agentServiceConfirm = document.getElementById('agentServiceConfirm');
    if (agentServiceConfirm) {
        agentServiceConfirm.click();
    }

    // 延迟1200ms后点击测试按钮（等待模式切换完成和动画结束）
    setTimeout(() => {
        // 确保已经切换到法律智能体模式
        if (currentMode !== 'agent') {
            console.log('模式切换未完成，等待中...');
            return;
        }

        if (randomQuestionBtn) {
            randomQuestionBtn.click();
            console.log('已点击测试按钮生成问题');
        }

        // 再延迟1000ms后自动点击发送按钮（增加延迟确保输入框已填充）
        setTimeout(() => {
            const sendButton = document.getElementById('sendBtn');
            const inputValue = messageInput.value.trim();

            console.log('准备发送消息，输入框内容：', inputValue);

            if (sendButton && inputValue && !sendButton.disabled) {
                console.log('自动发送问题给法律智能体');
                sendButton.click();
            } else {
                console.log('发送条件不满足：', {
                    hasSendButton: !!sendButton,
                    hasInput: !!inputValue,
                    isDisabled: sendButton ? sendButton.disabled : 'N/A'
                });
            }
        }, 1000);
    }, 1200);
}

function startDemoFlowStep4() {
    console.log('演示流程 - 第四步：跳转到律师审核页面（功能已移除）');
    demoFlowStep = 4;

    // 律师审核功能已移除，演示流程结束
    console.log('律师审核功能已移除，演示流程结束');
    demoFlowStep = 0;
    localStorage.removeItem('demo_flow_step');

    // 显示提示
    showToast('演示流程已完成', 'success');
}

function startDemoFlowStep5() {
    console.log('演示流程 - 第五步：滚动到线下律师服务按钮');
    demoFlowStep = 5;

    // 更新展示按钮计数为5
    demoFlowClickCount = 5;
    if (demoFlowCount) {
        demoFlowCount.textContent = '5';
        demoFlowCount.style.display = 'inline-flex';
    }

    // 找到最后一条AI消息中的线下律师服务按钮
    const aiMessages = document.querySelectorAll('.message.ai');
    if (aiMessages.length > 0) {
        const lastAiMessage = aiMessages[aiMessages.length - 1];
        const offlineLawyerBtn = lastAiMessage.querySelector('.offline-lawyer-btn');

        if (offlineLawyerBtn) {
            console.log('找到线下律师服务按钮，开始滚动');
            // 滚动到按钮位置
            offlineLawyerBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.log('未找到线下律师服务按钮');
        }
    } else {
        console.log('未找到AI消息');
    }
}

function startDemoFlowStep6() {
    console.log('演示流程 - 第六步：自动点击线下律师服务按钮');
    demoFlowStep = 6;

    // 找到最后一条AI消息中的线下律师服务按钮
    const aiMessages = document.querySelectorAll('.message.ai');
    if (aiMessages.length > 0) {
        const lastAiMessage = aiMessages[aiMessages.length - 1];
        const offlineLawyerBtn = lastAiMessage.querySelector('.offline-lawyer-btn');

        if (offlineLawyerBtn) {
            console.log('找到线下律师服务按钮，自动点击');
            offlineLawyerBtn.click();

            // 延迟等待弹窗出现后自动点击提交按钮
            setTimeout(() => {
                const submitBtn = document.querySelector('.lawyer-modal .btn-modal-primary');
                if (submitBtn) {
                    console.log('找到提交按钮，自动点击');
                    submitBtn.click();

                    // 律师审核功能已移除，演示流程结束
                    setTimeout(() => {
                        console.log('律师审核功能已移除，演示流程结束');
                        demoFlowStep = 0;
                        localStorage.removeItem('demo_flow_step');
                        showToast('演示流程已完成', 'success');
                    }, 1000);
                }
            }, 500);
        } else {
            console.log('未找到线下律师服务按钮');
        }
    } else {
        console.log('未找到AI消息');
    }
}

// 侧边栏登录按钮
if (sidebarLoginBtn) {
    sidebarLoginBtn.addEventListener('click', () => {
        showLoginModal();
        toggleSidebar();
    });
}

// 显示登录弹窗
function showLoginModal() {
    // 检查是否已登录
    const currentUser = JSON.parse(localStorage.getItem('meibao_current_user') || 'null');
    if (currentUser) {
        // 已登录，显示退出确认
        if (confirm(`当前登录用户：${currentUser.username}\n\n是否退出登录？`)) {
            localStorage.removeItem('meibao_current_user');
            updateLoginButton();
            showToast('已退出登录', 'success');
        }
        return;
    }
    
    // 未登录，显示登录弹窗
    if (document.querySelector('.lawyer-modal')) return;
    
    const modal = document.createElement('div');
    modal.className = 'lawyer-modal';
    modal.innerHTML = `
        <div class="lawyer-modal-overlay"></div>
        <div class="lawyer-modal-content">
            <button class="lawyer-modal-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="lawyer-modal-header">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>
                <h2>用户登录</h2>
                <p>请填写您的信息进行登录</p>
            </div>
            <div class="lawyer-modal-body">
                <form class="login-form" id="loginForm">
                    <div class="form-field">
                        <label for="username">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                                <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                            用户名
                        </label>
                        <input type="text" id="username" name="username" value="马爱雯" placeholder="请输入您的姓名" required>
                    </div>
                    <div class="form-field">
                        <label for="phone">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
                            </svg>
                            电话号码
                        </label>
                        <input type="tel" id="phone" name="phone" value="13722185344" placeholder="请输入您的手机号码" pattern="[0-9]{11}" required>
                    </div>
                    <div class="form-field">
                        <label for="wechat">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"></path>
                            </svg>
                            微信号
                        </label>
                        <input type="text" id="wechat" name="wechat" value="13722185344" placeholder="请输入您的微信号" required>
                    </div>
                </form>
            </div>
            <div class="lawyer-modal-footer">
                <button class="btn-modal-secondary" type="button">取消</button>
                <button class="btn-modal-primary" type="submit">登录</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    const closeBtn = modal.querySelector('.lawyer-modal-close');
    const overlay = modal.querySelector('.lawyer-modal-overlay');
    const secondaryBtn = modal.querySelector('.btn-modal-secondary');
    const primaryBtn = modal.querySelector('.btn-modal-primary');
    const form = modal.querySelector('#loginForm');
    
    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    secondaryBtn.addEventListener('click', closeModal);
    
    primaryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const phone = document.getElementById('phone').value.trim();
        const wechat = document.getElementById('wechat').value.trim();
        
        if (!username) {
            alert('请输入用户名');
            return;
        }
        
        if (!phone) {
            alert('请输入电话号码');
            return;
        }
        
        if (!/^1[3-9]\d{9}$/.test(phone)) {
            alert('请输入正确的手机号码');
            return;
        }
        
        if (!wechat) {
            alert('请输入微信号');
            return;
        }
        
        const userInfo = {
            username: username,
            phone: phone,
            wechat: wechat,
            loginTime: Date.now()
        };
        
        localStorage.setItem('meibao_current_user', JSON.stringify(userInfo));
        updateLoginButton();
        showToast('登录成功！', 'success');
        closeModal();
    });
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        primaryBtn.click();
    });
}

// 更新登录按钮显示
function updateLoginButton() {
    const currentUser = JSON.parse(localStorage.getItem('meibao_current_user') || 'null');
    const loginBtn = document.getElementById('sidebarLoginBtn');
    
    if (!loginBtn) return;
    
    if (currentUser) {
        loginBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <span>${currentUser.username}</span>
        `;
    } else {
        loginBtn.innerHTML = `
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"></path>
                <polyline points="10 17 15 12 10 7"></polyline>
                <line x1="15" y1="12" x2="3" y2="12"></line>
            </svg>
            <span>登录</span>
        `;
    }
}

// 设置按钮
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        openSettings();
    });
}

// 打开设置弹窗
function openSettings(defaultTab = 'general') {
    if (settingsModal) {
        switchSettingsTab(defaultTab);
        settingsModal.classList.add('active');
    }
}

// 切换设置标签
function switchSettingsTab(targetTab) {
    settingsTabs.forEach(t => t.classList.remove('active'));
    settingsPanels.forEach(p => p.classList.remove('active'));

    const activeTab = document.querySelector(`.settings-tab[data-tab="${targetTab}"]`);
    const targetPanel = document.getElementById(targetTab + 'Panel');

    if (activeTab) {
        activeTab.classList.add('active');
    }

    if (targetPanel) {
        targetPanel.classList.add('active');
    }
}

// 关闭设置弹窗
function closeSettings() {
    if (settingsModal) {
        settingsModal.classList.remove('active');
    }
}

// 设置关闭按钮
if (settingsClose) {
    settingsClose.addEventListener('click', closeSettings);
}

// 点击弹窗外部关闭
if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettings();
        }
    });
}

// 设置标签切换
const settingsTabs = document.querySelectorAll('.settings-tab');
const settingsPanels = document.querySelectorAll('.settings-panel');

settingsTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        switchSettingsTab(targetTab);
    });
});

// 主题切换
const themeOptions = document.querySelectorAll('.theme-option');

themeOptions.forEach(option => {
    option.addEventListener('click', () => {
        const theme = option.dataset.theme;
        
        // 移除所有active类
        themeOptions.forEach(o => o.classList.remove('active'));
        option.classList.add('active');
        
        // 应用主题
        applyTheme(theme);
        
        // 保存主题设置
        localStorage.setItem('theme', theme);
    });
});

// 应用主题
function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark-theme');
    } else if (theme === 'light') {
        document.body.classList.remove('dark-theme');
    } else if (theme === 'auto') {
        // 跟随系统
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark-theme');
        } else {
            document.body.classList.remove('dark-theme');
        }
    }
}

// 加载保存的主题
function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // 设置active状态
    themeOptions.forEach(option => {
        if (option.dataset.theme === savedTheme) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // 应用主题
    applyTheme(savedTheme);
}

// 监听系统主题变化
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'auto') {
        applyTheme('auto');
    }
});

// 语言翻译映射
const translations = {
    'zh-CN': {
        title: '塞上法桥',
        subtitle: '宁夏大学法学专业 · 你的温柔法律助手',
        agentBeta: '智能体测试版',
        newChat: '新对话',
        login: '登录',
        settings: '系统设置',
        general: '通用设置',
        account: '账号管理',
        data: '数据管理',
        about: '服务协议',
        theme: '主题',
        light: '浅色',
        dark: '深色',
        auto: '跟随系统',
        language: '语言',
        fastMode: '快速回答',
        deepMode: '深度思考',
        agentMode: '法律智能体',
        placeholder: '有什么法律问题想问我吗？～',
        agentPlaceholder: '请尽可能的细致描述您的法律问题',
        historyTitle: '历史对话',
        noHistory: '暂无历史对话'
    },
    'en-US': {
        title: 'Smart Meibao',
        subtitle: 'Ningxia University Law · Your Gentle Legal Assistant',
        agentBeta: 'Agent Beta',
        newChat: 'New Chat',
        login: 'Login',
        settings: 'Settings',
        general: 'General',
        account: 'Account',
        data: 'Data',
        about: 'About',
        theme: 'Theme',
        light: 'Light',
        dark: 'Dark',
        auto: 'Auto',
        language: 'Language',
        fastMode: 'Fast Answer',
        deepMode: 'Deep Thinking',
        agentMode: 'Legal Agent',
        placeholder: 'What legal questions do you have?',
        agentPlaceholder: 'Please describe your legal issue in detail',
        historyTitle: 'Chat History',
        noHistory: 'No chat history'
    }
};

// 应用语言
function applyLanguage(lang) {
    const t = translations[lang] || translations['zh-CN'];
    
    // 更新页面标题
    document.title = t.title + ' - AI对话助手';
    
    // 更新主标题
    const titleElement = document.querySelector('.title');
    if (titleElement) titleElement.textContent = t.title;
    
    // 更新副标题
    const subtitleElement = document.querySelector('.subtitle');
    if (subtitleElement) subtitleElement.textContent = t.subtitle;
    
    // 更新智能体测试版
    const agentBetaElement = document.querySelector('.agent-beta');
    if (agentBetaElement) agentBetaElement.textContent = t.agentBeta;
    
    // 更新新对话按钮
    const newChatBtnText = document.querySelector('.new-chat-btn span');
    if (newChatBtnText) newChatBtnText.textContent = t.newChat;
    
    // 更新登录按钮（如果未登录）
    const currentUser = JSON.parse(localStorage.getItem('meibao_current_user') || 'null');
    if (!currentUser) {
        const loginBtnText = document.querySelector('#sidebarLoginBtn span');
        if (loginBtnText) loginBtnText.textContent = t.login;
    }
    
    // 更新设置弹窗标题
    const settingsTitle = document.querySelector('.settings-header h2');
    if (settingsTitle) settingsTitle.textContent = t.settings;
    
    // 更新设置标签
    const settingsTabs = document.querySelectorAll('.settings-tab span');
    if (settingsTabs[0]) settingsTabs[0].textContent = t.general;
    if (settingsTabs[1]) settingsTabs[1].textContent = t.account;
    if (settingsTabs[2]) settingsTabs[2].textContent = t.data;
    if (settingsTabs[3]) settingsTabs[3].textContent = t.about;
    
    // 更新主题选项
    const themeTitle = document.querySelector('#generalPanel .settings-section-title');
    if (themeTitle) themeTitle.textContent = t.theme;
    
    const themeOptions = document.querySelectorAll('.theme-option span');
    if (themeOptions[0]) themeOptions[0].textContent = t.light;
    if (themeOptions[1]) themeOptions[1].textContent = t.dark;
    if (themeOptions[2]) themeOptions[2].textContent = t.auto;
    
    // 更新语言标题
    const languageTitle = document.querySelectorAll('.settings-section-title')[1];
    if (languageTitle) languageTitle.textContent = t.language;
    
    // 更新模式按钮
    const fastModeBtnText = document.querySelector('#fastModeBtn span');
    if (fastModeBtnText) fastModeBtnText.textContent = t.fastMode;
    
    const deepModeBtnText = document.querySelector('#deepModeBtn span');
    if (deepModeBtnText) deepModeBtnText.textContent = t.deepMode;
    
    const agentModeBtnText = document.querySelector('#legalAgentBtn span');
    if (agentModeBtnText) agentModeBtnText.textContent = t.agentMode;
    
    // 更新输入框占位符
    if (messageInput) {
        if (currentMode === 'agent') {
            messageInput.placeholder = t.agentPlaceholder;
        } else {
            messageInput.placeholder = t.placeholder;
        }
    }
}

// 语言切换
if (languageSelect) {
    languageSelect.addEventListener('change', (e) => {
        const language = e.target.value;
        localStorage.setItem('language', language);
        applyLanguage(language);
        showToast('语言设置已保存', 'success');
    });
}

// 加载保存的语言
function loadLanguage() {
    const savedLanguage = localStorage.getItem('language') || 'zh-CN';
    if (languageSelect) {
        languageSelect.value = savedLanguage;
    }
    applyLanguage(savedLanguage);
}

// 渲染聊天历史列表
function renderChatHistory() {
    if (!chatHistory) return;
    
    chatHistory.innerHTML = '';
    
    // 根据当前模式过滤会话
    const filteredSessions = allSessions.filter(session => {
        // 如果是法律智能体模式，只显示法律智能体的对话
        if (currentMode === 'agent') {
            return session.mode === 'agent';
        }
        // 如果是其他模式，只显示非法律智能体的对话
        return session.mode !== 'agent';
    });
    
    if (filteredSessions.length === 0) {
        chatHistory.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px;">暂无历史对话</div>';
        return;
    }
    
    filteredSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'chat-history-item';
        if (session.id === currentSessionId) {
            item.classList.add('active');
        }
        
        const date = new Date(session.timestamp);
        const timeStr = formatTime(date);
        
        item.innerHTML = `
            <div class="chat-history-title">${session.title}</div>
            <div class="chat-history-time">${timeStr}</div>
        `;
        
        item.addEventListener('click', () => {
            loadSession(session.id);
            toggleSidebar();
        });
        
        // 添加删除按钮
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'chat-history-delete';
        deleteBtn.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
            </svg>
        `;
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSession(session.id);
        });
        
        item.appendChild(deleteBtn);
        chatHistory.appendChild(item);
    });
}

// 格式化时间
function formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    
    return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 模式切换
fastModeBtn.addEventListener('click', () => {
    activateFastMode();
});

deepModeBtn.addEventListener('click', () => {
    activateDeepMode();
});

legalAgentBtn.addEventListener('click', () => {
    openAgentServiceModal();
});

// 综合建议按钮点击事件
if (comprehensiveAdviceBtn) {
    comprehensiveAdviceBtn.addEventListener('click', () => {
        switchAgentMode('comprehensive');
    });
}

// 法律依据按钮点击事件
if (legalBasisBtn) {
    legalBasisBtn.addEventListener('click', () => {
        switchAgentMode('legal-basis');
    });
}

// 应对策略按钮点击事件
if (strategyBtn) {
    strategyBtn.addEventListener('click', () => {
        switchAgentMode('strategy');
    });
}

// 风险提示按钮点击事件
if (riskBtn) {
    riskBtn.addEventListener('click', () => {
        switchAgentMode('risk');
    });
}

// 参考案例按钮点击事件
if (caseBtn) {
    caseBtn.addEventListener('click', () => {
        switchAgentMode('case');
    });
}

// 法律文书按钮点击事件
if (documentBtn) {
    documentBtn.addEventListener('click', () => {
        switchAgentMode('document');
    });
}

// 切换智能体子模式
function switchAgentMode(mode) {
    console.log(`[switchAgentMode] 从 ${agentActionMode} 切换到 ${mode}`);

    // 保存当前子模式的完整状态
    if (currentMode === 'agent' && agentActionMode) {
        snapshotAgentMode(agentActionMode);
        console.log(`[switchAgentMode] 已保存模式 ${agentActionMode} 的快照`);
    }

    // 切换到新模式（不中断后台正在生成的内容）
    agentActionMode = mode;

    // 更新按钮激活状态
    allAgentActionBtns.forEach(btn => btn && btn.classList.remove('active'));
    const btnMap = {
        'comprehensive': comprehensiveAdviceBtn,
        'legal-basis': legalBasisBtn,
        'strategy': strategyBtn,
        'risk': riskBtn,
        'case': caseBtn,
        'document': documentBtn
    };
    const targetBtn = btnMap[mode];
    if (targetBtn) {
        targetBtn.classList.add('active');
    }

    // 同步侧边栏大纲按钮
    const sectionMap = {
        'comprehensive': 'analysis',
        'legal-basis': 'basis',
        'strategy': 'strategy',
        'risk': 'risk',
        'case': 'case',
        'document': 'document'
    };
    setActiveResultSection(sectionMap[mode]);

    // 恢复该子模式的独立会话和消息快照
    // 后台流仍会继续写入自己的快照，不影响当前视图
    restoreAgentMode(mode);

    // 如果切换到的模式正在后台生成，显示生成中的提示
    if (agentModeStreams[mode] && agentModeStreams[mode].active) {
        console.log(`[switchAgentMode] 模式 ${mode} 正在后台生成`);
        showBackgroundGenerationIndicator(mode);
    }
}

// 渲染当前智能体子模式的消息
function renderAgentModeMessages() {
    messagesContainer.innerHTML = '';

    if (conversationHistory.length === 0) {
        // 如果没有对话历史，显示欢迎屏幕
        welcomeScreen.style.display = 'flex';
        messagesContainer.classList.remove('active');
    } else {
        // 显示对话历史
        welcomeScreen.style.display = 'none';
        messagesContainer.classList.add('active');

        // 重新渲染所有消息
        conversationHistory.forEach(msg => {
            addMessage(msg.content, msg.role === 'user' ? 'user' : 'ai');
        });
    }
}

function snapshotAgentMode(mode = agentActionMode) {
    if (!mode || !agentModeMessagesHTML.hasOwnProperty(mode)) return;
    agentModeSessionIds[mode] = currentSessionId;
    agentModeHistories[mode] = [...conversationHistory];
    if (currentMode === 'agent' && agentActionMode === mode) {
        agentModeMessagesHTML[mode] = messagesContainer.innerHTML;
    }
}

function syncVisibleAgentModeSnapshot() {
    if (currentMode === 'agent') {
        snapshotAgentMode(agentActionMode);
    }
}

function syncAgentStreamMessage(mode, messageElement) {
    if (!mode || !messageElement) return;

    console.log(`[syncAgentStreamMessage] 同步模式: ${mode}, 当前模式: ${agentActionMode}, 元素在DOM中: ${messageElement.isConnected}`);

    // 如果当前正在显示该模式且元素在DOM中，直接同步整个容器
    if (currentMode === 'agent' && agentActionMode === mode && messageElement.isConnected) {
        agentModeMessagesHTML[mode] = messagesContainer.innerHTML;
        console.log(`[syncAgentStreamMessage] 直接同步整个容器到模式: ${mode}`);
        return;
    }

    // 否则，需要更新快照中的消息元素
    const wrapper = document.createElement('div');
    wrapper.innerHTML = agentModeMessagesHTML[mode] || '';
    const messageId = messageElement.dataset.agentMessageId;
    const storedMessage = messageId ? wrapper.querySelector(`[data-agent-message-id="${messageId}"]`) : null;

    if (storedMessage) {
        // 更新已存在的消息元素
        storedMessage.innerHTML = messageElement.innerHTML;
        Array.from(messageElement.attributes).forEach(attr => {
            storedMessage.setAttribute(attr.name, attr.value);
        });
        // 清除 lastRenderedMessage 标记，确保下次切换回来时会重新渲染
        delete storedMessage.dataset.lastRenderedMessage;
        console.log(`[syncAgentStreamMessage] 更新快照中的消息元素, 模式: ${mode}, messageId: ${messageId}`);
    } else {
        // 添加新的消息元素
        const clonedElement = messageElement.cloneNode(true);
        // 清除克隆元素的 lastRenderedMessage 标记
        delete clonedElement.dataset.lastRenderedMessage;
        wrapper.appendChild(clonedElement);
        console.log(`[syncAgentStreamMessage] 添加新消息元素到快照, 模式: ${mode}, messageId: ${messageId}`);
    }

    agentModeMessagesHTML[mode] = wrapper.innerHTML;
    console.log(`[syncAgentStreamMessage] 快照已更新, 模式: ${mode}, 快照长度: ${agentModeMessagesHTML[mode].length}`);
}

function findOrCreateAgentStreamMessage(mode, existingElement) {
    // 如果元素已经在DOM中，直接返回
    if (existingElement && existingElement.isConnected) return existingElement;

    const messageId = existingElement?.dataset?.agentMessageId || agentModeStreams[mode]?.messageId;

    // 如果当前正在显示该模式，尝试从可见的DOM中找到消息元素
    if (currentMode === 'agent' && agentActionMode === mode && messageId) {
        const visibleMessage = messagesContainer.querySelector(`[data-agent-message-id="${messageId}"]`);
        if (visibleMessage) {
            // 清除 lastRenderedMessage 标记，确保能够更新
            delete visibleMessage.dataset.lastRenderedMessage;
            return visibleMessage;
        }
    }

    // 从快照中查找消息元素
    const wrapper = document.createElement('div');
    wrapper.innerHTML = agentModeMessagesHTML[mode] || '';
    const storedMessage = messageId ? wrapper.querySelector(`[data-agent-message-id="${messageId}"]`) : null;
    if (storedMessage) {
        // 清除 lastRenderedMessage 标记
        delete storedMessage.dataset.lastRenderedMessage;
        return storedMessage;
    }

    // 如果都找不到，返回原始元素
    if (existingElement) {
        delete existingElement.dataset.lastRenderedMessage;
    }
    return existingElement;
}

function appendAgentMessageHTML(mode, element) {
    if (!mode || !element) return;

    if (currentMode === 'agent' && agentActionMode === mode) {
        messagesContainer.appendChild(element);
        agentModeMessagesHTML[mode] = messagesContainer.innerHTML;
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = agentModeMessagesHTML[mode] || '';
    wrapper.appendChild(element);
    agentModeMessagesHTML[mode] = wrapper.innerHTML;
}

function restoreAgentMode(mode) {
    console.log(`[restoreAgentMode] 恢复模式: ${mode}, 快照长度: ${(agentModeMessagesHTML[mode] || '').length}`);

    currentSessionId = agentModeSessionIds[mode];
    conversationHistory = [...(agentModeHistories[mode] || [])];
    messagesContainer.innerHTML = agentModeMessagesHTML[mode] || '';

    console.log(`[restoreAgentMode] 恢复后的HTML: ${messagesContainer.innerHTML.substring(0, 200)}...`);

    // 清除所有消息元素的 lastRenderedMessage 标记，强制重新渲染
    const allMessages = messagesContainer.querySelectorAll('.message');
    allMessages.forEach(msg => {
        delete msg.dataset.lastRenderedMessage;
    });

    console.log(`[restoreAgentMode] 清除了 ${allMessages.length} 个消息的渲染标记`);

    if (messagesContainer.innerHTML.trim()) {
        welcomeScreen.style.display = 'none';
        messagesContainer.classList.add('active');
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        setTimeout(() => { if (typeof rebindLawyerServiceButtons === 'function') rebindLawyerServiceButtons(); }, 0);
    } else {
        welcomeScreen.style.display = 'flex';
        messagesContainer.classList.remove('active');
    }
}

// 显示后台生成指示器
function showBackgroundGenerationIndicator(mode) {
    const modeNames = {
        'comprehensive': '综合建议',
        'legal-basis': '法律依据',
        'strategy': '应对策略',
        'risk': '风险提示',
        'case': '参考案例',
        'document': '法律文书'
    };

    const indicator = document.createElement('div');
    indicator.className = 'background-generation-indicator';
    indicator.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
        </svg>
        <span>${modeNames[mode] || mode}正在后台生成中...</span>
    `;

    // 检查是否已存在指示器
    const existingIndicator = messagesContainer.querySelector('.background-generation-indicator');
    if (existingIndicator) {
        existingIndicator.remove();
    }

    messagesContainer.insertBefore(indicator, messagesContainer.firstChild);

    // 3秒后自动消失
    setTimeout(() => {
        if (indicator.parentElement) {
            indicator.classList.add('fade-out');
            setTimeout(() => indicator.remove(), 300);
        }
    }, 3000);
}

// 监听审核状态变化
function startReviewStatusMonitoring(conversationId) {
    // 每2秒检查一次审核状态
    const checkInterval = setInterval(() => {
        const reviews = JSON.parse(localStorage.getItem('meibao_reviews') || '[]');
        const review = reviews.find(r => r.conversationId === conversationId);

        if (review) {
            // 找到对应的审核状态元素并更新
            const reviewStatusElement = document.querySelector(`.review-status[data-conversation-id="${conversationId}"]`);
            if (reviewStatusElement) {
                updateReviewStatusDisplay(reviewStatusElement, review.result);
                clearInterval(checkInterval); // 停止监听
            }
        }
    }, 2000);

    // 30秒后停止监听（避免无限监听）
    setTimeout(() => clearInterval(checkInterval), 30000);
}

// 执行智能体子模式生成任务（后台异步执行）
async function executeAgentModeGeneration(requestMode, message, aiMessageElement, renderContext) {
    let streamMessageElement = aiMessageElement;
    const runWithSyncedMessage = async (runner) => {
        const syncElement = findOrCreateAgentStreamMessage(requestMode, streamMessageElement);
        streamMessageElement = syncElement;
        return runner(syncElement);
    };

    // 启动进度模拟
    let progressValue = 0;
    const progressInterval = setInterval(() => {
        if (progressValue < 90) {
            progressValue += Math.random() * 10;
            progressValue = Math.min(90, progressValue);
            updateAgentOutlineProgress(requestMode, progressValue);
        }
    }, 500);

    try {
        let resultText = '';
        if (requestMode === 'comprehensive') {
            // 综合建议模式：调用 DeepSeek 主模型
            resultText = await runWithSyncedMessage((el) => callAIStream(message, el));
            // 保存对话供律师审核
            if (resultText) {
                saveConversationForReview(message, resultText);
            }
        } else if (requestMode === 'legal-basis') {
            resultText = await runWithSyncedMessage((el) => streamLegalBasisFromDeli(message, el, renderContext, requestMode));
        } else if (requestMode === 'strategy') {
            resultText = await runWithSyncedMessage((el) => streamLegalStrategyFromZhipu(message, el, renderContext, requestMode));
        } else if (requestMode === 'document') {
            resultText = await runWithSyncedMessage((el) => generateLegalDocumentStream(message, el, renderContext, requestMode));
        } else if (requestMode === 'risk') {
            resultText = await runWithSyncedMessage((el) => analyzeRiskWithQwen(message, el, renderContext, requestMode));
        } else if (requestMode === 'case') {
            resultText = await runWithSyncedMessage((el) => streamLegalCasesFromMetaso(message, el, renderContext, requestMode));
        } else {
            resultText = '该功能即将上线，敬请期待...';
            updateMessageContent(streamMessageElement, resultText, renderContext);
        }

        const nextHistory = [...(agentModeHistories[requestMode] || []), { role: 'assistant', content: resultText }];
        agentModeHistories[requestMode] = nextHistory;
        if (currentMode === 'agent' && agentActionMode === requestMode) {
            conversationHistory = [...nextHistory];
        }
        syncAgentStreamMessage(requestMode, streamMessageElement);
        if (currentMode === 'agent' && agentActionMode === requestMode) {
            saveCurrentSession();
        }
    } catch (error) {
        console.error('法律智能体子功能执行失败:', error);
        const errMsg = String(error?.message || '未知错误');
        let hint = '';
        let troubleshooting = '';

        if (errMsg.includes('401') || errMsg.includes('403')) {
            hint = '\n\n❌ 可能原因：API Key 无效或权限不足';
            troubleshooting = '\n\n🔧 解决方法：\n1. 检查对应功能的 API 配置\n2. 确认接口权限与调用额度';
        } else if (errMsg.includes('Failed to fetch') || errMsg.includes('NetworkError') || errMsg.includes('CORS')) {
            hint = '\n\n❌ 可能原因：浏览器跨域限制（CORS）';
            troubleshooting = '\n\n🔧 解决方法：\n1. 检查网络连接\n2. 使用后端代理调用接口\n3. 使用本地服务器运行前端';
        } else if (errMsg.includes('429')) {
            hint = '\n\n❌ 可能原因：API调用频率超限';
            troubleshooting = '\n\n🔧 解决方法：\n1. 等待1-2分钟后重试\n2. 减少请求频率';
        } else if (errMsg.includes('500') || errMsg.includes('502') || errMsg.includes('503')) {
            hint = '\n\n❌ 可能原因：服务暂时不可用';
            troubleshooting = '\n\n🔧 解决方法：\n1. 稍后重试\n2. 检查服务状态';
        } else {
            troubleshooting = '\n\n🔧 调试建议：\n1. 打开浏览器开发者工具（F12）\n2. 查看 Console 标签的详细错误信息\n3. 查看 Network 标签的请求详情';
        }

        const errorText = `❌ 功能执行失败\n\n错误信息：${errMsg}${hint}${troubleshooting}\n\n💡 提示：您可以尝试使用"综合建议"模式获取法律咨询。`;
        updateMessageContent(streamMessageElement, errorText, renderContext);
        syncAgentStreamMessage(requestMode, streamMessageElement);
    } finally {
        // 清除进度模拟定时器
        clearInterval(progressInterval);

        agentModeStreams[requestMode].active = false;
        syncAgentStreamMessage(requestMode, streamMessageElement);
        if (activeAgentStreamMode === requestMode) activeAgentStreamMode = 'comprehensive';

        // 更新侧边栏进度条为100%
        updateAgentOutlineProgress(requestMode, 100);

        // 如果是综合建议模式完成，显示"结果"按钮
        if (requestMode === 'comprehensive') {
            const agentViewResultBtn = document.getElementById('agentViewResultBtn');
            if (agentViewResultBtn) {
                agentViewResultBtn.style.display = 'flex';
            }
        }
    }
}

// 更新智能体侧边栏大纲进度条
function updateAgentOutlineProgress(mode, progress) {
    const modeMap = {
        'comprehensive': 'analysis',
        'legal-basis': 'basis',
        'strategy': 'strategy',
        'risk': 'risk',
        'case': 'case',
        'document': 'document'
    };

    const target = modeMap[mode];
    if (!target) return;

    const outlineItem = document.querySelector(`.agent-outline-item[data-target="${target}"]`);
    if (!outlineItem) return;

    const progressBar = outlineItem.querySelector('.agent-outline-progress-bar');
    if (!progressBar) return;

    // 更新进度条宽度
    progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    progressBar.setAttribute('data-progress', progress);
}

// 更新审核状态显示
function updateReviewStatusDisplay(element, status) {
    element.className = 'review-status';
    
    if (status === 'approved') {
        element.classList.add('approved');
        element.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>律师已审核</span>
        `;
    } else if (status === 'rejected') {
        element.classList.add('rejected');
        element.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
            </svg>
            <span>未通过审核</span>
        `;
    } else if (status === 'needsRevision') {
        element.classList.add('needs-revision');
        element.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M12 16v-4M12 8h.01"></path>
            </svg>
            <span>需要修改</span>
        `;
    }
}

// 页面加载时检查所有未审核的对话
function checkAllReviewStatuses() {
    const reviewStatusElements = document.querySelectorAll('.review-status.pending');
    const reviews = JSON.parse(localStorage.getItem('meibao_reviews') || '[]');
    
    reviewStatusElements.forEach(element => {
        const conversationId = element.getAttribute('data-conversation-id');
        if (conversationId) {
            const review = reviews.find(r => r.conversationId === conversationId);
            if (review) {
                updateReviewStatusDisplay(element, review.result);
            }
        }
    });
}

// 更新被律师修改过的答案
function updateModifiedAnswers() {
    const conversations = JSON.parse(localStorage.getItem('meibao_conversations') || '[]');
    const reviewStatusElements = document.querySelectorAll('.review-status[data-conversation-id]');
    
    reviewStatusElements.forEach(statusElement => {
        const conversationId = statusElement.getAttribute('data-conversation-id');
        if (!conversationId) return;
        
        // 查找对应的对话数据
        const conversation = conversations.find(c => c.id === conversationId);
        if (!conversation) return;
        
        // 检查是否被律师修改过
        if (!conversation.modifiedByLawyer) {
            return; // 没有被修改过，跳过
        }
        
        // 查找对应的消息元素
        const messageElement = statusElement.closest('.message.ai');
        if (!messageElement) return;
        
        // 检查是否已经更新过（使用 lastModified 时间戳）
        const lastUpdate = messageElement.getAttribute('data-last-update');
        if (lastUpdate && lastUpdate === conversation.lastModified.toString()) {
            return; // 已经是最新版本，无需更新
        }
        
        // 更新答案内容
        if (currentMode === 'agent') {
            // 法律智能体模式：更新最终答案部分
            const answerContent = messageElement.querySelector('.answer-content');
            if (answerContent) {
                // 处理答案内容，确保显示格式正确
                let displayAnswer = conversation.answer;
                
                // 如果答案包含【塞上法桥综合建议】标记，只显示该部分
                if (displayAnswer.includes('【塞上法桥综合建议】')) {
                    const suggestionIndex = displayAnswer.indexOf('【塞上法桥综合建议】');
                    displayAnswer = displayAnswer.substring(suggestionIndex).trim();
                }
                
                answerContent.innerHTML = displayAnswer.replace(/\n/g, '<br>');
                
                // 添加修改提示（只添加一次）
                if (!messageElement.querySelector('.modified-badge')) {
                    const modifiedBadge = document.createElement('div');
                    modifiedBadge.className = 'modified-badge';
                    modifiedBadge.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>律师已修改</span>
                    `;
                    messageElement.appendChild(modifiedBadge);
                }
            }
        } else {
            // 其他模式：更新整个消息文本
            const messageText = messageElement.querySelector('.message-text');
            if (messageText) {
                messageText.innerHTML = conversation.answer.replace(/\n/g, '<br>');
                
                // 添加修改提示（只添加一次）
                if (!messageElement.querySelector('.modified-badge')) {
                    const modifiedBadge = document.createElement('div');
                    modifiedBadge.className = 'modified-badge';
                    modifiedBadge.innerHTML = `
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span>律师已修改</span>
                    `;
                    messageElement.appendChild(modifiedBadge);
                }
            }
        }
        
        // 标记为已更新（使用 lastModified 时间戳）
        messageElement.setAttribute('data-last-update', conversation.lastModified.toString());
        
        // 显示更新通知（只在第一次更新时显示）
        if (!lastUpdate) {
            showUpdateNotification();
        }
    });
}

// 显示更新通知
function showUpdateNotification() {
    // 避免重复显示通知
    if (document.querySelector('.update-notification')) return;
    
    const notification = document.createElement('div');
    notification.className = 'update-notification';
    notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"></polyline>
            <polyline points="1 20 1 14 7 14"></polyline>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"></path>
        </svg>
        <span>答案已更新为律师修改版本</span>
    `;
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 检查已批准的请求
function checkApprovedRequests() {
    const userRequests = JSON.parse(localStorage.getItem('meibao_user_requests') || '[]');
    
    // 查找所有已批准的请求
    const approvedRequests = userRequests.filter(req => req.status === 'approved' && req.conversationId);
    
    approvedRequests.forEach(request => {
        // 查找对应的消息元素
        const messageElements = document.querySelectorAll('.message.ai');
        
        messageElements.forEach(messageElement => {
            const reviewStatus = messageElement.querySelector('.review-status');
            if (!reviewStatus) return;
            
            const conversationId = reviewStatus.getAttribute('data-conversation-id');
            if (conversationId !== request.conversationId) return;
            
            // 检查是否已经更新过
            if (messageElement.getAttribute('data-lawyer-assigned') === 'true') return;
            
            // 更新"已提交线下服务请求"标记为"已为您申请律师"
            const serviceRequestedBadge = messageElement.querySelector('.service-requested-badge');
            if (serviceRequestedBadge) {
                serviceRequestedBadge.className = 'lawyer-assigned-badge';
                serviceRequestedBadge.innerHTML = `
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                    <span>已为您申请律师</span>
                `;
            }
            
            // 显示律师信息卡片
            if (!messageElement.querySelector('.lawyer-info-card') && request.lawyerInfo) {
                const lawyerCard = document.createElement('div');
                lawyerCard.className = 'lawyer-info-card';
                lawyerCard.innerHTML = `
                    <div class="lawyer-card-header">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"></path>
                            <circle cx="9" cy="7" r="4"></circle>
                            <path d="M23 21v-2a4 4 0 00-3-3.87"></path>
                            <path d="M16 3.13a4 4 0 010 7.75"></path>
                        </svg>
                        <span>为您分配的律师</span>
                    </div>
                    <div class="lawyer-card-body">
                        <div class="lawyer-card-row">
                            <span class="lawyer-card-label">律师姓名：</span>
                            <span class="lawyer-card-value">${request.lawyerInfo.name}</span>
                        </div>
                        <div class="lawyer-card-row">
                            <span class="lawyer-card-label">专业领域：</span>
                            <span class="lawyer-card-value">${request.lawyerInfo.specialization}</span>
                        </div>
                        <div class="lawyer-card-row">
                            <span class="lawyer-card-label">从业时间：</span>
                            <span class="lawyer-card-value">${formatPracticeYears(request.lawyerInfo.practiceYears)}</span>
                        </div>
                        <div class="lawyer-card-row">
                            <span class="lawyer-card-label">联系电话：</span>
                            <span class="lawyer-card-value">${request.lawyerInfo.phone}</span>
                        </div>
                        <div class="lawyer-card-row">
                            <span class="lawyer-card-label">微信号：</span>
                            <span class="lawyer-card-value">${request.lawyerInfo.wechat}</span>
                        </div>
                    </div>
                    <div class="lawyer-card-footer">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                        <span>请通过以上联系方式与律师取得联系</span>
                    </div>
                `;
                messageElement.appendChild(lawyerCard);
                
                // 标记为已更新
                messageElement.setAttribute('data-lawyer-assigned', 'true');
                
                // 显示通知
                showLawyerAssignedNotification(request.lawyerInfo.name);
            }
        });
    });
}

// 格式化从业年限
function formatPracticeYears(years) {
    const yearsMap = {
        '0-1': '1年以下',
        '1-3': '1-3年',
        '3-5': '3-5年',
        '5-10': '5-10年',
        '10+': '10年以上'
    };
    return yearsMap[years] || years;
}

// 显示律师分配通知
function showLawyerAssignedNotification(lawyerName) {
    // 避免重复显示通知
    if (document.querySelector('.lawyer-assigned-notification')) return;
    
    const notification = document.createElement('div');
    notification.className = 'lawyer-assigned-notification';
    notification.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>已为您分配律师 <strong>${lawyerName}</strong>，请查看联系方式</span>
    `;
    document.body.appendChild(notification);
    
    // 3秒后自动消失
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    messageInput.focus();
    setupEntryWelcome();
    setupAgreementModals();
    setupModeIntroModal();
    initializeAgentResultInteractions();

    // 加载历史会话
    loadSessions();

    // 渲染聊天历史列表
    renderChatHistory();

    // 加载主题设置
    loadTheme();

    // 加载语言设置
    loadLanguage();

    // 更新登录按钮显示
    updateLoginButton();

    // 检查现有消息的审核状态
    checkAllReviewStatuses();

    // 检查是否需要恢复到之前的模式
    const returnMode = localStorage.getItem('saishangfaqiao_return_mode');
    const returnSessionId = localStorage.getItem('saishangfaqiao_return_session');

    if (returnMode && returnSessionId) {
        // 清除保存的模式
        localStorage.removeItem('saishangfaqiao_return_mode');
        localStorage.removeItem('saishangfaqiao_return_session');

        // 先恢复会话内容
        const session = allSessions.find(s => s.id === returnSessionId);
        if (session) {
            currentSessionId = returnSessionId;
            currentMode = returnMode; // 直接设置模式，不调用activate函数
            conversationHistory = [...session.conversationHistory];

            // 更新模式按钮状态
            fastModeBtn.classList.remove('active');
            deepModeBtn.classList.remove('active');
            legalAgentBtn.classList.remove('active');

            if (returnMode === 'agent') {
                legalAgentBtn.classList.add('active');
                document.body.classList.add('agent-mode');
            } else if (returnMode === 'deep') {
                deepModeBtn.classList.add('active');
                document.body.classList.remove('agent-mode');
            } else {
                fastModeBtn.classList.add('active');
                document.body.classList.remove('agent-mode');
            }

            // 更新输入框占位符
            const currentLang = localStorage.getItem('language') || 'zh-CN';
            const t = translations[currentLang] || translations['zh-CN'];
            if (returnMode === 'agent') {
                messageInput.placeholder = t.agentPlaceholder;
            } else {
                messageInput.placeholder = t.placeholder;
            }

            // 清空并重新渲染消息
            messagesContainer.innerHTML = '';
            session.messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${msg.type}`;

                // 优先使用完整的HTML结构（新版本）
                if (msg.fullHTML) {
                    messageDiv.innerHTML = msg.fullHTML;
                } else {
                    // 兼容旧版本：使用 message-text
                    const textDiv = document.createElement('div');
                    textDiv.className = 'message-text';
                    textDiv.innerHTML = msg.content || '';
                    messageDiv.appendChild(textDiv);
                }

                messagesContainer.appendChild(messageDiv);
            });

            // 重新绑定线下律师服务按钮的事件监听器
            rebindLawyerServiceButtons();

            // 显示消息容器
            welcomeScreen.style.display = 'none';
            messagesContainer.classList.add('active');
            messagesContainer.scrollTop = messagesContainer.scrollHeight;

        // 如果是agent模式，恢复侧边栏状态
            if (returnMode === 'agent' && session.messages.length > 0) {
                setAgentSidebarOpen(true);
                setAgentSidebarView('result');
            }

            checkAllReviewStatuses();
            updateModifiedAnswers();
            checkApprovedRequests();

            const shouldRunStep5 = localStorage.getItem('demo_flow_step5');
            if (shouldRunStep5 === 'true') {
                localStorage.removeItem('demo_flow_step5');
                setTimeout(() => {
                    startDemoFlowStep5();
                }, 700);
            }

            const shouldScrollToBottom = localStorage.getItem('demo_flow_scroll_to_bottom');
            if (shouldScrollToBottom === 'true') {
                localStorage.removeItem('demo_flow_scroll_to_bottom');
                setTimeout(() => {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }, 700);
            }
        }
    } else {
        const shouldRunStep5 = localStorage.getItem('demo_flow_step5');
        if (shouldRunStep5 === 'true') {
            localStorage.removeItem('demo_flow_step5');
            setTimeout(() => {
                startDemoFlowStep5();
            }, 1000);
        }

        const shouldScrollToBottom = localStorage.getItem('demo_flow_scroll_to_bottom');
        if (shouldScrollToBottom === 'true') {
            localStorage.removeItem('demo_flow_scroll_to_bottom');
            setTimeout(() => {
                console.log('第六步返回首页 - 滚动到最底部');
                if (messagesContainer) {
                    messagesContainer.scrollTop = messagesContainer.scrollHeight;
                }
            }, 1000);
        }
    }

    // 监听 localStorage 变化（用于跨标签页同步）
    window.addEventListener('storage', (e) => {
        if (e.key === 'meibao_reviews') {
            checkAllReviewStatuses();
        }
        // 监听对话数据变化，更新答案内容
        if (e.key === 'meibao_conversations') {
            updateModifiedAnswers();
        }
        // 监听用户请求变化，更新律师信息
        if (e.key === 'meibao_user_requests') {
            checkApprovedRequests();
        }
    });

    // 定期检查对话是否被修改（用于同一标签页内的更新）
    setInterval(() => {
        checkAllReviewStatuses();
        updateModifiedAnswers();
        checkApprovedRequests();
    }, 2000);

    // 页面加载时检查已批准的请求
    checkApprovedRequests();

    // ==================== 移动端交互增强初始化 ====================
    initMobileEnhancements();
});

// ========== 显示演示流程弹窗 ==========
function showDemoFlowModal() {
    // 检查是否已存在弹窗
    if (document.querySelector('.demo-flow-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'demo-flow-modal';
    modal.innerHTML = `
        <div class="demo-flow-overlay"></div>
        <div class="demo-flow-content">
            <button class="demo-flow-close">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <div class="demo-flow-header">
                <div class="demo-flow-icon">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="10 8 16 12 10 16"></polyline>
                    </svg>
                </div>
                <h2>塞上法桥演示流程</h2>
                <p>完整的AI法律服务流程展示</p>
            </div>
            <div class="demo-flow-body">
                <div class="demo-flow-step">
                    <div class="demo-step-number">1</div>
                    <div class="demo-step-content">
                        <h3>用户提问</h3>
                        <p>用户在主页输入法律问题，选择快速回答、深度思考或法律智能体模式</p>
                    </div>
                </div>
                <div class="demo-flow-arrow">↓</div>
                <div class="demo-flow-step">
                    <div class="demo-step-number">2</div>
                    <div class="demo-step-content">
                        <h3>AI生成答案</h3>
                        <p>系统调用AI模型（智谱GLM-4或DeepSeek）生成法律建议</p>
                    </div>
                </div>
                <div class="demo-flow-arrow">↓</div>
                <div class="demo-flow-step">
                    <div class="demo-step-number">3</div>
                    <div class="demo-step-content">
                        <h3>律师审核</h3>
                        <p>律师在审核系统中查看AI答案，可以修改并通过审核</p>
                    </div>
                </div>
                <div class="demo-flow-arrow">↓</div>
                <div class="demo-flow-step">
                    <div class="demo-step-number">4</div>
                    <div class="demo-step-content">
                        <h3>用户查看结果</h3>
                        <p>用户看到经过律师审核的专业法律建议，可申请线下服务</p>
                    </div>
                </div>
            </div>
            <div class="demo-flow-footer">
                <button class="btn-demo-close">我知道了</button>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    // 添加动画
    setTimeout(() => modal.classList.add('show'), 10);

    // 绑定关闭事件
    const closeBtn = modal.querySelector('.demo-flow-close');
    const overlay = modal.querySelector('.demo-flow-overlay');
    const confirmBtn = modal.querySelector('.btn-demo-close');

    const closeModal = () => {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };

    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', closeModal);
    confirmBtn.addEventListener('click', closeModal);
}

// ==================== 批量操作功能 ====================

// 批量操作状态
let batchMode = false;
let selectedSessions = new Set();

// 获取批量操作相关元素
const batchManageBtn = document.getElementById('batchManageBtn');
const batchActionsBar = document.getElementById('batchActionsBar');
const selectAllBtn = document.getElementById('selectAllBtn');
const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
const cancelBatchBtn = document.getElementById('cancelBatchBtn');

// 进入批量管理模式
function enterBatchMode() {
    batchMode = true;
    selectedSessions.clear();

    // 显示批量操作栏
    if (batchActionsBar) {
        batchActionsBar.style.display = 'flex';
    }

    // 重新渲染历史列表，添加复选框
    renderChatHistoryWithCheckbox();
}

// 退出批量管理模式
function exitBatchMode() {
    batchMode = false;
    selectedSessions.clear();

    // 隐藏批量操作栏
    if (batchActionsBar) {
        batchActionsBar.style.display = 'none';
    }

    // 恢复正常的历史列表
    renderChatHistory();
}

// 渲染带复选框的聊天历史列表
function renderChatHistoryWithCheckbox() {
    if (!chatHistory) return;

    chatHistory.innerHTML = '';

    // 根据当前模式过滤会话
    const filteredSessions = allSessions.filter(session => {
        if (currentMode === 'agent') {
            return session.mode === 'agent';
        }
        return session.mode !== 'agent';
    });

    if (filteredSessions.length === 0) {
        chatHistory.innerHTML = '<div style="padding: 20px; text-align: center; color: var(--text-secondary); font-size: 14px;">暂无历史对话</div>';
        return;
    }

    filteredSessions.forEach(session => {
        const item = document.createElement('div');
        item.className = 'chat-history-item batch-mode';
        if (session.id === currentSessionId) {
            item.classList.add('active');
        }

        const date = new Date(session.timestamp);
        const timeStr = formatTime(date);

        // 添加复选框
        const checkbox = document.createElement('div');
        checkbox.className = 'chat-history-checkbox';
        if (selectedSessions.has(session.id)) {
            checkbox.classList.add('checked');
        }
        checkbox.innerHTML = `
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
        `;

        checkbox.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSessionSelection(session.id);
        });

        item.innerHTML = `
            <div class="chat-history-title">${session.title}</div>
            <div class="chat-history-time">${timeStr}</div>
        `;

        item.insertBefore(checkbox, item.firstChild);

        // 点击项目时切换选中状态
        item.addEventListener('click', () => {
            toggleSessionSelection(session.id);
        });

        chatHistory.appendChild(item);
    });

    updateSelectAllButton();
}

// 切换会话选中状态
function toggleSessionSelection(sessionId) {
    if (selectedSessions.has(sessionId)) {
        selectedSessions.delete(sessionId);
    } else {
        selectedSessions.add(sessionId);
    }

    // 更新复选框状态
    const items = chatHistory.querySelectorAll('.chat-history-item');
    items.forEach(item => {
        const checkbox = item.querySelector('.chat-history-checkbox');
        const title = item.querySelector('.chat-history-title').textContent;
        const session = allSessions.find(s => s.title === title);

        if (session && selectedSessions.has(session.id)) {
            checkbox.classList.add('checked');
        } else {
            checkbox.classList.remove('checked');
        }
    });

    updateSelectAllButton();
}

// 全选/取消全选
function toggleSelectAll() {
    const filteredSessions = allSessions.filter(session => {
        if (currentMode === 'agent') {
            return session.mode === 'agent';
        }
        return session.mode !== 'agent';
    });

    if (selectedSessions.size === filteredSessions.length) {
        // 当前已全选，则取消全选
        selectedSessions.clear();
    } else {
        // 否则全选
        selectedSessions.clear();
        filteredSessions.forEach(session => {
            selectedSessions.add(session.id);
        });
    }

    renderChatHistoryWithCheckbox();
}

// 更新全选按钮文本
function updateSelectAllButton() {
    if (!selectAllBtn) return;

    const filteredSessions = allSessions.filter(session => {
        if (currentMode === 'agent') {
            return session.mode === 'agent';
        }
        return session.mode !== 'agent';
    });

    const btnText = selectAllBtn.querySelector('span');
    if (selectedSessions.size === filteredSessions.length && filteredSessions.length > 0) {
        btnText.textContent = '取消全选';
    } else {
        btnText.textContent = '全选';
    }
}

// 删除选中的会话
function deleteSelectedSessions() {
    if (selectedSessions.size === 0) {
        alert('请先选择要删除的对话');
        return;
    }

    const count = selectedSessions.size;
    if (!confirm(`确定要删除选中的 ${count} 个对话吗？此操作不可恢复。`)) {
        return;
    }

    // 删除选中的会话
    selectedSessions.forEach(sessionId => {
        const index = allSessions.findIndex(s => s.id === sessionId);
        if (index !== -1) {
            allSessions.splice(index, 1);
        }

        // 如果删除的是当前会话，清空当前会话
        if (sessionId === currentSessionId) {
            currentSessionId = null;
            conversationHistory = [];
            messagesContainer.innerHTML = '';
            welcomeScreen.style.display = 'flex';
        }
    });

    // 保存到本地存储
    saveSessions();

    // 清空选中状态
    selectedSessions.clear();

    // 重新渲染
    renderChatHistoryWithCheckbox();

    alert(`已成功删除 ${count} 个对话`);
}

// 绑定批量管理按钮事件
if (batchManageBtn) {
    batchManageBtn.addEventListener('click', () => {
        if (!batchMode) {
            enterBatchMode();
        } else {
            exitBatchMode();
        }
    });
}

// 绑定全选按钮事件
if (selectAllBtn) {
    selectAllBtn.addEventListener('click', toggleSelectAll);
}

// 绑定删除选中按钮事件
if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', deleteSelectedSessions);
}

// 绑定取消按钮事件
if (cancelBatchBtn) {
    cancelBatchBtn.addEventListener('click', exitBatchMode);
}

// ==================== 移动端交互增强 ====================

/**
 * 移动端交互增强主入口
 * 在 DOMContentLoaded 事件末尾调用，初始化所有移动端交互功能
 */
function initMobileEnhancements() {
    // 检测是否为移动设备（屏幕宽度 <= 768px 或存在触摸支持）
    const isMobile = window.innerWidth <= 768 || 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    if (isMobile) {
        console.log('[移动端增强] 初始化移动端交互功能');

        // 初始化侧边栏滑动手势
        initSidebarSwipeGestures();

        // 初始化智能体侧边栏手势
        initAgentSidebarSwipeGestures();

        // 初始化触摸反馈
        initTouchFeedback();

        // 初始化下拉刷新
        initPullToRefresh();

        // 初始化虚拟键盘处理
        initVirtualKeyboardHandler();

        // 初始化双击回顶部
        initDoubleTapToTop();

        // 防止 iOS 橡皮筋滚动和点击延迟
        preventIOSIssues();
    }

    // 以下功能在桌面端和移动端都启用

    // 初始化滚动性能优化
    initScrollPerformance();

    // 初始化 resize 防抖
    initResizeDebounce();

    // 初始化模态框动画增强
    initModalAnimationEnhancement();

    // 初始化平滑滚动
    initSmoothScroll();

    // 初始化网络状态监听
    initNetworkStatusListener();

    // 初始化页面可见性监听
    initVisibilityChangeListener();

    console.log('[移动端增强] 交互增强初始化完成');
}

// ==================== 1. 移动端触摸手势支持 ====================

/**
 * 侧边栏滑动手势初始化
 * - 从屏幕左边缘向右滑动打开侧边栏
 * - 在侧边栏区域向右滑动关闭侧边栏
 * - 点击遮罩层关闭侧边栏
 */
function initSidebarSwipeGestures() {
    let touchStartX = 0;
    let touchStartY = 0;
    let touchCurrentX = 0;
    let isSwipingSidebar = false;
    const EDGE_THRESHOLD = 30; // 边缘触发阈值（像素）
    const SWIPE_THRESHOLD = 80; // 滑动触发阈值（像素）

    // 监听 touchstart 事件（捕获阶段，确保优先处理）
    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        touchCurrentX = touch.clientX;
        isSwipingSidebar = false;

        // 从屏幕左边缘开始触摸，且侧边栏未打开
        if (touchStartX <= EDGE_THRESHOLD && !sidebar.classList.contains('active')) {
            isSwipingSidebar = true;
        }

        // 在侧边栏区域内开始触摸，且侧边栏已打开
        if (sidebar.classList.contains('active') && touchStartX <= sidebar.offsetWidth) {
            isSwipingSidebar = true;
        }
    }, { passive: true });

    // 监听 touchmove 事件
    document.addEventListener('touchmove', (e) => {
        if (!isSwipingSidebar) return;

        const touch = e.touches[0];
        touchCurrentX = touch.clientX;
        const deltaX = touchCurrentX - touchStartX;
        const deltaY = touch.clientY - touchStartY;

        // 如果垂直滑动距离大于水平滑动距离，取消侧边栏手势
        if (Math.abs(deltaY) > Math.abs(deltaX) * 1.5) {
            isSwipingSidebar = false;
            return;
        }

        // 阻止默认行为（防止页面滚动）
        if (Math.abs(deltaX) > 10 && sidebar.classList.contains('active')) {
            // 只有在侧边栏打开时才阻止默认行为
        }
    }, { passive: true });

    // 监听 touchend 事件
    document.addEventListener('touchend', (e) => {
        if (!isSwipingSidebar) return;

        const deltaX = touchCurrentX - touchStartX;

        // 从左边缘向右滑动打开侧边栏
        if (deltaX > SWIPE_THRESHOLD && touchStartX <= EDGE_THRESHOLD && !sidebar.classList.contains('active')) {
            toggleSidebar();
        }

        // 在侧边栏内向左滑动关闭侧边栏
        if (deltaX < -SWIPE_THRESHOLD && sidebar.classList.contains('active') && touchStartX <= sidebar.offsetWidth) {
            toggleSidebar();
        }

        isSwipingSidebar = false;
    }, { passive: true });

    // 点击遮罩层关闭侧边栏（已在原有代码中实现，此处作为冗余保护）
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('touchstart', (e) => {
            if (sidebar.classList.contains('active')) {
                e.preventDefault();
                toggleSidebar();
            }
        }, { passive: false });
    }
}

/**
 * 智能体侧边栏滑动手势初始化
 * - 从屏幕右边缘向左滑动打开智能体侧边栏（在智能体模式下）
 * - 在智能体侧边栏内向右滑动关闭侧边栏
 */
function initAgentSidebarSwipeGestures() {
    let touchStartX = 0;
    let touchCurrentX = 0;
    let isSwipingAgentSidebar = false;
    const EDGE_THRESHOLD = 30; // 边缘触发阈值
    const SWIPE_THRESHOLD = 80; // 滑动触发阈值

    document.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchCurrentX = touch.clientX;
        isSwipingAgentSidebar = false;

        const screenWidth = window.innerWidth;

        // 从屏幕右边缘开始触摸，且智能体侧边栏未打开，当前在智能体模式
        if (touchStartX >= screenWidth - EDGE_THRESHOLD && !agentSidebarOpened && currentMode === 'agent') {
            isSwipingAgentSidebar = true;
        }

        // 在智能体侧边栏区域内开始触摸，且侧边栏已打开
        if (agentSidebarOpened && touchStartX >= screenWidth - agentRightSidebar.offsetWidth) {
            isSwipingAgentSidebar = true;
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (!isSwipingAgentSidebar) return;
        const touch = e.touches[0];
        touchCurrentX = touch.clientX;
    }, { passive: true });

    document.addEventListener('touchend', (e) => {
        if (!isSwipingAgentSidebar) return;

        const deltaX = touchCurrentX - touchStartX;
        const screenWidth = window.innerWidth;

        // 从右边缘向左滑动打开智能体侧边栏
        if (deltaX < -SWIPE_THRESHOLD && touchStartX >= screenWidth - EDGE_THRESHOLD && !agentSidebarOpened && currentMode === 'agent') {
            setAgentSidebarOpen(true);
        }

        // 在智能体侧边栏内向右滑动关闭侧边栏
        if (deltaX > SWIPE_THRESHOLD && agentSidebarOpened && touchStartX >= screenWidth - agentRightSidebar.offsetWidth) {
            setAgentSidebarOpen(false);
        }

        isSwipingAgentSidebar = false;
    }, { passive: true });
}

/**
 * 下拉刷新初始化
 * 在历史记录等列表中支持下拉刷新
 */
function initPullToRefresh() {
    let pullStartY = 0;
    let pullCurrentY = 0;
    let isPulling = false;
    const PULL_THRESHOLD = 100; // 下拉触发阈值

    // 为可滚动容器添加下拉刷新支持
    const scrollableContainers = document.querySelectorAll('.chat-history, #chatHistory, .history-list');

    scrollableContainers.forEach(container => {
        container.addEventListener('touchstart', (e) => {
            const touch = e.touches[0];
            pullStartY = touch.clientY;
            pullCurrentY = touch.clientY;
            isPulling = container.scrollTop <= 0;
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!isPulling) return;

            const touch = e.touches[0];
            pullCurrentY = touch.clientY;
            const deltaY = pullCurrentY - pullStartY;

            // 只有向下拉时才触发
            if (deltaY > 0 && container.scrollTop <= 0) {
                // 添加阻力效果
                const resistance = 0.4;
                const translateY = deltaY * resistance;

                // 显示下拉指示器
                showPullIndicator(container, translateY, deltaY >= PULL_THRESHOLD);
            }
        }, { passive: true });

        container.addEventListener('touchend', (e) => {
            if (!isPulling) return;

            const deltaY = pullCurrentY - pullStartY;

            if (deltaY >= PULL_THRESHOLD && container.scrollTop <= 0) {
                // 触发刷新
                triggerRefresh(container);
            }

            // 隐藏下拉指示器
            hidePullIndicator(container);
            isPulling = false;
        }, { passive: true });
    });
}

/**
 * 显示下拉指示器
 */
function showPullIndicator(container, translateY, canRelease) {
    let indicator = container.querySelector('.pull-indicator');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.className = 'pull-indicator';
        indicator.style.cssText = `
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            background: var(--bg-tertiary, #f0f0f0);
            border-radius: 20px;
            font-size: 12px;
            color: var(--text-secondary, #666);
            pointer-events: none;
            z-index: 100;
            transition: opacity 0.2s ease;
            white-space: nowrap;
        `;
        container.style.position = 'relative';
        container.appendChild(indicator);
    }

    indicator.style.top = `${Math.min(translateY - 50, 20)}px`;
    indicator.style.opacity = '1';
    indicator.textContent = canRelease ? '松开刷新' : '下拉刷新';
    indicator.dataset.canRelease = canRelease ? 'true' : 'false';
}

/**
 * 隐藏下拉指示器
 */
function hidePullIndicator(container) {
    const indicator = container.querySelector('.pull-indicator');
    if (indicator) {
        indicator.style.opacity = '0';
        indicator.style.top = '-50px';
    }
}

/**
 * 触发刷新操作
 */
function triggerRefresh(container) {
    const indicator = container.querySelector('.pull-indicator');
    if (indicator) {
        indicator.textContent = '刷新中...';
    }

    // 刷新历史记录列表
    setTimeout(() => {
        renderChatHistory();
        hidePullIndicator(container);

        // 显示刷新成功提示
        showToast('已刷新', 'success');
    }, 500);
}

// ==================== 2. 移动端键盘处理 ====================

/**
 * 虚拟键盘处理初始化
 * - 检测虚拟键盘弹出（通过 window.visualViewport API）
 * - 调整输入框位置确保不被键盘遮挡
 * - 键盘弹出时自动滚动到消息底部
 * - iOS 输入框优化：防止页面滚动
 */
function initVirtualKeyboardHandler() {
    // 检查浏览器是否支持 visualViewport API
    if (!window.visualViewport) {
        console.log('[移动端增强] 浏览器不支持 visualViewport API，使用降级方案');
        initFallbackKeyboardHandler();
        return;
    }

    let lastViewportHeight = window.visualViewport.height;
    let isKeyboardOpen = false;

    // 监听 visualViewport 变化
    window.visualViewport.addEventListener('resize', throttle(() => {
        const currentHeight = window.visualViewport.height;
        const screenHeight = window.screen.height;
        const heightDiff = screenHeight - currentHeight;

        // 如果视口高度显著缩小，认为键盘弹出
        if (currentHeight < lastViewportHeight - 100 && !isKeyboardOpen) {
            isKeyboardOpen = true;
            handleKeyboardOpen(currentHeight);
        }
        // 如果视口高度恢复，认为键盘收起
        else if (currentHeight >= lastViewportHeight - 50 && isKeyboardOpen) {
            isKeyboardOpen = false;
            handleKeyboardClose();
        }

        lastViewportHeight = currentHeight;
    }, 100));

    // 监听滚动事件（iOS 键盘弹出时会滚动页面）
    window.visualViewport.addEventListener('scroll', throttle(() => {
        if (isKeyboardOpen) {
            // 调整输入框位置
            adjustInputPositionForKeyboard();
        }
    }, 100));
}

/**
 * 处理虚拟键盘弹出
 */
function handleKeyboardOpen(viewportHeight) {
    console.log('[移动端增强] 虚拟键盘弹出');

    // 滚动消息容器到底部
    if (messagesContainer) {
        setTimeout(() => {
            smoothScrollToBottom(messagesContainer);
        }, 300);
    }

    // 调整输入区域位置
    adjustInputPositionForKeyboard();

    // 添加键盘打开标记
    document.body.classList.add('keyboard-open');
}

/**
 * 处理虚拟键盘收起
 */
function handleKeyboardClose() {
    console.log('[移动端增强] 虚拟键盘收起');

    // 恢复输入区域位置
    const inputArea = document.querySelector('.input-area');
    if (inputArea) {
        inputArea.style.transform = '';
        inputArea.style.position = '';
        inputArea.style.bottom = '';
    }

    // 移除键盘打开标记
    document.body.classList.remove('keyboard-open');
}

/**
 * 调整输入框位置以适应键盘
 */
function adjustInputPositionForKeyboard() {
    if (!window.visualViewport) return;

    const inputArea = document.querySelector('.input-area');
    if (!inputArea) return;

    const viewportOffset = window.visualViewport.offsetTop || 0;
    const viewportHeight = window.visualViewport.height;
    const windowHeight = window.innerHeight;

    // 计算键盘高度
    const keyboardHeight = windowHeight - viewportHeight - viewportOffset;

    if (keyboardHeight > 100) {
        // 使用 fixed 定位确保输入框在键盘上方
        requestAnimationFrame(() => {
            inputArea.style.position = 'fixed';
            inputArea.style.bottom = `${keyboardHeight}px`;
            inputArea.style.left = '0';
            inputArea.style.right = '0';
            inputArea.style.zIndex = '1000';
        });
    }
}

/**
 * 降级键盘处理方案（用于不支持 visualViewport 的浏览器）
 */
function initFallbackKeyboardHandler() {
    let initialWindowHeight = window.innerHeight;

    window.addEventListener('resize', debounce(() => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialWindowHeight - currentHeight;

        if (heightDiff > 100) {
            // 键盘可能弹出
            document.body.classList.add('keyboard-open');
            if (messagesContainer) {
                setTimeout(() => {
                    smoothScrollToBottom(messagesContainer);
                }, 300);
            }
        } else if (heightDiff < -50) {
            // 键盘可能收起
            document.body.classList.remove('keyboard-open');
        }
    }, 200));
}

// ==================== 3. 性能优化 ====================

/**
 * 滚动性能优化
 * - 为滚动事件添加节流
 * - 使用 IntersectionObserver 替代 scroll 事件监听
 */
function initScrollPerformance() {
    // 使用 IntersectionObserver 监听消息可见性（替代频繁的 scroll 事件）
    if ('IntersectionObserver' in window && messagesContainer) {
        const messageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                // 消息进入或离开视口时的处理
                if (entry.isIntersecting) {
                    entry.target.classList.add('in-viewport');
                } else {
                    entry.target.classList.remove('in-viewport');
                }
            });
        }, {
            root: messagesContainer,
            threshold: 0.1
        });

        // 观察现有消息
        const observeMessages = () => {
            const messages = messagesContainer.querySelectorAll('.message');
            messages.forEach(msg => messageObserver.observe(msg));
        };

        // 初始观察
        observeMessages();

        // 使用 MutationObserver 监听新消息
        const mutationObserver = new MutationObserver(throttle((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1 && node.classList.contains('message')) {
                        messageObserver.observe(node);
                    }
                });
            });
        }, 100));

        mutationObserver.observe(messagesContainer, { childList: true });
    }

    // 为所有需要滚动节流的元素添加优化
    initThrottledScrollListeners();
}

/**
 * 节流处理的滚动监听器
 */
function initThrottledScrollListeners() {
    // 对侧边栏历史记录列表的滚动添加节流
    const sidebarHistory = document.getElementById('chatHistory');
    if (sidebarHistory) {
        sidebarHistory.addEventListener('scroll', throttle(() => {
            // 侧边栏滚动时的处理逻辑
            const isAtBottom = sidebarHistory.scrollHeight - sidebarHistory.scrollTop - sidebarHistory.clientHeight < 20;
            if (isAtBottom) {
                sidebarHistory.classList.add('scrolled-to-bottom');
            } else {
                sidebarHistory.classList.remove('scrolled-to-bottom');
            }
        }, 150));
    }
}

/**
 * resize 事件防抖初始化
 */
function initResizeDebounce() {
    window.addEventListener('resize', debounce(() => {
        // 重新计算移动端状态
        const isMobile = window.innerWidth <= 768;

        // 如果切换到桌面端，关闭移动端侧边栏
        if (!isMobile) {
            if (sidebar.classList.contains('active')) {
                toggleSidebar();
            }
            if (agentSidebarOpened) {
                setAgentSidebarOpen(false);
            }
        }

        // 调整消息容器滚动位置
        if (messagesContainer && messagesContainer.classList.contains('active')) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }, 250));
}

// ==================== 4. 移动端触摸反馈 ====================

/**
 * 触摸反馈初始化
 * - 为按钮添加触摸时的视觉反馈
 * - 防止 300ms 点击延迟
 */
function initTouchFeedback() {
    // 为所有按钮添加触摸反馈
    const buttons = document.querySelectorAll('button, .btn, .mode-btn, .agent-action-btn, .chat-history-item, .agent-outline-item');

    buttons.forEach(btn => {
        // touchstart 时添加按下效果
        btn.addEventListener('touchstart', () => {
            btn.classList.add('touch-active');
        }, { passive: true });

        // touchend 时移除按下效果
        btn.addEventListener('touchend', () => {
            btn.classList.remove('touch-active');
        }, { passive: true });

        // touchcancel 时移除按下效果
        btn.addEventListener('touchcancel', () => {
            btn.classList.remove('touch-active');
        }, { passive: true });
    });

    // 动态添加触摸反馈样式
    if (!document.getElementById('touch-feedback-styles')) {
        const style = document.createElement('style');
        style.id = 'touch-feedback-styles';
        style.textContent = `
            /* 触摸反馈样式 */
            .touch-active {
                opacity: 0.7 !important;
                transform: scale(0.97) !important;
                transition: opacity 0.1s ease, transform 0.1s ease !important;
            }

            /* 防止 300ms 点击延迟 */
            button, a, .btn, .mode-btn, .agent-action-btn,
            .chat-history-item, .agent-outline-item,
            .agent-result-tab, .agent-export-trigger {
                touch-action: manipulation;
                -webkit-tap-highlight-color: transparent;
            }

            /* 移动端滑动手势区域 */
            @media (max-width: 768px) {
                .sidebar {
                    touch-action: pan-y;
                }
                .agent-right-sidebar {
                    touch-action: pan-y;
                }
                .messages-container {
                    touch-action: pan-y;
                }
            }
        `;
        document.head.appendChild(style);
    }
}

/**
 * iOS 相关问题预防
 * - 防止橡皮筋滚动效果
 * - 防止双击缩放
 */
function preventIOSIssues() {
    // 防止 iOS 橡皮筋滚动（仅在消息容器滚动到底部时）
    if (messagesContainer) {
        messagesContainer.addEventListener('touchmove', (e) => {
            const isAtTop = messagesContainer.scrollTop <= 0;
            const isAtBottom = messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight <= 0;

            // 如果滚动到顶部或底部，阻止默认行为防止橡皮筋效果
            if ((isAtTop && e.touches[0].clientY > 0) || isAtBottom) {
                // 不阻止，允许正常滚动
            }
        }, { passive: true });
    }

    // 防止双击缩放
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
            e.preventDefault();
        }
        lastTouchEnd = now;
    }, { passive: false });
}

// ==================== 5. 流畅性优化 ====================

/**
 * 模态框动画增强
 * - 为模态框添加更流畅的打开/关闭动画
 */
function initModalAnimationEnhancement() {
    // 观察动态添加的模态框
    const modalObserver = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                if (node.nodeType === 1 && node.classList) {
                    // 为律师服务模态框添加流畅动画
                    if (node.classList.contains('lawyer-modal')) {
                        animateModalOpen(node);
                    }
                    // 为历史记录模态框添加流畅动画
                    if (node.classList.contains('history-modal')) {
                        animateModalOpen(node);
                    }
                    // 为演示流程模态框添加流畅动画
                    if (node.classList.contains('demo-flow-modal')) {
                        animateModalOpen(node);
                    }
                }
            });
        });
    });

    modalObserver.observe(document.body, { childList: true });
}

/**
 * 模态框打开动画
 */
function animateModalOpen(modal) {
    const overlay = modal.querySelector('.lawyer-modal-overlay, .history-modal-overlay, .demo-flow-overlay');
    const content = modal.querySelector('.lawyer-modal-content, .history-modal-content, .demo-flow-content');

    if (overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
            });
        });
    }

    if (content) {
        content.style.opacity = '0';
        content.style.transform = 'translateY(30px) scale(0.95)';
        content.style.transition = 'opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1), transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                content.style.opacity = '1';
                content.style.transform = 'translateY(0) scale(1)';
            });
        });
    }
}

/**
 * 平滑滚动初始化
 * - 优化消息滚动体验，使用平滑滚动
 */
function initSmoothScroll() {
    // 为消息容器添加平滑滚动样式
    if (messagesContainer) {
        messagesContainer.style.scrollBehavior = 'smooth';
    }

    // 为侧边栏历史记录添加平滑滚动
    const chatHistoryEl = document.getElementById('chatHistory');
    if (chatHistoryEl) {
        chatHistoryEl.style.scrollBehavior = 'smooth';
    }
}

/**
 * 平滑滚动到底部
 * @param {HTMLElement} element - 要滚动的元素
 */
function smoothScrollToBottom(element) {
    if (!element) return;

    requestAnimationFrame(() => {
        element.scrollTo({
            top: element.scrollHeight,
            behavior: 'smooth'
        });
    });
}

// ==================== 6. 其他功能完善 ====================

/**
 * 双击标题栏回到顶部功能
 */
function initDoubleTapToTop() {
    const header = document.querySelector('.header');
    if (!header) return;

    let lastTapTime = 0;
    let tapCount = 0;
    let tapTimeout = null;

    header.addEventListener('click', (e) => {
        // 只在点击标题区域时触发
        const title = e.target.closest('.title');
        if (!title) return;

        const now = Date.now();

        // 清除之前的定时器
        if (tapTimeout) {
            clearTimeout(tapTimeout);
        }

        tapCount++;

        if (tapCount === 1) {
            // 第一次点击，设置定时器
            tapTimeout = setTimeout(() => {
                tapCount = 0;
            }, 400);
        } else if (tapCount >= 2) {
            // 双击触发，滚动到顶部
            tapCount = 0;

            if (messagesContainer && messagesContainer.classList.contains('active')) {
                // 使用平滑滚动回到顶部
                messagesContainer.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });

                // 显示提示
                showToast('回到顶部', 'info');
            }
        }
    });
}

/**
 * 网络状态监听初始化
 * - 检测网络状态变化，网络断开时给出提示
 */
function initNetworkStatusListener() {
    // 检查初始网络状态
    if (!navigator.onLine) {
        showNetworkOfflineToast();
    }

    // 监听网络断开事件
    window.addEventListener('offline', () => {
        console.log('[移动端增强] 网络已断开');
        showNetworkOfflineToast();
    });

    // 监听网络恢复事件
    window.addEventListener('online', () => {
        console.log('[移动端增强] 网络已恢复');
        showNetworkOnlineToast();
    });
}

/**
 * 显示网络断开提示
 */
function showNetworkOfflineToast() {
    // 移除已有的网络提示
    const existingToast = document.querySelector('.network-offline-toast');
    if (existingToast) existingToast.remove();

    const toast = document.createElement('div');
    toast.className = 'network-offline-toast';
    toast.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        padding: 8px 16px;
        background: #ff6b6b;
        color: white;
        text-align: center;
        font-size: 14px;
        z-index: 10000;
        transition: transform 0.3s ease;
        transform: translateY(-100%);
    `;
    toast.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle; margin-right: 6px;">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M16.72 11.06A10.94 10.94 0 0119 12.55"></path>
            <path d="M5 12.55a10.94 10.94 0 011.5-1.49"></path>
            <path d="M10.71 5.05A16 16 0 0122.58 9"></path>
            <path d="M1.42 9a15.91 15.91 0 014.7-2.88"></path>
            <path d="M8.53 16.11a6 6 0 016.95 0"></path>
            <line x1="12" y1="20" x2="12.01" y2="20"></line>
        </svg>
        网络连接已断开，部分功能可能不可用
    `;
    document.body.appendChild(toast);

    // 使用 requestAnimationFrame 触发动画
    requestAnimationFrame(() => {
        toast.style.transform = 'translateY(0)';
    });
}

/**
 * 显示网络恢复提示
 */
function showNetworkOnlineToast() {
    // 移除网络断开提示
    const offlineToast = document.querySelector('.network-offline-toast');
    if (offlineToast) {
        offlineToast.style.transform = 'translateY(-100%)';
        setTimeout(() => offlineToast.remove(), 300);
    }

    showToast('网络连接已恢复', 'success');
}

/**
 * 页面可见性变化监听初始化
 * - 页面重新可见时检查更新
 */
function initVisibilityChangeListener() {
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('[移动端增强] 页面重新可见，检查更新');

            // 检查审核状态
            checkAllReviewStatuses();

            // 检查是否有律师修改的答案
            updateModifiedAnswers();

            // 检查已批准的请求
            checkApprovedRequests();

            // 刷新历史记录列表
            renderChatHistory();
        }
    });
}

// ==================== 工具函数 ====================

/**
 * 防抖函数
 * @param {Function} func - 要防抖的函数
 * @param {number} wait - 等待时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * 节流函数
 * @param {Function} func - 要节流的函数
 * @param {number} limit - 限制时间（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => {
                inThrottle = false;
            }, limit);
        }
    };
}
