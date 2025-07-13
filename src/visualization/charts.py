from typing import Any, Dict, List, Optional
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from plotly.subplots import make_subplots
import plotly.figure_factory as ff
from loguru import logger

from ..models.base import Visualizer
from ..utils.helpers import ConfigManager


class OcupacionVisualizer(Visualizer):
    """Visualizador específico para datos de ocupación laboral."""
    
    def __init__(self):
        self.config = ConfigManager()
        self.template = self.config.get('plotly_template', 'plotly_white')
        self.colors = {
            'primary': '#1f77b4',
            'secondary': '#ff7f0e', 
            'success': '#2ca02c',
            'info': '#17a2b8',
            'warning': '#ffc107',
            'danger': '#dc3545'
        }
    
    def create_chart(self, data: pd.DataFrame, chart_type: str, **kwargs) -> go.Figure:
        """Crea un gráfico basado en el tipo especificado."""
        chart_methods = {
            'bar': self._create_bar_chart,
            'line': self._create_line_chart,
            'pie': self._create_pie_chart,
            'scatter': self._create_scatter_chart,
            'heatmap': self._create_heatmap,
            'box': self._create_box_plot,
            'sunburst': self._create_sunburst
        }
        
        if chart_type not in chart_methods:
            raise ValueError(f"Tipo de gráfico no soportado: {chart_type}")
        
        return chart_methods[chart_type](data, **kwargs)
    
    def _create_bar_chart(self, data: pd.DataFrame, **kwargs) -> go.Figure:
        """Crea un gráfico de barras."""
        x_col = kwargs.get('x', 'grupo_ocupacional_desc')
        y_col = kwargs.get('y', 'valor')
        color_col = kwargs.get('color', 'sexo_desc')
        title = kwargs.get('title', 'Distribución por Grupo Ocupacional')
        
        # Agrupar datos si es necesario
        if kwargs.get('aggregate', True):
            data_agg = data.groupby([x_col, color_col])[y_col].sum().reset_index()
        else:
            data_agg = data
        
        fig = px.bar(
            data_agg,
            x=x_col,
            y=y_col,
            color=color_col,
            title=title,
            template=self.template,
            color_discrete_sequence=px.colors.qualitative.Set3
        )
        
        fig.update_layout(
            xaxis_title="Grupo Ocupacional",
            yaxis_title="Número de Ocupados (miles)",
            legend_title="Sexo",
            xaxis_tickangle=-45,
            height=600
        )
        
        return fig
    
    def _create_line_chart(self, data: pd.DataFrame, **kwargs) -> go.Figure:
        """Crea un gráfico de líneas para tendencias temporales."""
        x_col = kwargs.get('x', 'trimestre_movil_desc')
        y_col = kwargs.get('y', 'valor')
        color_col = kwargs.get('color', 'sexo_desc')
        title = kwargs.get('title', 'Tendencia Temporal de Ocupación')
        
        # Agrupar datos por periodo
        data_agg = data.groupby([x_col, color_col])[y_col].sum().reset_index()
        
        fig = px.line(
            data_agg,
            x=x_col,
            y=y_col,
            color=color_col,
            title=title,
            template=self.template,
            markers=True
        )
        
        fig.update_layout(
            xaxis_title="Periodo",
            yaxis_title="Número de Ocupados (miles)",
            legend_title="Sexo",
            xaxis_tickangle=-45,
            height=500
        )
        
        return fig
    
    def _create_pie_chart(self, data: pd.DataFrame, **kwargs) -> go.Figure:
        """Crea un gráfico de torta."""
        values_col = kwargs.get('values', 'valor')
        names_col = kwargs.get('names', 'grupo_ocupacional_desc')
        title = kwargs.get('title', 'Distribución por Grupo Ocupacional')
        
        # Agrupar datos
        data_agg = data.groupby(names_col)[values_col].sum().reset_index()
        
        fig = px.pie(
            data_agg,
            values=values_col,
            names=names_col,
            title=title,
            template=self.template,
            color_discrete_sequence=px.colors.qualitative.Set3
        )
        
        fig.update_traces(textposition='inside', textinfo='percent+label')
        fig.update_layout(height=600)
        
        return fig
    
    def _create_scatter_chart(self, data: pd.DataFrame, **kwargs) -> go.Figure:
        """Crea un gráfico de dispersión."""
        x_col = kwargs.get('x', 'trimestre_movil')
        y_col = kwargs.get('y', 'valor')
        color_col = kwargs.get('color', 'sexo_desc')
        size_col = kwargs.get('size', 'valor')
        title = kwargs.get('title', 'Análisis de Dispersión')
        
        fig = px.scatter(
            data,
            x=x_col,
            y=y_col,
            color=color_col,
            size=size_col,
            title=title,
            template=self.template,
            hover_data=['grupo_ocupacional_desc']
        )
        
        fig.update_layout(height=600)
        
        return fig
    
    def _create_heatmap(self, data: pd.DataFrame, **kwargs) -> go.Figure:
        """Crea un mapa de calor."""
        index_col = kwargs.get('index', 'grupo_ocupacional_desc')
        columns_col = kwargs.get('columns', 'sexo_desc')
        values_col = kwargs.get('values', 'valor')
        title = kwargs.get('title', 'Mapa de Calor - Ocupación por Grupo y Sexo')
        
        # Crear pivot table
        pivot_data = data.pivot_table(
            index=index_col,
            columns=columns_col,
            values=values_col,
            aggfunc='sum',
            fill_value=0
        )
        
        fig = px.imshow(
            pivot_data,
            title=title,
            template=self.template,
            aspect='auto',
            color_continuous_scale='Viridis'
        )
        
        fig.update_layout(height=600)
        
        return fig
    
    def _create_box_plot(self, data: pd.DataFrame, **kwargs) -> go.Figure:
        """Crea un gráfico de cajas."""
        x_col = kwargs.get('x', 'sexo_desc')
        y_col = kwargs.get('y', 'valor')
        title = kwargs.get('title', 'Distribución de Valores por Sexo')
        
        fig = px.box(
            data,
            x=x_col,
            y=y_col,
            title=title,
            template=self.template,
            color=x_col
        )
        
        fig.update_layout(height=500)
        
        return fig
    
    def _create_sunburst(self, data: pd.DataFrame, **kwargs) -> go.Figure:
        """Crea un gráfico sunburst (jerarquico)."""
        path_cols = kwargs.get('path', ['fuente', 'sexo_desc', 'grupo_ocupacional_desc'])
        values_col = kwargs.get('values', 'valor')
        title = kwargs.get('title', 'Distribución Jerárquica de Ocupación')
        
        # Preparar datos para sunburst
        data_agg = data.groupby(path_cols)[values_col].sum().reset_index()
        
        fig = px.sunburst(
            data_agg,
            path=path_cols,
            values=values_col,
            title=title,
            template=self.template,
            color_discrete_sequence=px.colors.qualitative.Set3
        )
        
        fig.update_layout(height=700)
        
        return fig
    
    def create_dashboard_charts(self, data: pd.DataFrame) -> Dict[str, go.Figure]:
        """Crea un conjunto de gráficos para el dashboard."""
        charts = {}
        
        try:
            # Filtrar datos válidos
            data_clean = data[data['value'] > 0].copy()
            
            # 1. Gráfico de barras por grupo ocupacional
            charts['bar_grupos'] = self.create_chart(
                data_clean,
                'bar',
                title='Ocupados por Grupo Ocupacional y Sexo',
                x='grupo_ocupacional_desc',
                y='value',
                color='sexo_desc'
            )
            
            # 2. Gráfico de líneas temporal
            charts['line_temporal'] = self.create_chart(
                data_clean,
                'line',
                title='Evolución Temporal de la Ocupación',
                x='trimestre_movil_desc',
                y='value',
                color='sexo_desc'
            )
            
            # 3. Gráfico de torta
            charts['pie_total'] = self.create_chart(
                data_clean[data_clean['sexo_code'] == '_T'],  # Solo totales
                'pie',
                title='Distribución Total por Grupo Ocupacional',
                values='value',
                names='grupo_ocupacional_desc'
            )
            
            # 4. Mapa de calor
            charts['heatmap'] = self.create_chart(
                data_clean[data_clean['sexo_code'] != '_T'],  # Sin totales
                'heatmap',
                title='Intensidad de Ocupación por Grupo y Sexo'
            )
            
            # 5. Box plot
            charts['box_distribution'] = self.create_chart(
                data_clean[data_clean['sexo_code'] != '_T'],
                'box',
                title='Distribución de Ocupados por Sexo'
            )
            
            # 6. Sunburst
            charts['sunburst'] = self.create_chart(
                data_clean[data_clean['sexo_code'] != '_T'],
                'sunburst',
                title='Distribución Jerárquica de Ocupación'
            )
            
            logger.info(f"Creados {len(charts)} gráficos para el dashboard")
            
        except Exception as e:
            logger.error(f"Error creando gráficos del dashboard: {e}")
            raise
        
        return charts
    
    def create_comparison_chart(self, data1: pd.DataFrame, data2: pd.DataFrame,
                              title: str = "Comparación entre Datasets") -> go.Figure:
        """Crea un gráfico de comparación entre dos datasets."""
        try:
            # Preparar datos para comparación
            data1_agg = data1.groupby('sexo_desc')['value'].sum().reset_index()
            data1_agg['dataset'] = 'Categoría Ocupacional'
            
            data2_agg = data2.groupby('sexo_desc')['value'].sum().reset_index()
            data2_agg['dataset'] = 'Grupo Ocupacional CIUO88'
            
            combined_data = pd.concat([data1_agg, data2_agg])
            
            fig = px.bar(
                combined_data,
                x='sexo_desc',
                y='value',
                color='dataset',
                title=title,
                template=self.template,
                barmode='group'
            )
            
            fig.update_layout(
                xaxis_title="Sexo",
                yaxis_title="Total Ocupados",
                legend_title="Dataset",
                height=500
            )
            
            return fig
            
        except Exception as e:
            logger.error(f"Error creando gráfico de comparación: {e}")
            raise
