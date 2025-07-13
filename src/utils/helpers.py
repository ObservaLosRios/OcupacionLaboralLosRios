from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import pandas as pd
from loguru import logger
import sys
import os

# Configurar logging
logger.remove()
logger.add(
    sys.stdout,
    format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {function} | {message}",
    level="INFO"
)


class PathManager:
    """Gestor de rutas del proyecto siguiendo principios SOLID."""
    
    def __init__(self, base_path: Optional[Union[str, Path]] = None):
        self.base_path = Path(base_path) if base_path else Path.cwd()
        self._ensure_directories()
    
    def _ensure_directories(self) -> None:
        """Crea los directorios necesarios si no existen."""
        directories = [
            "data/raw",
            "data/processed", 
            "data/external",
            "reports",
            "logs"
        ]
        
        for directory in directories:
            dir_path = self.base_path / directory
            dir_path.mkdir(parents=True, exist_ok=True)
    
    def get_raw_data_path(self) -> Path:
        """Retorna la ruta de datos raw."""
        return self.base_path / "data" / "raw"
    
    def get_processed_data_path(self) -> Path:
        """Retorna la ruta de datos procesados."""
        return self.base_path / "data" / "processed"
    
    def get_reports_path(self) -> Path:
        """Retorna la ruta de reportes."""
        return self.base_path / "reports"


class DataValidator:
    """Validador de datos con principios de responsabilidad única."""
    
    @staticmethod
    def validate_dataframe(df: pd.DataFrame, required_columns: List[str]) -> bool:
        """Valida que un DataFrame tenga las columnas requeridas."""
        try:
            missing_columns = set(required_columns) - set(df.columns)
            if missing_columns:
                logger.error(f"Columnas faltantes: {missing_columns}")
                return False
            return True
        except Exception as e:
            logger.error(f"Error en validación: {e}")
            return False
    
    @staticmethod
    def validate_file_exists(file_path: Union[str, Path]) -> bool:
        """Valida que un archivo exista."""
        path = Path(file_path)
        if not path.exists():
            logger.error(f"Archivo no encontrado: {file_path}")
            return False
        return True


class DataCleaner:
    """Limpiador de datos con principios de responsabilidad única."""
    
    @staticmethod
    def clean_numeric_column(df: pd.DataFrame, column: str) -> pd.DataFrame:
        """Limpia una columna numérica."""
        try:
            # Reemplazar valores no numéricos por NaN
            df[column] = pd.to_numeric(df[column], errors='coerce')
            
            # Eliminar valores negativos si es necesario
            df = df[df[column] >= 0]
            
            # Llenar valores NaN con 0
            df[column] = df[column].fillna(0)
            
            logger.info(f"Columna {column} limpiada exitosamente")
            return df
        except Exception as e:
            logger.error(f"Error limpiando columna {column}: {e}")
            return df
    
    @staticmethod
    def remove_duplicates(df: pd.DataFrame) -> pd.DataFrame:
        """Elimina duplicados del DataFrame."""
        initial_count = len(df)
        df = df.drop_duplicates()
        final_count = len(df)
        
        if initial_count != final_count:
            logger.info(f"Eliminados {initial_count - final_count} registros duplicados")
        
        return df


class ConfigManager:
    """Gestor de configuración siguiendo principios SOLID."""
    
    def __init__(self):
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Carga la configuración desde variables de entorno y defaults."""
        return {
            'raw_data_path': os.getenv('RAW_DATA_PATH', 'data/raw'),
            'processed_data_path': os.getenv('PROCESSED_DATA_PATH', 'data/processed'),
            'log_level': os.getenv('LOG_LEVEL', 'INFO'),
            'plotly_template': os.getenv('PLOTLY_TEMPLATE', 'plotly_white'),
            'dash_host': os.getenv('DASH_HOST', '127.0.0.1'),
            'dash_port': int(os.getenv('DASH_PORT', '8050')),
        }
    
    def get(self, key: str, default: Any = None) -> Any:
        """Obtiene un valor de configuración."""
        return self.config.get(key, default)
