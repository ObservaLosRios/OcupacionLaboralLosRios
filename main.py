"""
ETL Pipeline para Análisis de Ocupación Laboral - Región de Los Ríos

Este script ejecuta el pipeline completo de ETL y genera visualizaciones
interactivas para el análisis de datos de ocupación laboral.

Uso:
    python main.py [--mode etl|dashboard|both] [--base-path PATH]

Ejemplos:
    python main.py --mode etl                    # Solo ejecutar ETL
    python main.py --mode dashboard              # Solo ejecutar dashboard
    python main.py --mode both                   # Ejecutar ETL y dashboard
    python main.py --base-path /path/to/data    # Especificar ruta base
"""

import argparse
import sys
from pathlib import Path
from loguru import logger

# Agregar el directorio src al path
sys.path.append(str(Path(__file__).parent / "src"))

from src.etl.processors import ETLPipeline
from src.visualization.dashboard import create_dashboard
from src.utils.helpers import PathManager


def setup_logging():
    """Configura el sistema de logging."""
    logger.remove()
    logger.add(
        sys.stdout,
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {function} | {message}",
        level="INFO"
    )
    
    # Log a archivo
    logger.add(
        "logs/etl_pipeline.log",
        format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {function} | {message}",
        level="DEBUG",
        rotation="1 day",
        retention="30 days"
    )


def run_etl_pipeline(base_path: str = None):
    """Ejecuta el pipeline ETL completo."""
    try:
        logger.info("=== Iniciando Pipeline ETL ===")
        
        etl = ETLPipeline(base_path)
        results = etl.run_full_pipeline()
        
        # Mostrar resumen de resultados
        logger.info("=== Resumen de Resultados ===")
        for dataset_name, df in results.items():
            logger.info(f"{dataset_name}: {len(df)} registros procesados")
        
        logger.info("=== Pipeline ETL Completado ===")
        return results
        
    except Exception as e:
        logger.error(f"Error en pipeline ETL: {e}")
        raise


def run_dashboard(base_path: str = None):
    """Ejecuta el dashboard interactivo."""
    try:
        logger.info("=== Iniciando Dashboard Interactivo ===")
        
        dashboard = create_dashboard(base_path)
        dashboard.run(debug=True)
        
    except Exception as e:
        logger.error(f"Error en dashboard: {e}")
        raise


def main():
    """Función principal."""
    parser = argparse.ArgumentParser(
        description="Pipeline ETL y Dashboard para Análisis de Ocupación Laboral"
    )
    
    parser.add_argument(
        '--mode',
        choices=['etl', 'dashboard', 'both'],
        default='both',
        help='Modo de ejecución: etl, dashboard, o both (default: both)'
    )
    
    parser.add_argument(
        '--base-path',
        type=str,
        default=None,
        help='Ruta base del proyecto (default: directorio actual)'
    )
    
    parser.add_argument(
        '--host',
        type=str,
        default='127.0.0.1',
        help='Host para el dashboard (default: 127.0.0.1)'
    )
    
    parser.add_argument(
        '--port',
        type=int,
        default=8050,
        help='Puerto para el dashboard (default: 8050)'
    )
    
    args = parser.parse_args()
    
    # Configurar logging
    setup_logging()
    
    # Configurar ruta base
    base_path = args.base_path or str(Path.cwd())
    path_manager = PathManager(base_path)
    
    logger.info(f"Ruta base del proyecto: {base_path}")
    logger.info(f"Modo de ejecución: {args.mode}")
    
    try:
        if args.mode in ['etl', 'both']:
            results = run_etl_pipeline(base_path)
            
            if args.mode == 'etl':
                logger.info("Pipeline ETL completado. Finalizando...")
                return
        
        if args.mode in ['dashboard', 'both']:
            logger.info("Iniciando dashboard...")
            logger.info(f"Dashboard disponible en: http://{args.host}:{args.port}")
            run_dashboard(base_path)
    
    except KeyboardInterrupt:
        logger.info("Proceso interrumpido por el usuario")
    except Exception as e:
        logger.error(f"Error en la ejecución: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
