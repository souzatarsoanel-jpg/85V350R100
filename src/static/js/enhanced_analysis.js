// ARQV30 Enhanced v2.0 - JavaScript Ultra-Robusto
// Sistema de Análise com Proteção Completa Contra Erros

// Configurações globais
const CONFIG = {
    API_BASE: '/api',
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    PROGRESS_UPDATE_INTERVAL: 1000,
    AUTO_SAVE_INTERVAL: 30000
};

// Estado global da aplicação
const AppState = {
    currentAnalysis: null,
    isProcessing: false,
    progressData: null,
    lastSaveTime: null,
    analysisHistory: [],
    loadInitialData: () => {
        // Implementar lógica de carregamento de dados iniciais aqui
        console.log('Carregando dados iniciais...');
    }
};

// Utilitários seguros
const SafeDOM = {
    get: (selector) => {
        try {
            const element = document.querySelector(selector);
            if (!element) {
                console.warn(`Elemento não encontrado: ${selector}`);
                return null;
            }
            return element;
        } catch (error) {
            console.error(`Erro ao buscar elemento ${selector}:`, error);
            return null;
        }
    },

    getAll: (selector) => {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.error(`Erro ao buscar elementos ${selector}:`, error);
            return [];
        }
    },

    setText: (selector, text) => {
        const element = SafeDOM.get(selector);
        if (element) {
            element.textContent = text || '';
        }
    },

    setHTML: (selector, html) => {
        const element = SafeDOM.get(selector);
        if (element) {
            element.innerHTML = html || '';
        }
    },

    getValue: (selector) => {
        const element = SafeDOM.get(selector);
        return element ? element.value : '';
    },

    setValue: (selector, value) => {
        const element = SafeDOM.get(selector);
        if (element) {
            element.value = value || '';
        }
    },

    addClass: (selector, className) => {
        const element = SafeDOM.get(selector);
        if (element && className) {
            element.classList.add(className);
        }
    },

    removeClass: (selector, className) => {
        const element = SafeDOM.get(selector);
        if (element && className) {
            element.classList.remove(className);
        }
    },

    toggleClass: (selector, className) => {
        const element = SafeDOM.get(selector);
        if (element && className) {
            element.classList.toggle(className);
        }
    },

    show: (selector) => {
        const element = SafeDOM.get(selector);
        if (element) {
            element.style.display = 'block';
        }
    },

    hide: (selector) => {
        const element = SafeDOM.get(selector);
        if (element) {
            element.style.display = 'none';
        }
    },

    setStyle: (selector, property, value) => {
        const element = SafeDOM.get(selector);
        if (element && element.style && property && value) {
            element.style[property] = value;
        }
    }
};

// Sistema de notificações robusto
const NotificationSystem = {
    container: null,

    init: () => {
        try {
            let container = SafeDOM.get('#notification-container');
            if (!container) {
                container = document.createElement('div');
                container.id = 'notification-container';
                container.className = 'notification-container';
                container.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 10000;
                    max-width: 400px;
                `;
                document.body.appendChild(container);
            }
            NotificationSystem.container = container;
        } catch (error) {
            console.error('Erro ao inicializar sistema de notificações:', error);
        }
    },

    show: (message, type = 'info', duration = 5000) => {
        try {
            if (!NotificationSystem.container) {
                NotificationSystem.init();
            }

            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.style.cssText = `
                background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
                color: white;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 4px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.2);
                animation: slideInRight 0.3s ease-out;
            `;

            notification.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
                </div>
            `;

            NotificationSystem.container.appendChild(notification);

            if (duration > 0) {
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, duration);
            }
        } catch (error) {
            console.error('Erro ao exibir notificação:', error);
            // Fallback para alert
            alert(message);
        }
    },

    success: (message) => NotificationSystem.show(message, 'success'),
    error: (message) => NotificationSystem.show(message, 'error'),
    info: (message) => NotificationSystem.show(message, 'info')
};

// Sistema de requisições com retry
const APIClient = {
    request: async (url, options = {}) => {
        for (let attempt = 1; attempt <= CONFIG.MAX_RETRIES; attempt++) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const data = await response.json();
                return data;

            } catch (error) {
                console.error(`Tentativa ${attempt} falhou:`, {
                    url: url,
                    attempt: attempt,
                    error: error.message
                });

                if (attempt < CONFIG.MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY * attempt));
                } else {
                    console.error(`❌ Todas as tentativas falharam para ${url}:`, error);
                    throw new Error(`Falha na comunicação com o servidor após ${CONFIG.MAX_RETRIES} tentativas: ${error.message}`);
                }
            }
        }
    },

    get: (url) => APIClient.request(url, { method: 'GET' }),
    post: (url, data) => APIClient.request(url, { 
        method: 'POST', 
        body: JSON.stringify(data) 
    }),
    delete: (url) => APIClient.request(url, { method: 'DELETE' })
};

// Sistema de progresso
const ProgressSystem = {
    isTracking: false,
    currentTaskId: null,

    init: () => {
        // Verificação silenciosa se o container existe
        const container = SafeDOM.get('#progress-container');
        if (container) {
            console.log('✅ Sistema de progresso inicializado');
        }
    },

    start: (taskId) => {
        try {
            ProgressSystem.currentTaskId = taskId;
            ProgressSystem.isTracking = true;
            ProgressSystem.track();
            SafeDOM.show('#progress-container');
        } catch (error) {
            console.error('Erro ao iniciar progresso:', error);
        }
    },

    stop: () => {
        try {
            ProgressSystem.isTracking = false;
            ProgressSystem.currentTaskId = null;
            SafeDOM.hide('#progress-container');
        } catch (error) {
            console.error('Erro ao parar progresso:', error);
        }
    },

    track: async () => {
        if (!ProgressSystem.isTracking || !ProgressSystem.currentTaskId) return;

        try {
            const data = await APIClient.get(`${CONFIG.API_BASE}/progress/get_progress/${ProgressSystem.currentTaskId}`);

            if (data.success) {
                ProgressSystem.update(data);

                if (data.status === 'completed' || data.status === 'failed') {
                    ProgressSystem.stop();
                    if (data.status === 'completed') {
                        NotificationSystem.success('Análise concluída com sucesso!');
                        AnalysisManager.loadResult(ProgressSystem.currentTaskId);
                    } else {
                        NotificationSystem.error('Erro na análise. Verifique os logs.');
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao acompanhar progresso:', error);
        }

        if (ProgressSystem.isTracking) {
            setTimeout(ProgressSystem.track, CONFIG.PROGRESS_UPDATE_INTERVAL);
        }
    },

    update: (data) => {
        try {
            const progressBar = SafeDOM.get('#progress-bar');
            const progressText = SafeDOM.get('#progress-text');
            const progressDetails = SafeDOM.get('#progress-details');

            if (progressBar) {
                progressBar.style.width = `${data.progress || 0}%`;
            }

            if (progressText) {
                progressText.textContent = data.current_step || 'Processando...';
            }

            if (progressDetails && data.components_status) {
                const statusHTML = Object.entries(data.components_status)
                    .map(([component, status]) => `
                        <div class="component-status ${status}">
                            <span class="component-name">${component}</span>
                            <span class="component-status-icon">${status === 'completed' ? '✅' : status === 'running' ? '🔄' : '⏳'}</span>
                        </div>
                    `).join('');
                progressDetails.innerHTML = statusHTML;
            }

        } catch (error) {
            console.error('Erro ao atualizar progresso:', error);
        }
    }
};

// Gerenciador de análises
const AnalysisManager = {
    start: async () => {
        try {
            AppState.isProcessing = true;
            SafeDOM.addClass('#submitForm', 'processing');
            SafeDOM.setText('#submitForm', 'Processando...');

            const formData = AnalysisManager.collectFormData();

            if (!AnalysisManager.validateFormData(formData)) {
                throw new Error('Dados do formulário inválidos');
            }

            const response = await APIClient.post('/analyze_ultra_enhanced', formData);

            if (response.success) {
                AppState.currentAnalysis = response.task_id || response.analysis_id;

                // Se temos dados imediatos, mostra os resultados
                if (response.data) {
                    AnalysisManager.displayResult(response.data);
                    NotificationSystem.success('Análise concluída com sucesso!');
                } else if (response.task_id) {
                    // Se é processamento assíncrono, inicia tracking
                    ProgressSystem.start(response.task_id);
                    NotificationSystem.success('Análise iniciada com sucesso!');
                }
            } else {
                throw new Error(response.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('Erro ao iniciar análise:', error);
            NotificationSystem.error(`Erro ao iniciar análise: ${error.message}`);
            AnalysisManager.resetState();
        }
    },

    collectFormData: () => {
        const getValue = (id) => {
            const element = document.getElementById(id) || 
                          document.querySelector(`input[name="${id}"]`) ||
                          document.querySelector(`textarea[name="${id}"]`) ||
                          document.querySelector(`select[name="${id}"]`);
            return element?.value || '';
        };

        return {
            segmento: getValue('segmento'),
            produto: getValue('produto'),
            preco: getValue('preco'),
            publico: getValue('publico'),
            objetivo_receita: getValue('objetivo_receita'),
            orcamento_marketing: getValue('orcamento_marketing'),
            prazo_lancamento: getValue('prazo_lancamento'),
            concorrentes: getValue('concorrentes'),
            dados_adicionais: getValue('dados_adicionais')
        };
    },

    validateFormData: (data) => {
        if (!data.segmento || !data.produto || !data.publico) {
            NotificationSystem.error('Preencha os campos obrigatórios: Segmento, Produto e Público-alvo');
            return false;
        }
        return true;
    },

    loadResult: async (taskId) => {
        try {
            const response = await APIClient.get(`${CONFIG.API_BASE}/get_analysis_result/${taskId}`);

            if (response.success) {
                AnalysisManager.displayResult(response.data);
                AppState.currentAnalysis = response.data;
                AppState.analysisHistory.push(response.data);
            }
        } catch (error) {
            console.error('Erro ao carregar resultado:', error);
            NotificationSystem.error('Erro ao carregar resultado da análise');
        }
    },

    displayResult: (data) => {
        try {
            // Exibe seções principais
            const sections = [
                'avatar_ultra_detalhado',
                'drivers_mentais_customizados', 
                'provas_visuais_sugeridas',
                'sistema_anti_objecao',
                'pre_pitch_invisivel',
                'predicoes_futuro_completas'
            ];

            sections.forEach(section => {
                const container = SafeDOM.get(`#${section}-container`);
                if (container && data[section]) {
                    AnalysisManager.renderSection(container, data[section], section);
                }
            });

            // Mostra container de resultados
            SafeDOM.show('#results-container');
            SafeDOM.get('#results-container')?.scrollIntoView({ behavior: 'smooth' });

        } catch (error) {
            console.error('Erro ao exibir resultado:', error);
            NotificationSystem.error('Erro ao exibir resultado da análise');
        }
    },

    renderSection: (container, data, sectionName) => {
        try {
            let html = '';

            if (typeof data === 'object' && data !== null) {
                if (Array.isArray(data)) {
                    html = `<ul class="analysis-list">
                        ${data.map(item => `<li>${typeof item === 'object' ? JSON.stringify(item, null, 2) : item}</li>`).join('')}
                    </ul>`;
                } else {
                    html = `<div class="analysis-object">
                        ${Object.entries(data).map(([key, value]) => `
                            <div class="analysis-item">
                                <h4>${key.replace(/_/g, ' ')}</h4>
                                <div class="analysis-value">${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}</div>
                            </div>
                        `).join('')}
                    </div>`;
                }
            } else {
                html = `<div class="analysis-text">${data}</div>`;
            }

            container.innerHTML = html;
        } catch (error) {
            console.error(`Erro ao renderizar seção ${sectionName}:`, error);
            container.innerHTML = '<div class="error">Erro ao carregar seção</div>';
        }
    },

    resetState: () => {
        AppState.isProcessing = false;
        SafeDOM.removeClass('#submitForm', 'processing');
        SafeDOM.setText('#submitForm', 'Iniciar Análise Ultra-Detalhada');
        ProgressSystem.stop();
    }
};

// Sistema de histórico de análises
const HistoryManager = {
    load: async () => {
        try {
            const response = await APIClient.get(`/api/list_local_analyses`);

            if (response && response.success) {
                HistoryManager.display(response.analyses);
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível carregar histórico:', error.message);
            // Não é crítico, continua sem o histórico
        }
    },

    display: (analyses) => {
        try {
            const container = SafeDOM.get('#history-container');
            if (!container) return;

            if (!analyses || analyses.length === 0) {
                container.innerHTML = '<p class="no-history">Nenhuma análise encontrada</p>';
                return;
            }

            const html = analyses.map(analysis => `
                <div class="history-item" data-id="${analysis.analysis_id}">
                    <div class="history-header">
                        <h3>${analysis.produto || 'Produto não informado'}</h3>
                        <span class="history-date">${new Date(analysis.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="history-details">
                        <p><strong>Segmento:</strong> ${analysis.segmento || 'N/A'}</p>
                        <p><strong>Arquivos:</strong> ${analysis.total_files || 0}</p>
                    </div>
                    <div class="history-actions">
                        <button onclick="HistoryManager.viewAnalysis('${analysis.analysis_id}')" class="btn-view">Ver</button>
                        <button onclick="HistoryManager.deleteAnalysis('${analysis.analysis_id}')" class="btn-delete">Excluir</button>
                    </div>
                </div>
            `).join('');

            container.innerHTML = html;
        } catch (error) {
            console.error('Erro ao exibir histórico:', error);
        }
    },

    viewAnalysis: async (analysisId) => {
        try {
            const response = await APIClient.get(`${CONFIG.API_BASE}/get_analysis/${analysisId}`);

            if (response.success) {
                AnalysisManager.displayResult(response.analysis_data);
            }
        } catch (error) {
            console.error('Erro ao carregar análise:', error);
            NotificationSystem.error('Erro ao carregar análise');
        }
    },

    deleteAnalysis: async (analysisId) => {
        if (!confirm('Tem certeza que deseja excluir esta análise?')) return;

        try {
            const response = await APIClient.delete(`${CONFIG.API_BASE}/delete_analysis/${analysisId}`);

            if (response.success) {
                NotificationSystem.success('Análise excluída com sucesso');
                HistoryManager.load();
            }
        } catch (error) {
            console.error('Erro ao excluir análise:', error);
            NotificationSystem.error('Erro ao excluir análise');
        }
    }
};

// Sistema de Validação e Event Listeners combinados
const UIEnhancements = {
    init: () => {
        // Nada a fazer por enquanto, validação integrada no App.validateForm
    },

    setupEventListeners: () => {
        try {
            // Botão de análise - usar ID correto do template
            const startBtn = SafeDOM.get('#submitForm');
            if (startBtn) {
                startBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (!AppState.isProcessing) {
                        AnalysisManager.start();
                    }
                });
            }

            // Form de análise - adicionar listener ao formulário principal
            const analysisForm = SafeDOM.get('#enhancedAnalysisForm');
            if (analysisForm) {
                analysisForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    if (!AppState.isProcessing && App.validateForm()) {
                        AnalysisManager.start();
                    }
                });
            }

            // Validação em tempo real
            const requiredFields = ['#segmento', '#produto', '#publico'];
            requiredFields.forEach(selector => {
                const field = SafeDOM.get(selector);
                if (field) {
                    field.addEventListener('input', App.validateForm);
                }
            });

        } catch (error) {
            console.error('Erro ao configurar event listeners:', error);
        }
    },

    createMissingElements: () => {
        // Cria notification-container se não existir
        if (!SafeDOM.get('#notification-container')) {
            const container = document.createElement('div');
            container.id = 'notification-container';
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        // Cria progress-container se não existir
        if (!SafeDOM.get('#progress-container')) {
            const progressContainer = document.createElement('div');
            progressContainer.id = 'progress-container';
            progressContainer.className = 'progress-container';
            progressContainer.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                z-index: 9999;
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                display: none;
                min-width: 300px;
            `;
            progressContainer.innerHTML = `
                <div id="progress-text">Processando...</div>
                <div style="background: #f0f0f0; border-radius: 4px; margin: 10px 0;">
                    <div id="progress-bar" style="width: 0%; height: 20px; background: #4CAF50; border-radius: 4px; transition: width 0.3s ease;"></div>
                </div>
                <div id="progress-details"></div>
            `;
            document.body.appendChild(progressContainer);
        }

        // Cria results-container se não existir
        if (!SafeDOM.get('#results-container')) {
            const resultsContainer = document.createElement('div');
            resultsContainer.id = 'results-container';
            resultsContainer.style.display = 'none';

            // Procura por um local apropriado para inserir
            const main = document.querySelector('main') || document.body;
            main.appendChild(resultsContainer);
        }
    }
};

// Inicialização da aplicação
const App = {
    init: () => {
        try {
            console.log('🚀 Inicializando ARQV30 Enhanced v2.0...');

            // Aguarda DOM estar completamente carregado
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    App._initializeAfterDOM();
                });
                return;
            }

            App._initializeAfterDOM();

        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            // Fallback para notificação sem depender do NotificationSystem
            console.error('Erro crítico ao inicializar aplicação:', error.message);
        }
    },

    _initializeAfterDOM: () => {
        try {
            // Cria elementos DOM necessários se não existirem
            UIEnhancements.createMissingElements();

            // Inicializa sistemas principais com verificações
            NotificationSystem.init();

            // Verifica se sistemas foram inicializados corretamente
            if (NotificationSystem.container) {
                ProgressSystem.init();
                UIEnhancements.init();
                UIEnhancements.setupEventListeners();

                // Verifica dependências críticas
                const startBtn = SafeDOM.get('#submitForm');
                if (!startBtn) {
                    console.warn("⚠️ Botão de análise não encontrado - interface pode estar incompleta");
                }

                // Carrega recursos opcionais
                App._loadOptionalResources();

                // Auto-save
                setInterval(App.autoSave, CONFIG.AUTO_SAVE_INTERVAL);

                console.log('✅ Aplicação inicializada com sucesso');
            } else {
                throw new Error('Falha ao inicializar sistema de notificações');
            }

        } catch (error) {
            console.error('❌ Erro na inicialização pós-DOM:', error);
            // Fallback simples
            alert('Erro ao inicializar aplicação. Recarregue a página.');
        }
    },

    _loadOptionalResources: async () => {
        try {
            // Carrega recursos opcionais sem bloquear a inicialização
            await Promise.allSettled([
                App.loadAgentCapabilities(),
                HistoryManager.load()
            ]);
        } catch (error) {
            console.warn('⚠️ Erro ao carregar recursos opcionais:', error);
        }
    },

    loadAgentCapabilities: async () => {
        try {
            const response = await APIClient.get(`/api/get_agent_capabilities`);

            if (response && response.success) {
                App.displayCapabilities(response.capabilities);
            }
        } catch (error) {
            console.warn('⚠️ Não foi possível carregar capacidades do agente:', error.message);
            // Não é crítico, continua sem as capacidades
        }
    },

    displayCapabilities: (capabilities) => {
        try {
            const container = SafeDOM.get('#agent-capabilities');
            if (!container) return;

            const html = Object.entries(capabilities).map(([agent, info]) => `
                <div class="capability-item">
                    <h4>${agent}</h4>
                    <p>${info.description || 'Agente especializado'}</p>
                    <span class="capability-status ${info.status}">${info.status}</span>
                </div>
            `).join('');

            container.innerHTML = html;
        } catch (error) {
            console.error('Erro ao exibir capacidades:', error);
        }
    },

    validateForm: () => {
        try {
            const requiredFields = {
                segmento: SafeDOM.getValue('#segmento'),
                produto: SafeDOM.getValue('#produto'),
                publico: SafeDOM.getValue('#publico')
            };

            const isValid = Object.values(requiredFields).every(value => value.trim().length > 0);

            const startBtn = SafeDOM.get('#submitForm');
            if (startBtn) {
                if (isValid) {
                    startBtn.disabled = false;
                    SafeDOM.removeClass('#submitForm', 'disabled');
                } else {
                    startBtn.disabled = true;
                    SafeDOM.addClass('#submitForm', 'disabled');
                }
            }
        } catch (error) {
            console.error('Erro na validação:', error);
        }
    },

    autoSave: () => {
        try {
            if (AppState.currentAnalysis) {
                const formData = AnalysisManager.collectFormData();
                localStorage.setItem('arqv30_draft', JSON.stringify({
                    ...formData,
                    timestamp: new Date().toISOString()
                }));
                AppState.lastSaveTime = new Date();
            }
        } catch (error) {
            console.error('Erro no auto-save:', error);
        }
    }
};

// Adiciona estilos CSS dinamicamente
const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }

        .notification-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        }

        .notification {
            margin-bottom: 10px;
            padding: 15px;
            border-radius: 4px;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .processing { opacity: 0.7; cursor: not-allowed; }
        .disabled { opacity: 0.5; cursor: not-allowed; }

        .history-item {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 10px;
            border-radius: 5px;
        }

        .history-header {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
        }

        .history-actions {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }

        .btn-view, .btn-delete {
            padding: 5px 15px;
            border: none;
            border-radius: 3px;
            cursor: pointer;
        }

        .btn-view { background: #4caf50; color: white; }
        .btn-delete { background: #f44336; color: white; }

        .component-status {
            display: flex;
            justify-content: space-between;
            padding: 5px;
            margin-bottom: 5px;
            border-radius: 3px;
        }

        .component-status.completed { background: #e8f5e8; }
        .component-status.running { background: #fff3cd; }
        .component-status.pending { background: #f8f9fa; }

        /* Estilos para o loading overlay */
        .loading-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        }

        .loading-content {
            text-align: center;
            color: white;
        }

        .loading-spinner {
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-top: 4px solid #fff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px auto;
        }

        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
};

// Inicializa quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', App.init);
} else {
    // Aguarda um pouco para garantir que todos os recursos estejam carregados
    setTimeout(App.init, 100);
}

addStyles();