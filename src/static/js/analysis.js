// ARQV30 Enhanced v3.0 - Sistema de Análise Moderno
class ModernAnalysisSystem {
    constructor() {
        this.currentSessionId = null;
        this.progressInterval = null;
        this.sessions = new Map();
        this.isPaused = false;
        this.notifications = [];

        this.init();
    }

    init() {
        console.log('🔬 Sistema de Análise Moderno carregado');

        // Configura observers para animações
        this.setupAnimationObservers();

        // Carrega sessões salvas
        this.loadSavedSessions();

        // Event listeners
        this.setupEventListeners();

        // Restaura último progresso se existir
        this.restoreLastSession();

        // Configura auto-save
        this.setupAutoSave();
    }

    setupAnimationObservers() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate');
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        // Observa elementos com animação
        document.querySelectorAll('.animate-on-scroll').forEach(el => {
            observer.observe(el);
        });
    }

    setupEventListeners() {
        // Formulário principal
        const analyzeForm = document.getElementById('analysisForm');
        if (analyzeForm) {
            analyzeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.startAnalysis();
            });
        }

        // Botões de controle
        this.setupControlButtons();

        // Upload de arquivos
        this.setupFileUpload();

        // Atalhos de teclado
        this.setupKeyboardShortcuts();

        // Auto-resize de textareas
        this.setupTextareaResize();
    }

    setupControlButtons() {
        const buttons = {
            'pauseBtn': () => this.pauseSession(),
            'resumeBtn': () => this.resumeSession(),
            'saveBtn': () => this.saveSession(),
            'refreshSessionsBtn': () => this.loadSavedSessions(),
            'clearSessionsBtn': () => this.clearAllSessions()
        };

        Object.entries(buttons).forEach(([id, handler]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', handler);
            }
        });
    }

    setupFileUpload() {
        const fileInput = document.getElementById('fileInput');
        const dropZone = document.getElementById('dropZone');

        if (fileInput && dropZone) {
            // Drag and drop
            dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropZone.classList.add('drag-over');
            });

            dropZone.addEventListener('dragleave', () => {
                dropZone.classList.remove('drag-over');
            });

            dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const files = Array.from(e.dataTransfer.files);
                this.handleFiles(files);
            });

            // Click upload
            dropZone.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                this.handleFiles(files);
            });
        }
    }

    handleFiles(files) {
        files.forEach(file => {
            if (this.validateFile(file)) {
                this.uploadFile(file);
            }
        });
    }

    validateFile(file) {
        const maxSize = 10 * 1024 * 1024; // 10MB
        const allowedTypes = [
            'application/pdf',
            'text/plain',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];

        if (file.size > maxSize) {
            this.showNotification('Arquivo muito grande. Máximo 10MB.', 'warning');
            return false;
        }

        if (!allowedTypes.includes(file.type)) {
            this.showNotification('Tipo de arquivo não suportado.', 'warning');
            return false;
        }

        return true;
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(`Arquivo ${file.name} enviado com sucesso!`, 'success');
                this.addFileToList(file, result.file_id);
            } else {
                this.showNotification(`Erro no upload: ${result.error}`, 'error');
            }
        } catch (error) {
            this.showNotification(`Erro no upload: ${error.message}`, 'error');
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Enter para submeter
            if (e.ctrlKey && e.key === 'Enter') {
                e.preventDefault();
                this.startAnalysis();
            }

            // Escape para fechar notificações
            if (e.key === 'Escape') {
                this.clearNotifications();
            }

            // Alt+P para pausar/resumir
            if (e.altKey && e.key === 'p') {
                e.preventDefault();
                if (this.isPaused) {
                    this.resumeSession();
                } else {
                    this.pauseSession();
                }
            }
        });
    }

    setupTextareaResize() {
        document.querySelectorAll('textarea').forEach(textarea => {
            textarea.addEventListener('input', () => {
                textarea.style.height = 'auto';
                textarea.style.height = textarea.scrollHeight + 'px';
            });
        });
    }

    setupAutoSave() {
        const form = document.getElementById('analysisForm');
        if (form) {
            // Auto-save a cada 30 segundos
            setInterval(() => {
                this.autoSaveForm();
            }, 30000);

            // Save on form change
            form.addEventListener('change', () => {
                setTimeout(() => this.autoSaveForm(), 1000);
            });
        }
    }

    autoSaveForm() {
        const form = document.getElementById('analysisForm');
        if (!form) return;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        localStorage.setItem('analysisFormData', JSON.stringify(data));
        this.showNotification('Formulário salvo automaticamente', 'info', 2000);
    }

    restoreFormData() {
        const savedData = localStorage.getItem('analysisFormData');
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                Object.entries(data).forEach(([key, value]) => {
                    const input = document.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = value;
                    }
                });
            } catch (error) {
                console.error('Erro ao restaurar dados do formulário:', error);
            }
        }
    }

    async startAnalysis() {
        const form = document.getElementById('analysisForm');
        if (!form) {
            this.showNotification('Formulário não encontrado', 'error');
            return;
        }

        // Validação do formulário
        if (!this.validateForm()) {
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            this.showProgress(true);
            this.updateProgress(0, 'Iniciando análise...');

            const response = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.currentSessionId = result.session_id;
                this.showNotification(`Análise iniciada! Sessão: ${result.session_id}`, 'success');

                // Salva sessão no localStorage
                localStorage.setItem('currentSessionId', this.currentSessionId);

                // Inicia monitoramento
                this.startProgressMonitoring();

            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }

        } catch (error) {
            console.error('Erro na análise:', error);
            this.showNotification(`Erro na análise: ${error.message}`, 'error');
            this.showProgress(false);
        }
    }

    validateForm() {
        const segmento = document.querySelector('[name="segmento"]');

        if (!segmento || !segmento.value.trim()) {
            this.showNotification('Por favor, preencha o segmento', 'warning');
            segmento?.focus();
            return false;
        }

        if (segmento.value.trim().length < 3) {
            this.showNotification('Segmento deve ter pelo menos 3 caracteres', 'warning');
            segmento?.focus();
            return false;
        }

        return true;
    }

    async pauseSession() {
        if (!this.currentSessionId) {
            this.showNotification('Nenhuma sessão ativa para pausar', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/sessions/${this.currentSessionId}/pause`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.isPaused = true;
                this.stopProgressMonitoring();
                this.showNotification('Sessão pausada com sucesso', 'success');
                this.updateSessionControls('paused');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.showNotification(`Erro ao pausar: ${error.message}`, 'error');
        }
    }

    async resumeSession() {
        if (!this.currentSessionId) {
            this.showNotification('Nenhuma sessão para resumir', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/sessions/${this.currentSessionId}/resume`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.isPaused = false;
                this.startProgressMonitoring();
                this.showNotification('Sessão resumida com sucesso', 'success');
                this.updateSessionControls('running');
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.showNotification(`Erro ao resumir: ${error.message}`, 'error');
        }
    }

    async saveSession() {
        if (!this.currentSessionId) {
            this.showNotification('Nenhuma sessão para salvar', 'warning');
            return;
        }

        try {
            const response = await fetch(`/api/sessions/${this.currentSessionId}/save`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Sessão salva com sucesso', 'success');
                await this.loadSavedSessions();
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.showNotification(`Erro ao salvar: ${error.message}`, 'error');
        }
    }

    async continueSession(sessionId) {
        try {
            this.showProgress(true);
            this.updateProgress(0, 'Continuando sessão...');

            const response = await fetch(`/api/sessions/${sessionId}/continue`, {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.currentSessionId = sessionId;
                localStorage.setItem('currentSessionId', sessionId);

                this.showNotification('Sessão continuada com sucesso', 'success');
                this.startProgressMonitoring();

            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.showNotification(`Erro ao continuar: ${error.message}`, 'error');
            this.showProgress(false);
        }
    }

    async loadSavedSessions() {
        try {
            const response = await fetch('/api/sessions');

            if (!response.ok) {
                throw new Error('Erro ao carregar sessões');
            }

            const result = await response.json();

            if (result.success) {
                this.sessions.clear();
                result.sessions.forEach(session => {
                    this.sessions.set(session.session_id, session);
                });

                this.renderSessionsList();
            } else {
                console.warn('Nenhuma sessão encontrada');
                this.renderEmptySessionsList();
            }

        } catch (error) {
            console.error('Erro ao carregar sessões:', error);
            this.renderEmptySessionsList();
        }
    }

    renderSessionsList() {
        const container = document.getElementById('sessionsList');
        if (!container) return;

        if (this.sessions.size === 0) {
            this.renderEmptySessionsList();
            return;
        }

        let html = '<div class="session-grid">';

        this.sessions.forEach((session, sessionId) => {
            const statusClass = this.getStatusClass(session.status);
            const statusText = this.getStatusText(session.status);

            html += `
                <div class="session-item ${session.status === 'running' ? 'active' : ''}" 
                     onclick="analysisSystem.selectSession('${sessionId}')">
                    <div class="session-header">
                        <div class="session-name">
                            ${session.segmento || 'Segmento não definido'}
                        </div>
                        <span class="badge badge-${statusClass}">${statusText}</span>
                    </div>
                    <div class="session-meta">
                        <small><strong>Produto:</strong> ${session.produto || 'N/A'}</small>
                        <small><strong>Iniciado:</strong> ${this.formatDate(session.started_at)}</small>
                        ${session.etapas_salvas ? `<small><strong>Etapas:</strong> ${session.etapas_salvas}</small>` : ''}
                    </div>
                    <div class="session-actions">
                        ${this.getSessionActions(session, sessionId)}
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderEmptySessionsList() {
        const container = document.getElementById('sessionsList');
        if (!container) return;

        container.innerHTML = `
            <div class="text-center" style="padding: 3rem; color: var(--text-tertiary);">
                <div style="font-size: 3rem; margin-bottom: 1rem;">📂</div>
                <h4>Nenhuma sessão encontrada</h4>
                <p>Inicie uma nova análise para criar sua primeira sessão.</p>
            </div>
        `;
    }

    getSessionActions(session, sessionId) {
        const actions = [];

        if (['paused', 'error', 'saved'].includes(session.status)) {
            actions.push(`
                <button class="btn btn-primary btn-sm" 
                        onclick="event.stopPropagation(); analysisSystem.continueSession('${sessionId}')">
                    <i class="fas fa-play"></i> Continuar
                </button>
            `);
        }

        if (session.status === 'completed') {
            actions.push(`
                <button class="btn btn-secondary btn-sm" 
                        onclick="event.stopPropagation(); analysisSystem.viewResults('${sessionId}')">
                    <i class="fas fa-eye"></i> Ver Resultados
                </button>
            `);
        }

        actions.push(`
            <button class="btn btn-error btn-sm" 
                    onclick="event.stopPropagation(); analysisSystem.deleteSession('${sessionId}')">
                <i class="fas fa-trash"></i>
            </button>
        `);

        return actions.join(' ');
    }

    selectSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) return;

        // Remove seleção anterior
        document.querySelectorAll('.session-item').forEach(item => {
            item.classList.remove('active');
        });

        // Seleciona novo item
        const selectedItem = document.querySelector(`[onclick="analysisSystem.selectSession('${sessionId}')"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }

        this.showSessionDetails(session);
    }

    showSessionDetails(session) {
        const detailsContainer = document.getElementById('sessionDetails');
        if (!detailsContainer) return;

        const html = `
            <div class="session-details-card">
                <div class="session-details-header">
                    <h4>Detalhes da Sessão</h4>
                    <span class="badge badge-${this.getStatusClass(session.status)}">
                        ${this.getStatusText(session.status)}
                    </span>
                </div>
                <div class="session-details-body">
                    <div class="detail-row">
                        <span class="detail-label">ID da Sessão:</span>
                        <span class="detail-value">${session.session_id}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Segmento:</span>
                        <span class="detail-value">${session.segmento || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Produto:</span>
                        <span class="detail-value">${session.produto || 'N/A'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Iniciado em:</span>
                        <span class="detail-value">${this.formatDate(session.started_at)}</span>
                    </div>
                    ${session.completed_at ? `
                        <div class="detail-row">
                            <span class="detail-label">Concluído em:</span>
                            <span class="detail-value">${this.formatDate(session.completed_at)}</span>
                        </div>
                    ` : ''}
                    <div class="detail-row">
                        <span class="detail-label">Etapas Salvas:</span>
                        <span class="detail-value">${session.etapas_salvas || 0}</span>
                    </div>
                    ${session.error ? `
                        <div class="alert alert-error">
                            <strong>Erro:</strong> ${session.error}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        detailsContainer.innerHTML = html;
    }

    startProgressMonitoring() {
        if (!this.currentSessionId) return;

        this.progressInterval = setInterval(async () => {
            try {
                const response = await fetch(`/api/progress/${this.currentSessionId}`);
                const data = await response.json();

                if (data.success) {
                    this.updateProgress(
                        data.percentage, 
                        data.current_step, 
                        data.total_steps,
                        data.estimated_time
                    );

                    if (data.completed) {
                        this.stopProgressMonitoring();
                        this.showNotification('Análise concluída com sucesso!', 'success');
                        this.showProgress(false);
                        this.updateSessionControls('completed');
                        localStorage.removeItem('currentSessionId');

                        // Recarrega sessões
                        await this.loadSavedSessions();
                    }
                } else if (data.error) {
                    this.stopProgressMonitoring();
                    this.showNotification(`Erro: ${data.error}`, 'error');
                    this.showProgress(false);
                }

            } catch (error) {
                console.error('Erro no monitoramento:', error);
            }
        }, 3000); // Verifica a cada 3 segundos
    }

    stopProgressMonitoring() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
    }

    updateProgress(percentage, message, totalSteps = 13, estimatedTime = '') {
        // Atualiza barra de progresso
        const progressFill = document.querySelector('.progress-fill');
        const progressPercentage = document.querySelector('.progress-percentage');
        const progressStatus = document.querySelector('.progress-status');

        if (progressFill) {
            progressFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
        }

        if (progressPercentage) {
            progressPercentage.textContent = `${Math.round(percentage)}%`;
        }

        if (progressStatus && message) {
            progressStatus.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span>${message}</span>
                    ${estimatedTime ? `<small>Tempo estimado: ${estimatedTime}</small>` : ''}
                </div>
            `;
        }

        // Atualiza título da página
        document.title = `${Math.round(percentage)}% - ARQV30 Enhanced`;
    }

    showProgress(show) {
        const container = document.getElementById('progressContainer');
        if (container) {
            container.style.display = show ? 'block' : 'none';

            if (show) {
                container.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }

    updateSessionControls(status) {
        const buttons = {
            pauseBtn: status === 'running',
            resumeBtn: status === 'paused',
            saveBtn: ['running', 'paused'].includes(status)
        };

        Object.entries(buttons).forEach(([id, show]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.display = show ? 'inline-flex' : 'none';
            }
        });
    }

    async restoreLastSession() {
        const lastSessionId = localStorage.getItem('currentSessionId');
        if (lastSessionId) {
            this.currentSessionId = lastSessionId;
            await this.checkSessionStatus(lastSessionId);
        }

        // Restaura dados do formulário
        this.restoreFormData();
    }

    async checkSessionStatus(sessionId) {
        try {
            const response = await fetch(`/api/sessions/${sessionId}/status`);
            const result = await response.json();

            if (result.success) {
                const session = result.session;

                switch (session.status) {
                    case 'running':
                        this.showProgress(true);
                        this.startProgressMonitoring();
                        this.updateSessionControls('running');
                        this.showNotification('Sessão anterior restaurada e em execução', 'info');
                        break;

                    case 'paused':
                        this.updateSessionControls('paused');
                        this.showNotification('Sessão anterior encontrada (pausada)', 'info');
                        break;

                    case 'completed':
                        localStorage.removeItem('currentSessionId');
                        this.showNotification('Última sessão foi concluída', 'success');
                        break;

                    case 'error':
                        this.showNotification('Última sessão teve erro', 'warning');
                        break;
                }
            }

        } catch (error) {
            console.error('Erro ao verificar status da sessão:', error);
            localStorage.removeItem('currentSessionId');
        }
    }

    async deleteSession(sessionId) {
        if (!confirm('Tem certeza que deseja excluir esta sessão?')) {
            return;
        }

        try {
            const response = await fetch(`/api/sessions/${sessionId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Sessão excluída com sucesso', 'success');
                this.sessions.delete(sessionId);
                this.renderSessionsList();
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.showNotification(`Erro ao excluir: ${error.message}`, 'error');
        }
    }

    async clearAllSessions() {
        if (!confirm('Tem certeza que deseja excluir TODAS as sessões?')) {
            return;
        }

        try {
            const response = await fetch('/api/sessions/clear', {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('Todas as sessões foram excluídas', 'success');
                this.sessions.clear();
                this.renderEmptySessionsList();
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            this.showNotification(`Erro ao limpar sessões: ${error.message}`, 'error');
        }
    }

    // Utility Methods
    getStatusClass(status) {
        const classes = {
            'running': 'primary',
            'paused': 'warning',
            'completed': 'success',
            'error': 'error',
            'saved': 'secondary'
        };
        return classes[status] || 'secondary';
    }

    getStatusText(status) {
        const texts = {
            'running': 'Em execução',
            'paused': 'Pausada',
            'completed': 'Concluída',
            'error': 'Erro',
            'saved': 'Salva'
        };
        return texts[status] || 'Desconhecido';
    }

    formatDate(dateString) {
        if (!dateString) return 'N/A';

        try {
            const date = new Date(dateString);
            return new Intl.DateTimeFormat('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).format(date);
        } catch {
            return dateString;
        }
    }

    showNotification(message, type = 'info', duration = 5000) {
        const notification = this.createNotification(message, type);
        this.addNotificationToContainer(notification);

        // Auto-remove
        setTimeout(() => {
            this.removeNotification(notification);
        }, duration);
    }

    createNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type} fade-in`;

        const icons = {
            info: 'fas fa-info-circle',
            success: 'fas fa-check-circle',
            warning: 'fas fa-exclamation-triangle',
            error: 'fas fa-exclamation-circle'
        };

        notification.innerHTML = `
            <div class="notification-icon">
                <i class="${icons[type]}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-message">${message}</div>
            </div>
            <button class="notification-close" onclick="analysisSystem.removeNotification(this.parentElement)">
                <i class="fas fa-times"></i>
            </button>
        `;

        return notification;
    }

    addNotificationToContainer(notification) {
        let container = document.getElementById('notificationContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'notification-container';
            container.style.cssText = `
                position: fixed;
                top: 1rem;
                right: 1rem;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
                max-width: 400px;
            `;
            document.body.appendChild(container);
        }

        container.appendChild(notification);
        this.notifications.push(notification);
    }

    removeNotification(notification) {
        if (notification && notification.parentElement) {
            notification.classList.add('fade-out');
            setTimeout(() => {
                notification.remove();
                const index = this.notifications.indexOf(notification);
                if (index > -1) {
                    this.notifications.splice(index, 1);
                }
            }, 300);
        }
    }

    clearNotifications() {
        this.notifications.forEach(notification => {
            this.removeNotification(notification);
        });
    }
}

// CSS para notificações (adicionado dinamicamente)
const notificationStyles = `
    .notification {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 1rem;
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
        border: 1px solid #e5e7eb;
        min-width: 300px;
        max-width: 400px;
        animation: slideInRight 0.3s ease-out;
        position: relative;
        overflow: hidden;
    }

    .notification::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 4px;
    }

    .notification-info::before { background: #3b82f6; }
    .notification-success::before { background: #10b981; }
    .notification-warning::before { background: #f59e0b; }
    .notification-error::before { background: #ef4444; }

    .notification-icon {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .notification-info .notification-icon { color: #3b82f6; }
    .notification-success .notification-icon { color: #10b981; }
    .notification-warning .notification-icon { color: #f59e0b; }
    .notification-error .notification-icon { color: #ef4444; }

    .notification-content {
        flex: 1;
    }

    .notification-message {
        font-size: 0.875rem;
        color: #374151;
        font-weight: 500;
        line-height: 1.4;
    }

    .notification-close {
        flex-shrink: 0;
        width: 20px;
        height: 20px;
        border: none;
        background: none;
        color: #9ca3af;
        cursor: pointer;
        border-radius: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.15s;
    }

    .notification-close:hover {
        background: #f3f4f6;
        color: #374151;
    }

    .fade-out {
        animation: slideOutRight 0.3s ease-in forwards;
    }

    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        to {
            opacity: 0;
            transform: translateX(100px);
        }
    }

    .session-details-card {
        background: white;
        border-radius: 1rem;
        box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        border: 1px solid #e5e7eb;
        margin-top: 1rem;
    }

    .session-details-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid #e5e7eb;
    }

    .session-details-header h4 {
        margin: 0;
        font-size: 1.125rem;
        font-weight: 600;
        color: #374151;
    }

    .session-details-body {
        padding: 1.5rem;
    }

    .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        padding: 0.5rem 0;
        border-bottom: 1px solid #f3f4f6;
    }

    .detail-row:last-child {
        border-bottom: none;
    }

    .detail-label {
        font-weight: 600;
        color: #6b7280;
        font-size: 0.875rem;
        min-width: 120px;
    }

    .detail-value {
        color: #374151;
        font-weight: 500;
        text-align: right;
        word-break: break-word;
    }

    .drag-over {
        border-color: #3b82f6 !important;
        background: rgba(59, 130, 246, 0.05) !important;
    }
`;

// Adiciona estilos das notificações
if (!document.getElementById('notificationStyles')) {
    const style = document.createElement('style');
    style.id = 'notificationStyles';
    style.textContent = notificationStyles;
    document.head.appendChild(style);
}

// Inicialização global
let analysisSystem;
let currentSessionId = null; // Variável global para o ID da sessão atual
let progressInterval = null; // Variável global para o intervalo de monitoramento

// Função para lidar com arquivos
function handleFiles(files) {
    console.log('📁 Arquivos selecionados:', files);

    if (!files || files.length === 0) {
        showNotification('Nenhum arquivo selecionado', 'warning');
        return;
    }

    // Implementação futura para upload de arquivos
    showNotification(`${files.length} arquivo(s) selecionado(s)`, 'info');
}

// Função para alternar abas forenses
function switchForensicTab(tabName) {
    console.log('🔄 Alternando para aba:', tabName);

    // Remove active de todas as abas
    document.querySelectorAll('.forensic-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Adiciona active na aba selecionada
    const selectedTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }

    // Mostra conteúdo da aba
    document.querySelectorAll('.tab-content').forEach(content => {
        content.style.display = 'none';
    });

    const targetContent = document.querySelector(`#${tabName}-content`);
    if (targetContent) {
        targetContent.style.display = 'block';
    }
}

function showNotification(message, type = 'info') {
    let container = document.getElementById('notification-container');

    // Cria container se não existir
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 350px;
        `;
        document.body.appendChild(container);
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;

    const icons = {
        info: 'fas fa-info-circle',
        success: 'fas fa-check-circle',
        warning: 'fas fa-exclamation-triangle',
        error: 'fas fa-exclamation-circle'
    };

    notification.innerHTML = `
        <div class="notification-icon">
            <i class="${icons[type]}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close" onclick="removeNotification(this.parentElement)">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(notification);

    // Auto-remove após 5 segundos
    setTimeout(() => {
        removeNotification(notification);
    }, 5000);
}

function removeNotification(notification) {
    if (notification && notification.parentElement) {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }
}

// Função para iniciar a análise
async function startAnalysis() {
    const segmento = document.getElementById('segmento')?.value?.trim();
    const produto = document.getElementById('produto')?.value?.trim();

    if (!segmento || !produto) {
        showNotification('Por favor, preencha todos os campos obrigatórios', 'error');
        return;
    }

    console.log('🚀 Iniciando análise:', { segmento, produto });

    // Desabilita botão e mostra loading
    const startButton = document.getElementById('start-analysis');
    if (startButton) {
        startButton.disabled = true;
        startButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analisando...';
    }

    try {
        showNotification('Iniciando análise avançada...', 'info');

        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                segmento,
                produto,
                analise_tipo: 'completa'
            })
        });

        let data;
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            console.error('Resposta não é JSON:', text.substring(0, 200));
            throw new Error('Servidor retornou resposta inválida');
        }

        if (!response.ok) {
            throw new Error(data.error || `Erro HTTP: ${response.status}`);
        }

        if (data.success) {
            showNotification('Análise iniciada com sucesso!', 'success');

            if (data.session_id) {
                currentSessionId = data.session_id;
                startProgressMonitoring(data.session_id);

                // Mostra seção de progresso
                const progressSection = document.getElementById('progress-section');
                if (progressSection) {
                    progressSection.style.display = 'block';
                    progressSection.scrollIntoView({ behavior: 'smooth' });
                }

                // Adiciona controles de pausa/continuar
                addAnalysisControls();
            }
        } else {
            throw new Error(data.error || 'Erro desconhecido na análise');
        }

    } catch (error) {
        console.error('Erro na análise:', error);
        showNotification(`Erro: ${error.message}`, 'error');

        // Reabilita botão
        if (startButton) {
            startButton.disabled = false;
            startButton.innerHTML = '<i class="fas fa-rocket"></i> Iniciar Análise Completa';
        }
    }
}

// Adiciona controles de análise
function addAnalysisControls() {
    const progressSection = document.getElementById('progress-section');
    if (!progressSection) return;

    // Verifica se controles já existem
    if (document.getElementById('analysis-controls')) return;

    const controlsHtml = `
        <div id="analysis-controls" class="analysis-controls" style="margin-top: 20px;">
            <div class="control-buttons">
                <button id="pause-analysis" class="btn btn-warning" onclick="pauseAnalysis()">
                    <i class="fas fa-pause"></i> Pausar Análise
                </button>
                <button id="save-analysis" class="btn btn-info" onclick="saveCurrentAnalysis()">
                    <i class="fas fa-save"></i> Salvar Progresso
                </button>
                <button id="stop-analysis" class="btn btn-danger" onclick="stopAnalysis()">
                    <i class="fas fa-stop"></i> Parar Análise
                </button>
            </div>
        </div>
    `;

    progressSection.insertAdjacentHTML('beforeend', controlsHtml);
}

// Pausa a análise
function pauseAnalysis() {
    if (!currentSessionId) {
        showNotification('Nenhuma análise em execução', 'warning');
        return;
    }

    const pauseBtn = document.getElementById('pause-analysis');
    if (pauseBtn) {
        if (pauseBtn.textContent.includes('Pausar')) {
            pauseBtn.innerHTML = '<i class="fas fa-play"></i> Continuar Análise';
            pauseBtn.className = 'btn btn-success';
            showNotification('Análise pausada', 'info');
        } else {
            pauseBtn.innerHTML = '<i class="fas fa-pause"></i> Pausar Análise';
            pauseBtn.className = 'btn btn-warning';
            showNotification('Análise retomada', 'info');
        }
    }
}

// Salva o progresso atual
function saveCurrentAnalysis() {
    if (!currentSessionId) {
        showNotification('Nenhuma análise para salvar', 'warning');
        return;
    }

    // Salva no localStorage
    const analysisData = {
        sessionId: currentSessionId,
        timestamp: new Date().toISOString(),
        progress: document.getElementById('progress-bar')?.style.width || '0%'
    };

    localStorage.setItem(`analysis_${currentSessionId}`, JSON.stringify(analysisData));
    showNotification('Progresso salvo com sucesso!', 'success');
}

// Para a análise
function stopAnalysis() {
    if (!currentSessionId) {
        showNotification('Nenhuma análise em execução', 'warning');
        return;
    }

    if (confirm('Tem certeza que deseja parar a análise?')) {
        clearInterval(progressInterval);
        currentSessionId = null;

        // Reabilita botão de análise
        const startButton = document.getElementById('start-analysis');
        if (startButton) {
            startButton.disabled = false;
            startButton.innerHTML = '<i class="fas fa-rocket"></i> Iniciar Análise Completa';
        }

        // Remove controles
        const controls = document.getElementById('analysis-controls');
        if (controls) controls.remove();

        showNotification('Análise interrompida', 'info');
    }
}

// Inicializa sistema de upload
function initializeFileUpload() {
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            handleFiles(e.target.files);
        });
    }
}

// Carrega análises salvas
function loadSavedAnalyses() {
    const savedAnalyses = [];

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('analysis_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                savedAnalyses.push(data);
            } catch (e) {
                console.error('Erro ao carregar análise salva:', e);
            }
        }
    }

    return savedAnalyses;
}

// Função para monitorar o progresso da análise
function startProgressMonitoring(sessionId) {
    progressInterval = setInterval(async () => {
        try {
            const response = await fetch(`/api/progress/${sessionId}`);
            const data = await response.json();

            if (data.success) {
                updateProgressUI(data.percentage, data.current_step, data.estimated_time);
                if (data.completed) {
                    clearInterval(progressInterval);
                    showNotification('Análise concluída!', 'success');
                    // Implementar lógica para exibir resultados ou fechar progresso
                    document.getElementById('progress-section').style.display = 'none';
                }
            } else {
                throw new Error(data.error || 'Erro ao obter progresso');
            }
        } catch (error) {
            console.error('Falha ao monitorar progresso:', error);
            clearInterval(progressInterval);
            showNotification(`Erro no monitoramento: ${error.message}`, 'error');
        }
    }, 3000); // Verifica a cada 3 segundos
}

// Atualiza a interface de progresso
function updateProgressUI(percentage, step, estimatedTime) {
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');

    if (progressBar) {
        progressBar.style.width = `${percentage}%`;
    }
    if (progressText) {
        progressText.textContent = `${step} (${estimatedTime || ''})`;
    }
}


document.addEventListener('DOMContentLoaded', () => {
    analysisSystem = new ModernAnalysisSystem();
    console.log('🚀 ARQV30 Enhanced v3.0 - Sistema Moderno Inicializado');
    console.log('🎯 Interface Moderna Carregada');

    // Inicializa sistema de upload de arquivos se existir
    initializeFileUpload();
});