#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
ARQV30 Enhanced v2.0 - Analysis Routes com Controles de Sessão
Rotas para análise de mercado com pausar/continuar/salvar
"""

import logging
from flask import Blueprint, request, jsonify, render_template
from datetime import datetime
import json
import os
from services.ultra_detailed_analysis_engine import ultra_detailed_analysis_engine
from services.auto_save_manager import auto_save_manager, salvar_etapa, salvar_erro

logger = logging.getLogger(__name__)

analysis_bp = Blueprint('analysis', __name__)

# Armazena sessões ativas
active_sessions = {}

@analysis_bp.route('/')
def index():
    """Interface principal"""
    return render_template('unified_interface.html')

@analysis_bp.route('/analyze', methods=['POST'])
@analysis_bp.route('/api/analyze', methods=['POST'])
def analyze():
    """Inicia análise de mercado com controle de sessão"""
    try:
        data = request.get_json()

        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400

        logger.info("🚀 Iniciando análise de mercado ultra-detalhada")

        # Cria sessão única
        session_id = auto_save_manager.iniciar_sessao()

        # Salva dados da requisição
        salvar_etapa("requisicao_analise", data, categoria="analise_completa")

        logger.info(f"📊 Dados recebidos: Segmento={data.get('segmento')}, Produto={data.get('produto')}")

        # Prepara query de pesquisa
        query = data.get('query', f"mercado de {data.get('produto', data.get('segmento', ''))} no brasil desde 2022")
        logger.info(f"🔍 Query de pesquisa: {query}")

        # Salva query
        salvar_etapa("query_preparada", {"query": query}, categoria="pesquisa_web")

        # Registra sessão como ativa
        active_sessions[session_id] = {
            'status': 'running',
            'data': data,
            'started_at': datetime.now().isoformat(),
            'paused_at': None
        }

        # Executa análise com callback de progresso
        def progress_callback(step, message):
            logger.info(f"Progress {session_id}: Step {step}/13 - {message}")
            salvar_etapa("progresso", {
                "step": step,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }, categoria="logs")

        logger.info("🚀 Executando análise GIGANTE ultra-detalhada...")

        try:
            # Executa análise
            resultado = ultra_detailed_analysis_engine.generate_gigantic_analysis(
                data, session_id, progress_callback
            )

            # Atualiza status da sessão
            active_sessions[session_id]['status'] = 'completed'
            active_sessions[session_id]['completed_at'] = datetime.now().isoformat()

            return jsonify({
                'success': True,
                'session_id': session_id,
                'message': 'Análise GIGANTE concluída com sucesso!',
                'processing_time': resultado.get('metadata', {}).get('processing_time_formatted', 'N/A'),
                'data': resultado
            })

        except Exception as e:
            # Atualiza status da sessão como erro
            active_sessions[session_id]['status'] = 'error'
            active_sessions[session_id]['error'] = str(e)
            active_sessions[session_id]['error_at'] = datetime.now().isoformat()

            logger.error(f"❌ Erro na análise: {str(e)}")
            return jsonify({
                'success': False,
                'session_id': session_id,
                'error': str(e),
                'message': 'Erro na análise. Dados intermediários foram salvos.'
            }), 500

    except Exception as e:
        logger.error(f"❌ Erro geral: {str(e)}")
        salvar_erro("erro_geral_analise", e)
        return jsonify({'error': f'Erro interno: {str(e)}'}), 500

@analysis_bp.route('/sessions', methods=['GET'])
def list_sessions():
    """Lista todas as sessões salvas"""
    try:
        # Lista sessões do auto_save_manager
        try:
            saved_sessions = auto_save_manager.listar_sessoes()
        except AttributeError:
            # Fallback se método não existe
            import os
            base_path = 'relatorios_intermediarios/logs'
            saved_sessions = []
            if os.path.exists(base_path):
                for item in os.listdir(base_path):
                    if item.startswith('session_'):
                        saved_sessions.append(item)
            else:
                saved_sessions = []

        sessions_list = []
        for session_id in saved_sessions:
            session_data = active_sessions.get(session_id, {})
            session_info = auto_save_manager.obter_info_sessao(session_id)

            sessions_list.append({
                'session_id': session_id,
                'status': session_data.get('status', 'unknown'),
                'segmento': session_data.get('data', {}).get('segmento', 'N/A'),
                'produto': session_data.get('data', {}).get('produto', 'N/A'),
                'started_at': session_data.get('started_at'),
                'completed_at': session_data.get('completed_at'),
                'paused_at': session_data.get('paused_at'),
                'error': session_data.get('error'),
                'etapas_salvas': len(session_info.get('etapas', {})) if session_info else 0
            })

        return jsonify({
            'success': True,
            'sessions': sessions_list,
            'total': len(sessions_list)
        })

    except Exception as e:
        logger.error(f"❌ Erro ao listar sessões: {str(e)}")
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/sessions/<session_id>/pause', methods=['POST'])
def pause_session(session_id):
    """Pausa uma sessão ativa"""
    try:
        if session_id not in active_sessions:
            return jsonify({'error': 'Sessão não encontrada'}), 404

        session = active_sessions[session_id]
        if session['status'] != 'running':
            return jsonify({'error': 'Sessão não está em execução'}), 400

        # Atualiza status
        session['status'] = 'paused'
        session['paused_at'] = datetime.now().isoformat()

        # Salva estado de pausa
        salvar_etapa("sessao_pausada", {
            "session_id": session_id,
            "paused_at": session['paused_at'],
            "reason": "User requested pause"
        }, categoria="logs")

        logger.info(f"⏸️ Sessão {session_id} pausada pelo usuário")

        return jsonify({
            'success': True,
            'message': 'Sessão pausada com sucesso',
            'session_id': session_id,
            'status': 'paused'
        })

    except Exception as e:
        logger.error(f"❌ Erro ao pausar sessão: {str(e)}")
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/sessions/<session_id>/resume', methods=['POST'])
def resume_session(session_id):
    """Resume uma sessão pausada"""
    try:
        if session_id not in active_sessions:
            return jsonify({'error': 'Sessão não encontrada'}), 404

        session = active_sessions[session_id]
        if session['status'] != 'paused':
            return jsonify({'error': 'Sessão não está pausada'}), 400

        # Atualiza status
        session['status'] = 'running'
        session['resumed_at'] = datetime.now().isoformat()
        session['paused_at'] = None

        # Salva estado de resume
        salvar_etapa("sessao_resumida", {
            "session_id": session_id,
            "resumed_at": session['resumed_at'],
            "reason": "User requested resume"
        }, categoria="logs")

        logger.info(f"▶️ Sessão {session_id} resumida pelo usuário")

        return jsonify({
            'success': True,
            'message': 'Sessão resumida com sucesso',
            'session_id': session_id,
            'status': 'running'
        })

    except Exception as e:
        logger.error(f"❌ Erro ao resumir sessão: {str(e)}")
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/sessions/<session_id>/continue', methods=['POST'])
def continue_session(session_id):
    """Continua uma sessão salva"""
    try:
        # Recupera dados da sessão
        session_info = auto_save_manager.obter_info_sessao(session_id)

        if not session_info:
            return jsonify({'error': 'Sessão não encontrada'}), 404

        # Recupera dados originais
        original_data = None
        for etapa_nome, etapa_data in session_info.get('etapas', {}).items():
            if 'requisicao_analise' in etapa_nome:
                original_data = etapa_data.get('dados', {})
                break

        if not original_data:
            return jsonify({'error': 'Dados originais não encontrados'}), 400

        # Registra como sessão ativa
        active_sessions[session_id] = {
            'status': 'running',
            'data': original_data,
            'continued_at': datetime.now().isoformat(),
            'original_session': True
        }

        # Continua a análise
        def progress_callback(step, message):
            logger.info(f"Continue Progress {session_id}: Step {step}/13 - {message}")
            salvar_etapa("progresso_continuacao", {
                "step": step,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }, categoria="logs")

        logger.info(f"🔄Continuando análise da sessão {session_id}...")

        try:
            resultado = ultra_detailed_analysis_engine.generate_gigantic_analysis(
                original_data, session_id, progress_callback
            )

            active_sessions[session_id]['status'] = 'completed'
            active_sessions[session_id]['completed_at'] = datetime.now().isoformat()

            return jsonify({
                'success': True,
                'session_id': session_id,
                'message': 'Análise continuada e concluída com sucesso!',
                'data': resultado
            })

        except Exception as e:
            active_sessions[session_id]['status'] = 'error'
            active_sessions[session_id]['error'] = str(e)

            logger.error(f"❌ Erro ao continuar análise: {str(e)}")
            return jsonify({
                'success': False,
                'session_id': session_id,
                'error': str(e)
            }), 500

    except Exception as e:
        logger.error(f"❌ Erro geral ao continuar sessão: {str(e)}")
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/sessions/<session_id>/save', methods=['POST'])
def save_session(session_id):
    """Salva explicitamente uma sessão"""
    try:
        if session_id not in active_sessions:
            return jsonify({'error': 'Sessão não encontrada'}), 404

        session = active_sessions[session_id]

        # Salva estado completo da sessão
        salvar_etapa("sessao_salva_explicitamente", {
            "session_id": session_id,
            "saved_at": datetime.now().isoformat(),
            "session_data": session,
            "reason": "User explicitly saved session"
        }, categoria="logs")

        logger.info(f"💾 Sessão {session_id} salva explicitamente pelo usuário")

        return jsonify({
            'success': True,
            'message': 'Sessão salva com sucesso',
            'session_id': session_id
        })

    except Exception as e:
        logger.error(f"❌ Erro ao salvar sessão: {str(e)}")
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/sessions/<session_id>/status', methods=['GET'])
@analysis_bp.route('/api/sessions/<session_id>/status', methods=['GET'])
def get_session_status(session_id):
    """Obtém status de uma sessão"""
    try:
        session = active_sessions.get(session_id)
        session_info = auto_save_manager.obter_info_sessao(session_id)

        if not session and not session_info:
            return jsonify({'error': 'Sessão não encontrada'}), 404

        status_data = {
            'session_id': session_id,
            'status': session.get('status', 'unknown') if session else 'saved',
            'active': session is not None,
            'saved': session_info is not None,
            'etapas_salvas': len(session_info.get('etapas', {})) if session_info else 0
        }

        if session:
            status_data.update({
                'started_at': session.get('started_at'),
                'paused_at': session.get('paused_at'),
                'completed_at': session.get('completed_at'),
                'error': session.get('error'),
                'segmento': session.get('data', {}).get('segmento'),
                'produto': session.get('data', {}).get('produto')
            })

        return jsonify({
            'success': True,
            'session': status_data
        })

    except Exception as e:
        logger.error(f"❌ Erro ao obter status da sessão: {str(e)}")
        return jsonify({'error': str(e)}), 500

@analysis_bp.route('/api/sessions', methods=['GET'])
def api_list_sessions():
    """API endpoint para listar sessões"""
    return list_sessions()

@analysis_bp.route('/api/progress/<session_id>', methods=['GET'])
def api_get_progress(session_id):
    """API endpoint para obter progresso"""
    try:
        session = active_sessions.get(session_id)
        if not session:
            return jsonify({'error': 'Sessão não encontrada'}), 404

        # Simula progresso baseado no status
        if session['status'] == 'completed':
            return jsonify({
                'success': True,
                'completed': True,
                'percentage': 100,
                'current_step': 'Análise concluída',
                'total_steps': 13,
                'estimated_time': '0m'
            })
        elif session['status'] == 'running':
            # Calcula progresso baseado no tempo decorrido
            import time
            from datetime import datetime
            
            start_time = datetime.fromisoformat(session['started_at'])
            elapsed = (datetime.now() - start_time).total_seconds()
            progress = min(elapsed / 600 * 100, 95)  # 10 minutos = 100%
            
            return jsonify({
                'success': True,
                'completed': False,
                'percentage': progress,
                'current_step': f'Processando... ({progress:.0f}%)',
                'total_steps': 13,
                'estimated_time': f'{max(0, 10 - elapsed/60):.0f}m'
            })
        else:
            return jsonify({
                'success': True,
                'completed': False,
                'percentage': 0,
                'current_step': 'Pausado',
                'total_steps': 13,
                'estimated_time': 'N/A'
            })

    except Exception as e:
        logger.error(f"❌ Erro ao obter progresso: {str(e)}")
        return jsonify({'error': str(e)}), 500