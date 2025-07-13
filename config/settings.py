# Configuración de rutas de datos
RAW_DATA_PATH = "data/raw"
PROCESSED_DATA_PATH = "data/processed"
EXTERNAL_DATA_PATH = "data/external"
REPORTS_PATH = "reports"

# Archivos de datos
OCUPADOS_CATEGORIA_FILE = "ocupados_categoria_ocupacional.csv"
OCUPADOS_GRUPO_FILE = "ocupados_grupo_ocupacional_ciuo88.csv"

# Configuración de logging
LOG_LEVEL = "INFO"
LOG_FORMAT = "{time:YYYY-MM-DD HH:mm:ss} | {level} | {message}"

# Configuración de visualización
PLOTLY_TEMPLATE = "plotly_white"
COLORS = {
    "primary": "#1f77b4",
    "secondary": "#ff7f0e", 
    "success": "#2ca02c",
    "info": "#17a2b8",
    "warning": "#ffc107",
    "danger": "#dc3545"
}

# Configuración de la aplicación Dash
DASH_HOST = "127.0.0.1"
DASH_PORT = 8050
DASH_DEBUG = True
