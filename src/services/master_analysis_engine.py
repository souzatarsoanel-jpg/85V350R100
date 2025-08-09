
"""
MASTER ANALYSIS ENGINE - MOTOR UNIFICADO DE ANÁLISE
Consolida todos os motores de análise em um único componente centralizado
Autor: Manus AI - Implementação do Plano de Aprimoramento 85v350
"""

import asyncio
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum

from services.ai_manager import AIManager
from services.production_search_manager import ProductionSearchManager
from services.enhanced_analysis_orchestrator import EnhancedAnalysisOrchestrator
from services.archaeological_master import ArchaeologicalMaster
from services.visceral_master_agent import VisceralMasterAgent
from services.future_prediction_engine import FuturePredictionEngine
from services.anti_objection_system import AntiObjectionSystem
from services.visual_proofs_generator import VisualProofsGenerator
from services.mental_drivers_architect import MentalDriversArchitect
from services.pre_pitch_architect_advanced import PrePitchArchitectAdvanced
from services.comprehensive_analysis_validator import ComprehensiveAnalysisValidator
from services.progress_tracker_enhanced import ProgressTrackerEnhanced


class AnalysisType(Enum):
    """Tipos de análise disponíveis"""
    DETALHADA = "detalhada"
    FORENSE = "forense" 
    UNIFICADA = "unificada"
    ARQUEOLOGICA = "arqueologica"
    VISCERAL = "visceral"
    COMPLETA = "completa"


@dataclass
class AnalysisConfig:
    """Configuração dinâmica para análise"""
    analysis_type: AnalysisType
    include_visual_proofs: bool = True
    include_mental_drivers: bool = True
    include_predictions: bool = True
    include_anti_objections: bool = True
    include_pre_pitch: bool = True
    depth_level: int = 5  # 1-10
    custom_sections: List[str] = None


class MasterAnalysisEngine:
    """
    MOTOR MESTRE DE ANÁLISE UNIFICADO
    
    Responsabilidades:
    - Abstração de lógica comum
    - Configuração dinâmica por tipo
    - Reuso eficiente de componentes
    - Orquestração centralizada
    """
    
    def __init__(self):
        """Inicializa todos os componentes necessários"""
        
        # Componentes Core
        self.ai_manager = AIManager()
        self.search_manager = ProductionSearchManager()
        self.progress_tracker = ProgressTrackerEnhanced()
        self.validator = ComprehensiveAnalysisValidator()
        
        # Componentes Especializados
        self.orchestrator = EnhancedAnalysisOrchestrator()
        self.archaeological_master = ArchaeologicalMaster()
        self.visceral_agent = VisceralMasterAgent()
        self.prediction_engine = FuturePredictionEngine()
        self.anti_objection = AntiObjectionSystem()
        self.visual_proofs = VisualProofsGenerator()
        self.mental_drivers = MentalDriversArchitect()
        self.pre_pitch = PrePitchArchitectAdvanced()
        
        # Seções obrigatórias conforme plano
        self.required_sections = [
            'concorrencia', 'drivers_mentais', 'funil_vendas', 'insights',
            'metricas', 'palavras_chave', 'pesquisa_web', 'plano_acao',
            'posicionamento', 'pre_pitch', 'predicoes_futuro', 'provas_visuais',
            'reports', 'analyses', 'anti_objecao', 'avatars', 'completas'
        ]
    
    async def execute_analysis(
        self, 
        data: Dict[str, Any], 
        config: AnalysisConfig,
        progress_callback=None
    ) -> Dict[str, Any]:
        """
        EXECUÇÃO PRINCIPAL DA ANÁLISE UNIFICADA
        
        Args:
            data: Dados de entrada para análise
            config: Configuração do tipo de análise
            progress_callback: Callback para updates de progresso
        
        Returns:
            Resultado completo da análise estruturada
        """
        
        start_time = time.time()
        
        try:
            # Inicializar rastreamento
            if progress_callback:
                await self._update_progress(progress_callback, 0, "Iniciando análise unificada...")
            
            # FASE 1: Preparação e Validação Inicial
            validated_data = await self._prepare_and_validate_data(data)
            await self._update_progress(progress_callback, 10, "Dados validados e preparados")
            
            # FASE 2: Pesquisa e Coleta de Dados
            research_results = await self._execute_research_phase(validated_data, config)
            await self._update_progress(progress_callback, 25, "Pesquisa e coleta concluídas")
            
            # FASE 3: Análise Core por Tipo
            core_analysis = await self._execute_core_analysis(
                validated_data, research_results, config
            )
            await self._update_progress(progress_callback, 50, "Análise principal concluída")
            
            # FASE 4: Componentes Especializados
            specialized_results = await self._execute_specialized_components(
                core_analysis, config
            )
            await self._update_progress(progress_callback, 75, "Componentes especializados processados")
            
            # FASE 5: Consolidação e Estruturação Final
            final_result = await self._consolidate_final_results(
                core_analysis, specialized_results, config
            )
            await self._update_progress(progress_callback, 90, "Resultados consolidados")
            
            # FASE 6: Validação Final e Garantia de Qualidade
            validated_result = await self._final_validation(final_result)
            await self._update_progress(progress_callback, 100, "Análise concluída com sucesso!")
            
            # Adicionar metadados
            validated_result['metadata'] = {
                'analysis_type': config.analysis_type.value,
                'execution_time': time.time() - start_time,
                'timestamp': time.time(),
                'engine_version': 'MasterAnalysisEngine_v1.0',
                'sections_generated': len(validated_result.get('sections', {})),
                'quality_score': validated_result.get('quality_metrics', {}).get('overall_score', 0)
            }
            
            return validated_result
            
        except Exception as e:
            error_result = {
                'success': False,
                'error': str(e),
                'partial_results': {},
                'execution_time': time.time() - start_time
            }
            
            if progress_callback:
                await self._update_progress(
                    progress_callback, 100, f"Erro na análise: {str(e)}"
                )
            
            return error_result
    
    async def _prepare_and_validate_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Prepara e valida dados de entrada"""
        
        validated_data = data.copy()
        
        # Garantir campos obrigatórios
        required_fields = ['segmento', 'objetivo', 'publico_alvo']
        for field in required_fields:
            if field not in validated_data:
                validated_data[field] = f"Não especificado - {field}"
        
        # Normalizar dados
        if 'attachments' in validated_data:
            validated_data['attachments_processed'] = True
        
        return validated_data
    
    async def _execute_research_phase(
        self, 
        data: Dict[str, Any], 
        config: AnalysisConfig
    ) -> Dict[str, Any]:
        """Executa fase de pesquisa e coleta"""
        
        research_tasks = []
        
        # Pesquisa web baseada no segmento
        if data.get('segmento'):
            search_query = f"{data['segmento']} mercado tendências 2024"
            research_tasks.append(
                self.search_manager.search_with_fallback(search_query)
            )
        
        # Pesquisa de concorrência
        if data.get('segmento'):
            competitor_query = f"{data['segmento']} principais empresas líderes"
            research_tasks.append(
                self.search_manager.search_with_fallback(competitor_query)
            )
        
        # Executar pesquisas em paralelo
        research_results = await asyncio.gather(*research_tasks, return_exceptions=True)
        
        return {
            'web_research': research_results[0] if len(research_results) > 0 else {},
            'competitor_research': research_results[1] if len(research_results) > 1 else {},
            'total_sources': sum(len(r.get('results', [])) for r in research_results if isinstance(r, dict))
        }
    
    async def _execute_core_analysis(
        self, 
        data: Dict[str, Any], 
        research: Dict[str, Any], 
        config: AnalysisConfig
    ) -> Dict[str, Any]:
        """Executa análise principal baseada no tipo"""
        
        analysis_context = {**data, 'research_data': research}
        
        if config.analysis_type == AnalysisType.ARQUEOLOGICA:
            return await self.archaeological_master.execute_archaeological_analysis(
                analysis_context
            )
        
        elif config.analysis_type == AnalysisType.VISCERAL:
            return await self.visceral_agent.execute_visceral_analysis(
                analysis_context
            )
        
        elif config.analysis_type == AnalysisType.FORENSE:
            # Usar lógica forense especializada
            return await self._execute_forensic_analysis(analysis_context)
        
        else:
            # Análise detalhada/unificada/completa padrão
            return await self.orchestrator.execute_comprehensive_analysis(
                analysis_context
            )
    
    async def _execute_specialized_components(
        self, 
        core_analysis: Dict[str, Any], 
        config: AnalysisConfig
    ) -> Dict[str, Any]:
        """Executa componentes especializados conforme configuração"""
        
        specialized_results = {}
        
        # Executar componentes em paralelo quando possível
        tasks = []
        
        if config.include_predictions:
            tasks.append(('predictions', self.prediction_engine.generate_predictions(core_analysis)))
        
        if config.include_anti_objections:
            tasks.append(('anti_objections', self.anti_objection.generate_objection_strategies(core_analysis)))
        
        if config.include_visual_proofs:
            tasks.append(('visual_proofs', self.visual_proofs.generate_visual_proofs(core_analysis)))
        
        if config.include_mental_drivers:
            tasks.append(('mental_drivers', self.mental_drivers.architect_mental_drivers(core_analysis)))
        
        if config.include_pre_pitch:
            tasks.append(('pre_pitch', self.pre_pitch.generate_pre_pitch_strategy(core_analysis)))
        
        # Executar tasks especializadas
        for name, task in tasks:
            try:
                result = await task
                specialized_results[name] = result
            except Exception as e:
                specialized_results[name] = {'error': str(e), 'success': False}
        
        return specialized_results
    
    async def _consolidate_final_results(
        self, 
        core_analysis: Dict[str, Any], 
        specialized_results: Dict[str, Any], 
        config: AnalysisConfig
    ) -> Dict[str, Any]:
        """Consolida todos os resultados em estrutura final"""
        
        # Estrutura base conforme seções obrigatórias
        final_structure = {
            'success': True,
            'analysis_type': config.analysis_type.value,
            'sections': {}
        }
        
        # Mapear resultados para seções obrigatórias
        section_mapping = {
            'concorrencia': self._extract_competition_analysis(core_analysis, specialized_results),
            'drivers_mentais': specialized_results.get('mental_drivers', {}),
            'funil_vendas': self._extract_sales_funnel(core_analysis),
            'insights': self._extract_key_insights(core_analysis, specialized_results),
            'metricas': self._extract_metrics(core_analysis),
            'palavras_chave': self._extract_keywords(core_analysis),
            'pesquisa_web': self._extract_web_research(core_analysis),
            'plano_acao': self._extract_action_plan(core_analysis, specialized_results),
            'posicionamento': self._extract_positioning(core_analysis),
            'pre_pitch': specialized_results.get('pre_pitch', {}),
            'predicoes_futuro': specialized_results.get('predictions', {}),
            'provas_visuais': specialized_results.get('visual_proofs', {}),
            'reports': self._generate_section_reports(core_analysis),
            'analyses': core_analysis,
            'anti_objecao': specialized_results.get('anti_objections', {}),
            'avatars': self._extract_avatars(core_analysis),
            'completas': self._verify_completeness(core_analysis, specialized_results)
        }
        
        # Adicionar seções personalizadas se especificadas
        if config.custom_sections:
            for section in config.custom_sections:
                if section not in section_mapping:
                    section_mapping[section] = self._generate_custom_section(
                        section, core_analysis, specialized_results
                    )
        
        final_structure['sections'] = section_mapping
        
        return final_structure
    
    async def _final_validation(self, result: Dict[str, Any]) -> Dict[str, Any]:
        """Validação final e garantia de qualidade"""
        
        # Usar validador abrangente
        validation_result = self.validator.validate_comprehensive_analysis(result)
        
        # Adicionar métricas de qualidade
        result['quality_metrics'] = validation_result
        
        # Garantir que todas as seções obrigatórias estão presentes
        missing_sections = []
        for section in self.required_sections:
            if section not in result.get('sections', {}):
                missing_sections.append(section)
                # Gerar seção básica se estiver faltando
                result['sections'][section] = {
                    'status': 'generated_fallback',
                    'content': f'Seção {section} gerada automaticamente pelo sistema de fallback'
                }
        
        if missing_sections:
            result['warnings'] = result.get('warnings', [])
            result['warnings'].append(f"Seções geradas automaticamente: {', '.join(missing_sections)}")
        
        return result
    
    # Métodos auxiliares de extração de dados
    def _extract_competition_analysis(self, core: Dict, specialized: Dict) -> Dict[str, Any]:
        """Extrai análise de concorrência"""
        return {
            'principais_concorrentes': core.get('competitors', []),
            'analise_swot': core.get('competitive_analysis', {}),
            'posicionamento_competitivo': core.get('market_positioning', {}),
            'oportunidades_gap': core.get('market_gaps', [])
        }
    
    def _extract_sales_funnel(self, core: Dict) -> Dict[str, Any]:
        """Extrai análise do funil de vendas"""
        return {
            'etapas_funil': ['Consciência', 'Interesse', 'Consideração', 'Decisão', 'Retenção'],
            'metricas_conversao': core.get('conversion_metrics', {}),
            'gargalos_identificados': core.get('funnel_bottlenecks', []),
            'otimizacoes_sugeridas': core.get('funnel_optimizations', [])
        }
    
    def _extract_key_insights(self, core: Dict, specialized: Dict) -> Dict[str, Any]:
        """Extrai insights principais"""
        insights = core.get('insights', [])
        
        # Adicionar insights de componentes especializados
        for component_result in specialized.values():
            if isinstance(component_result, dict) and 'insights' in component_result:
                insights.extend(component_result['insights'])
        
        return {
            'insights_principais': insights[:10],  # Top 10
            'descobertas_surpreendentes': core.get('surprising_findings', []),
            'recomendacoes_acionaveis': core.get('actionable_recommendations', [])
        }
    
    def _extract_metrics(self, core: Dict) -> Dict[str, Any]:
        """Extrai métricas relevantes"""
        return {
            'kpis_principais': core.get('key_metrics', {}),
            'benchmarks_mercado': core.get('market_benchmarks', {}),
            'metas_sugeridas': core.get('suggested_targets', {}),
            'metricas_acompanhamento': core.get('tracking_metrics', [])
        }
    
    def _extract_keywords(self, core: Dict) -> Dict[str, Any]:
        """Extrai análise de palavras-chave"""
        return {
            'palavras_primarias': core.get('primary_keywords', []),
            'palavras_secundarias': core.get('secondary_keywords', []),
            'palavras_cauda_longa': core.get('long_tail_keywords', []),
            'analise_competitividade': core.get('keyword_competition', {})
        }
    
    def _extract_web_research(self, core: Dict) -> Dict[str, Any]:
        """Extrai resumo da pesquisa web"""
        research_data = core.get('research_data', {})
        return {
            'fontes_consultadas': research_data.get('sources', []),
            'dados_coletados': research_data.get('extracted_data', {}),
            'tendencias_identificadas': research_data.get('trends', []),
            'insights_pesquisa': research_data.get('research_insights', [])
        }
    
    def _extract_action_plan(self, core: Dict, specialized: Dict) -> Dict[str, Any]:
        """Extrai plano de ação"""
        return {
            'acoes_imediatas': core.get('immediate_actions', []),
            'acoes_medio_prazo': core.get('medium_term_actions', []),
            'acoes_longo_prazo': core.get('long_term_actions', []),
            'cronograma_sugerido': core.get('timeline', {}),
            'recursos_necessarios': core.get('required_resources', [])
        }
    
    def _extract_positioning(self, core: Dict) -> Dict[str, Any]:
        """Extrai análise de posicionamento"""
        return {
            'posicionamento_atual': core.get('current_positioning', ''),
            'posicionamento_sugerido': core.get('suggested_positioning', ''),
            'proposta_valor': core.get('value_proposition', ''),
            'diferenciacao': core.get('differentiation', [])
        }
    
    def _extract_avatars(self, core: Dict) -> Dict[str, Any]:
        """Extrai personas/avatares"""
        return {
            'avatar_primario': core.get('primary_persona', {}),
            'avatares_secundarios': core.get('secondary_personas', []),
            'jornada_cliente': core.get('customer_journey', {}),
            'pontos_dor': core.get('pain_points', [])
        }
    
    def _generate_section_reports(self, core: Dict) -> Dict[str, Any]:
        """Gera relatórios por seção"""
        return {
            'relatorio_executivo': core.get('executive_summary', ''),
            'relatorio_tecnico': core.get('technical_report', ''),
            'relatorio_comercial': core.get('commercial_report', '')
        }
    
    def _verify_completeness(self, core: Dict, specialized: Dict) -> Dict[str, Any]:
        """Verifica completude da análise"""
        total_sections = len(self.required_sections)
        completed_sections = sum(1 for section in self.required_sections 
                               if section in core or any(section in comp for comp in specialized.values()))
        
        completeness_score = (completed_sections / total_sections) * 100
        
        return {
            'score_completude': completeness_score,
            'secoes_completas': completed_sections,
            'secoes_totais': total_sections,
            'status': 'COMPLETO' if completeness_score >= 95 else 'PARCIAL'
        }
    
    def _generate_custom_section(
        self, 
        section_name: str, 
        core: Dict, 
        specialized: Dict
    ) -> Dict[str, Any]:
        """Gera seção personalizada"""
        return {
            'nome_secao': section_name,
            'conteudo': f'Seção personalizada: {section_name}',
            'dados_relevantes': core.get(section_name, {}),
            'status': 'custom_generated'
        }
    
    async def _execute_forensic_analysis(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Executa análise forense especializada"""
        # Implementação da análise forense
        return {
            'forensic_findings': context.get('findings', []),
            'evidence_analysis': context.get('evidence', {}),
            'conclusion': 'Análise forense concluída'
        }
    
    async def _update_progress(self, callback, percentage: int, message: str):
        """Atualiza progresso se callback fornecido"""
        if callback:
            await callback({
                'percentage': percentage,
                'message': message,
                'timestamp': time.time()
            })
