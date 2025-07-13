#!/usr/bin/env python3
"""
Comparación de valores: decimales vs enteros redondeados
"""

import pandas as pd

def comparar_valores():
    """Compara valores originales vs valores redondeados."""
    print("=== Comparación de Valores: Decimales vs Enteros ===\n")
    
    # Leer algunos valores originales del CSV raw
    df_original = pd.read_csv('data/raw/ocupados_categoria_ocupacional.csv')
    # Convertir la columna Value a numérico
    df_original['Value'] = pd.to_numeric(df_original['Value'], errors='coerce')
    
    print("📊 Valores originales del CSV (primeros 10):")
    print(df_original[['Grupo ocupacional', 'Sexo', 'Value']].head(10))
    ejemplo_valor = df_original['Value'].iloc[0]
    print(f"Ejemplo: {ejemplo_valor} → {round(ejemplo_valor)}")
    
    # Leer valores procesados (redondeados)
    df_procesado = pd.read_csv('data/processed/ocupacion_laboral_unified.csv')
    print(f"\n📈 Valores procesados redondeados (primeros 10):")
    print(df_procesado[['grupo_ocupacional_desc', 'sexo_desc', 'valor']].head(10))
    
    # Comparar totales
    total_original = df_original['Value'].sum()
    total_procesado = df_procesado['valor'].sum()
    diferencia = abs(total_original - total_procesado)
    
    print(f"\n📊 Comparación de totales:")
    print(f"Total original (decimales): {total_original:,.3f} miles")
    print(f"Total redondeado (enteros): {total_procesado:,} miles")
    print(f"Diferencia por redondeo: {diferencia:,.3f} miles")
    print(f"Porcentaje de diferencia: {(diferencia/total_original)*100:.4f}%")
    
    print(f"\n✅ Beneficios del redondeo:")
    print(f"• Valores más limpios y fáciles de leer")
    print(f"• Eliminación de decimales innecesarios")
    print(f"• Mejor presentación en gráficos")
    print(f"• Diferencia mínima: {(diferencia/total_original)*100:.4f}%")

if __name__ == "__main__":
    comparar_valores()
