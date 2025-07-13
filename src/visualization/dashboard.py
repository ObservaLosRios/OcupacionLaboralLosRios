import dash
from dash import dcc, html, Input, Output, callback
import dash_bootstrap_components as dbc
import pandas as pd
from typing import Dict
import plotly.graph_objects as go
from loguru import logger

from ..etl.processors import ETLPipeline
from ..visualization.charts import OcupacionVisualizer
from ..utils.helpers import PathManager, ConfigManager


class DashboardApp:
    """Aplicación Dash para visualización interactiva de datos de ocupación laboral."""
    
    def __init__(self, base_path: str = None):
        self.config = ConfigManager()
        self.path_manager = PathManager(base_path)
        self.visualizer = OcupacionVisualizer()
        
        # Inicializar la aplicación Dash
        self.app = dash.Dash(
            __name__,
            external_stylesheets=[dbc.themes.BOOTSTRAP],
            suppress_callback_exceptions=True
        )
        
        # Cargar datos
        self.data = self._load_data()
        
        # Configurar layout
        self.app.layout = self._create_layout()
        
        # Registrar callbacks
        self._register_callbacks()
    
    def _load_data(self) -> Dict[str, pd.DataFrame]:
        """Carga los datos procesados."""
        try:
            # Verificar si existen datos procesados
            processed_path = self.path_manager.get_processed_data_path()
            
            if not (processed_path / "ocupacion_laboral_unified.csv").exists():
                logger.info("Datos procesados no encontrados. Ejecutando pipeline ETL...")
                etl = ETLPipeline(self.path_manager.base_path)
                return etl.run_full_pipeline()
            
            # Cargar datos existentes
            unified_df = pd.read_csv(processed_path / "ocupacion_laboral_unified.csv")
            categoria_df = pd.read_csv(processed_path / "categoria_ocupacional_processed.csv")
            grupo_df = pd.read_csv(processed_path / "grupo_ocupacional_processed.csv")
            
            logger.info("Datos cargados exitosamente")
            
            return {
                'categoria_ocupacional': categoria_df,
                'grupo_ocupacional': grupo_df,
                'unified': unified_df
            }
            
        except Exception as e:
            logger.error(f"Error cargando datos: {e}")
            raise
    
    def _create_layout(self) -> html.Div:
        """Crea el layout principal del dashboard."""
        return dbc.Container([
            # Header
            dbc.Row([
                dbc.Col([
                    html.H1(
                        "Dashboard de Ocupación Laboral - Región de Los Ríos",
                        className="text-center mb-4 text-primary"
                    ),
                    html.Hr()
                ])
            ]),
            
            # Controles
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H5("Filtros", className="card-title"),
                            
                            html.Label("Dataset:"),
                            dcc.Dropdown(
                                id='dataset-dropdown',
                                options=[
                                    {'label': 'Datos Unificados', 'value': 'unified'},
                                    {'label': 'Categoría Ocupacional', 'value': 'categoria_ocupacional'},
                                    {'label': 'Grupo Ocupacional CIUO88', 'value': 'grupo_ocupacional'}
                                ],
                                value='unified',
                                className="mb-3"
                            ),
                            
                            html.Label("Sexo:"),
                            dcc.Dropdown(
                                id='sexo-dropdown',
                                multi=True,
                                className="mb-3"
                            ),
                            
                            html.Label("Tipo de Gráfico:"),
                            dcc.Dropdown(
                                id='chart-type-dropdown',
                                options=[
                                    {'label': 'Barras', 'value': 'bar'},
                                    {'label': 'Líneas', 'value': 'line'},
                                    {'label': 'Torta', 'value': 'pie'},
                                    {'label': 'Mapa de Calor', 'value': 'heatmap'},
                                    {'label': 'Box Plot', 'value': 'box'},
                                    {'label': 'Sunburst', 'value': 'sunburst'}
                                ],
                                value='bar',
                                className="mb-3"
                            )
                        ])
                    ])
                ], width=3),
                
                # Gráfico principal
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            dcc.Graph(id='main-chart')
                        ])
                    ])
                ], width=9)
            ], className="mb-4"),
            
            # Métricas
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H4(id='total-ocupados', className="text-center text-info"),
                            html.P("Total Ocupados (miles)", className="text-center text-muted")
                        ])
                    ])
                ], width=3),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H4(id='total-hombres', className="text-center text-primary"),
                            html.P("Hombres Ocupados (miles)", className="text-center text-muted")
                        ])
                    ])
                ], width=3),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H4(id='total-mujeres', className="text-center text-success"),
                            html.P("Mujeres Ocupadas (miles)", className="text-center text-muted")
                        ])
                    ])
                ], width=3),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H4(id='grupos-ocupacionales', className="text-center text-warning"),
                            html.P("Grupos Ocupacionales", className="text-center text-muted")
                        ])
                    ])
                ], width=3)
            ], className="mb-4"),
            
            # Gráficos adicionales
            dbc.Row([
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H5("Evolución Temporal", className="card-title"),
                            dcc.Graph(id='temporal-chart')
                        ])
                    ])
                ], width=6),
                
                dbc.Col([
                    dbc.Card([
                        dbc.CardBody([
                            html.H5("Distribución por Sexo", className="card-title"),
                            dcc.Graph(id='distribution-chart')
                        ])
                    ])
                ], width=6)
            ])
        ], fluid=True)
    
    def _register_callbacks(self):
        """Registra los callbacks del dashboard."""
        
        @self.app.callback(
            Output('sexo-dropdown', 'options'),
            Input('dataset-dropdown', 'value')
        )
        def update_sexo_options(dataset):
            df = self.data[dataset]
            sexo_options = [
                {'label': sexo, 'value': code} 
                for code, sexo in df[['sexo_code', 'sexo_desc']].drop_duplicates().values
            ]
            return sexo_options
        
        @self.app.callback(
            [Output('main-chart', 'figure'),
             Output('total-ocupados', 'children'),
             Output('total-hombres', 'children'),
             Output('total-mujeres', 'children'),
             Output('grupos-ocupacionales', 'children'),
             Output('temporal-chart', 'figure'),
             Output('distribution-chart', 'figure')],
            [Input('dataset-dropdown', 'value'),
             Input('sexo-dropdown', 'value'),
             Input('chart-type-dropdown', 'value')]
        )
        def update_dashboard(dataset, sexo_filter, chart_type):
            df = self.data[dataset].copy()
            
            # Aplicar filtros
            if sexo_filter:
                df = df[df['sexo_code'].isin(sexo_filter)]
            
            # Calcular métricas (valores redondeados)
            total_ocupados = f"{round(df['valor'].sum()):,}"
            
            hombres_data = df[df['sexo_code'] == 'M']
            total_hombres = f"{round(hombres_data['valor'].sum()):,}" if not hombres_data.empty else "0"
            
            mujeres_data = df[df['sexo_code'] == 'F']
            total_mujeres = f"{round(mujeres_data['valor'].sum()):,}" if not mujeres_data.empty else "0"
            
            grupos_ocupacionales = str(df['grupo_ocupacional_desc'].nunique())
            
            # Crear gráfico principal
            try:
                main_fig = self.visualizer.create_chart(df, chart_type)
            except Exception as e:
                logger.error(f"Error creando gráfico principal: {e}")
                main_fig = go.Figure().add_annotation(
                    text="Error al generar el gráfico",
                    xref="paper", yref="paper",
                    x=0.5, y=0.5, showarrow=False
                )
            
            # Gráfico temporal
            try:
                temporal_fig = self.visualizer.create_chart(
                    df, 'line',
                    title='Evolución Temporal',
                    x='trimestre_movil_desc',
                    y='valor',
                    color='sexo_desc'
                )
            except Exception as e:
                logger.error(f"Error creando gráfico temporal: {e}")
                temporal_fig = go.Figure()
            
            # Gráfico de distribución
            try:
                distribution_fig = self.visualizer.create_chart(
                    df[df['sexo_code'] != '_T'], 'pie',
                    title='Distribución por Sexo',
                    values='valor',
                    names='sexo_desc'
                )
            except Exception as e:
                logger.error(f"Error creando gráfico de distribución: {e}")
                distribution_fig = go.Figure()
            
            return (main_fig, total_ocupados, total_hombres, total_mujeres,
                   grupos_ocupacionales, temporal_fig, distribution_fig)
    
    def run(self, debug: bool = True, host: str = None, port: int = None):
        """Ejecuta la aplicación."""
        host = host or self.config.get('dash_host', '127.0.0.1')
        port = port or self.config.get('dash_port', 8050)
        
        logger.info(f"Iniciando dashboard en http://{host}:{port}")
        self.app.run(debug=debug, host=host, port=port)


def create_dashboard(base_path: str = None) -> DashboardApp:
    """Función factory para crear el dashboard."""
    return DashboardApp(base_path)
