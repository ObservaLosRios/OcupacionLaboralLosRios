from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, validator
from datetime import datetime


class OcupacionRecord(BaseModel):
    """Modelo base para registros de ocupación laboral."""
    
    trimestre_movil: str
    trimestre_movil_desc: str
    region_code: str
    region_name: str
    grupo_ocupacional_code: str
    grupo_ocupacional_desc: str
    sexo_code: str
    sexo_desc: str
    value: float
    
    @validator('value')
    def validate_value(cls, v):
        if v < 0:
            raise ValueError('El valor no puede ser negativo')
        return v
    
    @validator('trimestre_movil')
    def validate_trimestre_format(cls, v):
        if not v or len(v) < 7:
            raise ValueError('Formato de trimestre inválido')
        return v


class CategoriaOcupacionalRecord(OcupacionRecord):
    """Modelo específico para datos de categoría ocupacional."""
    pass


class GrupoOcupacionalRecord(OcupacionRecord):
    """Modelo específico para datos de grupo ocupacional CIUO88."""
    pass


class DataProcessor(ABC):
    """Interfaz abstracta para procesadores de datos."""
    
    @abstractmethod
    def extract(self, file_path: str) -> List[Dict[str, Any]]:
        """Extrae datos de un archivo."""
        pass
    
    @abstractmethod
    def transform(self, data: List[Dict[str, Any]]) -> List[BaseModel]:
        """Transforma los datos extraídos."""
        pass
    
    @abstractmethod
    def load(self, data: List[BaseModel], output_path: str) -> None:
        """Carga los datos transformados."""
        pass


class Visualizer(ABC):
    """Interfaz abstracta para visualizadores."""
    
    @abstractmethod
    def create_chart(self, data: Any, **kwargs) -> Any:
        """Crea un gráfico con los datos proporcionados."""
        pass
