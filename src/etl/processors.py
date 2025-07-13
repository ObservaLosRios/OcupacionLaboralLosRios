from typing import Any, Dict, List
import pandas as pd
from pathlib import Path
from loguru import logger

from ..models.base import (
    DataProcessor, 
    CategoriaOcupacionalRecord, 
    GrupoOcupacionalRecord
)
from ..utils.helpers import DataValidator, DataCleaner, PathManager


class CategoriaOcupacionalProcessor(DataProcessor):
    """Procesador específico para datos de categoría ocupacional."""
    
    def __init__(self, path_manager: PathManager):
        self.path_manager = path_manager
        self.validator = DataValidator()
        self.cleaner = DataCleaner()
        self.required_columns = [
            'DTI_CL_TRIMESTRE_MOVIL',
            'Trimestre Móvil',
            'DTI_CL_REGION',
            'Región',
            'DTI_CL_CISE',
            'Grupo ocupacional',
            'DTI_CL_SEXO',
            'Sexo',
            'Value'
        ]
    
    def extract(self, file_path: str) -> pd.DataFrame:
        """Extrae datos del archivo CSV."""
        try:
            full_path = self.path_manager.get_raw_data_path() / file_path
            
            if not self.validator.validate_file_exists(full_path):
                raise FileNotFoundError(f"Archivo no encontrado: {full_path}")
            
            df = pd.read_csv(full_path)
            logger.info(f"Datos extraídos: {len(df)} registros de {file_path}")
            
            return df
        except Exception as e:
            logger.error(f"Error extrayendo datos: {e}")
            raise
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transforma los datos extraídos."""
        try:
            # Validar columnas requeridas
            if not self.validator.validate_dataframe(df, self.required_columns):
                raise ValueError("DataFrame no contiene las columnas requeridas")
            
            # Limpiar datos
            df = self.cleaner.remove_duplicates(df)
            df = self.cleaner.clean_numeric_column(df, 'Value')
            
            # Renombrar columnas para consistencia
            df = df.rename(columns={
                'DTI_CL_TRIMESTRE_MOVIL': 'trimestre_movil',
                'Trimestre Móvil': 'trimestre_movil_desc',
                'DTI_CL_REGION': 'region_code',
                'Región': 'region_name',
                'DTI_CL_CISE': 'grupo_ocupacional_code',
                'Grupo ocupacional': 'grupo_ocupacional_desc',
                'DTI_CL_SEXO': 'sexo_code',
                'Sexo': 'sexo_desc',
                'Value': 'valor'
            })
            
            # Redondear valores a enteros
            df['valor'] = df['valor'].round(0).astype(int)
            
            # Agregar columna de fuente
            df['fuente'] = 'categoria_ocupacional'
            
            logger.info(f"Datos transformados: {len(df)} registros")
            return df
            
        except Exception as e:
            logger.error(f"Error transformando datos: {e}")
            raise
    
    def load(self, df: pd.DataFrame, output_filename: str) -> None:
        """Carga los datos transformados."""
        try:
            output_path = self.path_manager.get_processed_data_path() / output_filename
            df.to_csv(output_path, index=False)
            logger.info(f"Datos guardados en: {output_path}")
        except Exception as e:
            logger.error(f"Error guardando datos: {e}")
            raise


class GrupoOcupacionalProcessor(DataProcessor):
    """Procesador específico para datos de grupo ocupacional CIUO88."""
    
    def __init__(self, path_manager: PathManager):
        self.path_manager = path_manager
        self.validator = DataValidator()
        self.cleaner = DataCleaner()
        self.required_columns = [
            'DTI_CL_TRIMESTRE_MOVIL',
            'Trimestre Móvil',
            'DTI_CL_REGION',
            'Región',
            'DTI_CL_GRUPO_OCU',
            'Grupo ocupacional',
            'DTI_CL_SEXO',
            'Sexo',
            'Value'
        ]
    
    def extract(self, file_path: str) -> pd.DataFrame:
        """Extrae datos del archivo CSV."""
        try:
            full_path = self.path_manager.get_raw_data_path() / file_path
            
            if not self.validator.validate_file_exists(full_path):
                raise FileNotFoundError(f"Archivo no encontrado: {full_path}")
            
            df = pd.read_csv(full_path)
            logger.info(f"Datos extraídos: {len(df)} registros de {file_path}")
            
            return df
        except Exception as e:
            logger.error(f"Error extrayendo datos: {e}")
            raise
    
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """Transforma los datos extraídos."""
        try:
            # Validar columnas requeridas
            if not self.validator.validate_dataframe(df, self.required_columns):
                raise ValueError("DataFrame no contiene las columnas requeridas")
            
            # Limpiar datos
            df = self.cleaner.remove_duplicates(df)
            df = self.cleaner.clean_numeric_column(df, 'Value')
            
            # Renombrar columnas para consistencia
            df = df.rename(columns={
                'DTI_CL_TRIMESTRE_MOVIL': 'trimestre_movil',
                'Trimestre Móvil': 'trimestre_movil_desc',
                'DTI_CL_REGION': 'region_code',
                'Región': 'region_name',
                'DTI_CL_GRUPO_OCU': 'grupo_ocupacional_code',
                'Grupo ocupacional': 'grupo_ocupacional_desc',
                'DTI_CL_SEXO': 'sexo_code',
                'Sexo': 'sexo_desc',
                'Value': 'valor'
            })
            
            # Redondear valores a enteros
            df['valor'] = df['valor'].round(0).astype(int)
            
            # Agregar columna de fuente
            df['fuente'] = 'grupo_ocupacional_ciuo88'
            
            logger.info(f"Datos transformados: {len(df)} registros")
            return df
            
        except Exception as e:
            logger.error(f"Error transformando datos: {e}")
            raise
    
    def load(self, df: pd.DataFrame, output_filename: str) -> None:
        """Carga los datos transformados."""
        try:
            output_path = self.path_manager.get_processed_data_path() / output_filename
            df.to_csv(output_path, index=False)
            logger.info(f"Datos guardados en: {output_path}")
        except Exception as e:
            logger.error(f"Error guardando datos: {e}")
            raise


class ETLPipeline:
    """Pipeline ETL principal que orquesta todos los procesadores."""
    
    def __init__(self, base_path: str = None):
        self.path_manager = PathManager(base_path)
        self.categoria_processor = CategoriaOcupacionalProcessor(self.path_manager)
        self.grupo_processor = GrupoOcupacionalProcessor(self.path_manager)
    
    def run_full_pipeline(self) -> Dict[str, pd.DataFrame]:
        """Ejecuta el pipeline completo de ETL."""
        try:
            logger.info("Iniciando pipeline ETL completo")
            
            # Procesar categoría ocupacional
            logger.info("Procesando datos de categoría ocupacional")
            categoria_df = self.categoria_processor.extract("ocupados_categoria_ocupacional.csv")
            categoria_df = self.categoria_processor.transform(categoria_df)
            self.categoria_processor.load(categoria_df, "categoria_ocupacional_processed.csv")
            
            # Procesar grupo ocupacional
            logger.info("Procesando datos de grupo ocupacional")
            grupo_df = self.grupo_processor.extract("ocupados_grupo_ocupacional_ciuo88.csv")
            grupo_df = self.grupo_processor.transform(grupo_df)
            self.grupo_processor.load(grupo_df, "grupo_ocupacional_processed.csv")
            
            # Crear dataset unificado
            logger.info("Creando dataset unificado")
            unified_df = pd.concat([categoria_df, grupo_df], ignore_index=True)
            unified_path = self.path_manager.get_processed_data_path() / "ocupacion_laboral_unified.csv"
            unified_df.to_csv(unified_path, index=False)
            
            logger.info("Pipeline ETL completado exitosamente")
            
            return {
                'categoria_ocupacional': categoria_df,
                'grupo_ocupacional': grupo_df,
                'unified': unified_df
            }
            
        except Exception as e:
            logger.error(f"Error en pipeline ETL: {e}")
            raise
