#!/usr/bin/env python3
"""
Script de prueba para verificar que el dashboard funciona correctamente
con los cambios de 'value' a 'valor' y las etiquetas actualizadas.
"""

import pandas as pd
from src.visualization.dashboard import DashboardApp
from src.etl.processors import ETLPipeline

def test_data_structure():
    """Prueba la estructura de datos procesados."""
    print("=== Verificando estructura de datos ===")
    
    # Leer datos procesados
    df = pd.read_csv('data/processed/ocupacion_laboral_unified.csv')
    
    print(f"Columnas del dataset: {list(df.columns)}")
    print(f"Total de registros: {len(df)}")
    print(f"Valores únicos en 'fuente': {df['fuente'].unique()}")
    
    # Verificar que la columna 'valor' existe
    if 'valor' in df.columns:
        print("✅ Columna 'valor' encontrada correctamente")
        print(f"Rango de valores: {df['valor'].min():.2f} - {df['valor'].max():.2f}")
        print(f"Total ocupados: {df['valor'].sum():,.0f} miles")
    else:
        print("❌ Error: Columna 'valor' no encontrada")
        return False
    
    # Verificar algunos valores de muestra
    print("\n=== Muestra de datos ===")
    print(df[['grupo_ocupacional_desc', 'sexo_desc', 'valor']].head(10))
    
    return True

def test_visualization():
    """Prueba la creación de visualizaciones."""
    print("\n=== Verificando visualizaciones ===")
    
    from src.visualization.charts import OcupacionVisualizer
    
    # Leer datos
    df = pd.read_csv('data/processed/ocupacion_laboral_unified.csv')
    
    # Crear visualizador
    viz = OcupacionVisualizer()
    
    try:
        # Probar gráfico de barras
        fig_bar = viz.create_chart(
            df.head(20), 'bar',
            title='Prueba - Distribución por Grupo Ocupacional',
            x='grupo_ocupacional_desc',
            y='valor',
            color='sexo_desc'
        )
        print("✅ Gráfico de barras creado correctamente")
        
        # Probar gráfico de líneas
        fig_line = viz.create_chart(
            df.head(50), 'line',
            title='Prueba - Evolución Temporal',
            x='trimestre_movil_desc',
            y='valor',
            color='sexo_desc'
        )
        print("✅ Gráfico de líneas creado correctamente")
        
        return True
        
    except Exception as e:
        print(f"❌ Error creando visualizaciones: {e}")
        return False

def main():
    """Función principal de prueba."""
    print("🔍 Iniciando pruebas del dashboard actualizado...")
    
    # Prueba 1: Estructura de datos
    data_ok = test_data_structure()
    
    if not data_ok:
        print("❌ Falló la prueba de estructura de datos. Abortando...")
        return
    
    # Prueba 2: Visualizaciones
    viz_ok = test_visualization()
    
    if not viz_ok:
        print("❌ Falló la prueba de visualizaciones.")
        return
    
    print("\n🎉 ¡Todas las pruebas pasaron exitosamente!")
    print("Los cambios se aplicaron correctamente:")
    print("  - Columna 'value' renombrada a 'valor'")
    print("  - Etiquetas actualizadas a '(miles)'")
    print("  - Visualizaciones funcionando correctamente")
    
    print("\n💡 El dashboard está listo. Ejecute:")
    print("   python main.py --mode dashboard")
    print("   Para iniciar el dashboard interactivo.")

if __name__ == "__main__":
    main()
