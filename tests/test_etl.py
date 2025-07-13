import unittest
import pandas as pd
import sys
from pathlib import Path

# Agregar src al path
sys.path.append(str(Path(__file__).parent.parent / "src"))

from src.etl.processors import CategoriaOcupacionalProcessor, GrupoOcupacionalProcessor
from src.utils.helpers import PathManager, DataValidator, DataCleaner


class TestETLProcessors(unittest.TestCase):
    """Tests para los procesadores ETL."""
    
    def setUp(self):
        """Configuración inicial para los tests."""
        self.path_manager = PathManager()
        self.categoria_processor = CategoriaOcupacionalProcessor(self.path_manager)
        self.grupo_processor = GrupoOcupacionalProcessor(self.path_manager)
    
    def test_data_validator(self):
        """Test del validador de datos."""
        df = pd.DataFrame({
            'col1': [1, 2, 3],
            'col2': ['a', 'b', 'c']
        })
        
        # Test validación exitosa
        self.assertTrue(
            DataValidator.validate_dataframe(df, ['col1', 'col2'])
        )
        
        # Test validación fallida
        self.assertFalse(
            DataValidator.validate_dataframe(df, ['col1', 'col3'])
        )
    
    def test_data_cleaner(self):
        """Test del limpiador de datos."""
        df = pd.DataFrame({
            'value': [1.0, -1.0, 'invalid', 3.0, None]
        })
        
        cleaned_df = DataCleaner.clean_numeric_column(df, 'value')
        
        # Verificar que los valores negativos fueron removidos
        self.assertTrue(all(cleaned_df['value'] >= 0))
        
        # Verificar que no hay valores NaN
        self.assertFalse(cleaned_df['value'].isna().any())
    
    def test_remove_duplicates(self):
        """Test de eliminación de duplicados."""
        df = pd.DataFrame({
            'col1': [1, 1, 2, 3],
            'col2': ['a', 'a', 'b', 'c']
        })
        
        cleaned_df = DataCleaner.remove_duplicates(df)
        
        # Verificar que se eliminaron duplicados
        self.assertEqual(len(cleaned_df), 3)


class TestDataModels(unittest.TestCase):
    """Tests para los modelos de datos."""
    
    def test_ocupacion_record_validation(self):
        """Test de validación de registros de ocupación."""
        from src.models.base import OcupacionRecord
        
        # Test registro válido
        valid_record = OcupacionRecord(
            trimestre_movil="2018-V06",
            trimestre_movil_desc="2018 may-jul",
            region_code="CHL14",
            region_name="Región de Los Ríos",
            grupo_ocupacional_code="ICSE93_T",
            grupo_ocupacional_desc="Total",
            sexo_code="_T",
            sexo_desc="Ambos sexos",
            value=188.554
        )
        
        self.assertEqual(valid_record.value, 188.554)
        
        # Test valor negativo (debería fallar)
        with self.assertRaises(ValueError):
            OcupacionRecord(
                trimestre_movil="2018-V06",
                trimestre_movil_desc="2018 may-jul",
                region_code="CHL14",
                region_name="Región de Los Ríos",
                grupo_ocupacional_code="ICSE93_T",
                grupo_ocupacional_desc="Total",
                sexo_code="_T",
                sexo_desc="Ambos sexos",
                value=-100.0
            )


if __name__ == '__main__':
    unittest.main()
