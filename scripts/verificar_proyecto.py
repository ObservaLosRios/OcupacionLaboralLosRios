#!/usr/bin/env python3
"""
Script de verificación final del proyecto
Verifica que todos los componentes estén correctamente organizados
"""

import os
import sys
from pathlib import Path

def verificar_estructura():
    """Verifica que la estructura del proyecto sea correcta."""
    print("🔍 VERIFICACIÓN FINAL DEL PROYECTO")
    print("=" * 50)
    
    base_path = Path("/Users/brunosanmartin/Documents/Uach/OcupacionLaboral_LosRios")
    
    # Estructura esperada
    estructura_esperada = {
        "📂 Archivos principales": [
            "README.md",
            "LICENSE", 
            "requirements.txt",
            "setup.py",
            "pyproject.toml",
            "Makefile",
            "CHANGELOG.md",
            "main.py"
        ],
        "📂 Configuración": [
            "config/settings.py",
            ".gitignore",
            "MANIFEST.in"
        ],
        "📂 Código fuente": [
            "src/__init__.py",
            "src/etl/__init__.py",
            "src/models/__init__.py", 
            "src/utils/__init__.py",
            "src/visualization/__init__.py",
            "src/utils/comparar_valores.py"
        ],
        "📂 Tests": [
            "tests/test_dashboard.py",
            "tests/test_etl.py"
        ],
        "📂 Documentación": [
            "docs/DEVELOPMENT.md"
        ],
        "📂 Notebooks": [
            "notebooks/exploratory_data_analysis copy 2.ipynb"
        ]
    }
    
    # Verificar cada categoría
    total_archivos = 0
    archivos_encontrados = 0
    
    for categoria, archivos in estructura_esperada.items():
        print(f"\n{categoria}:")
        for archivo in archivos:
            total_archivos += 1
            archivo_path = base_path / archivo
            if archivo_path.exists():
                print(f"  ✅ {archivo}")
                archivos_encontrados += 1
            else:
                print(f"  ❌ {archivo} (FALTANTE)")
    
    # Resumen
    print(f"\n📊 RESUMEN:")
    print(f"  • Archivos esperados: {total_archivos}")
    print(f"  • Archivos encontrados: {archivos_encontrados}")
    print(f"  • Completitud: {(archivos_encontrados/total_archivos)*100:.1f}%")
    
    if archivos_encontrados == total_archivos:
        print(f"\n✅ PROYECTO CORRECTAMENTE ORGANIZADO")
        print(f"🎉 Felicitaciones! El proyecto está listo para producción")
    else:
        print(f"\n⚠️ FALTAN ALGUNOS ARCHIVOS")
        print(f"📝 Revisar la estructura y crear archivos faltantes")
    
    # Verificar que los archivos principales tengan contenido
    print(f"\n🔍 VERIFICACIÓN DE CONTENIDO:")
    archivos_criticos = ["README.md", "requirements.txt", "setup.py", "src/__init__.py"]
    
    for archivo in archivos_criticos:
        archivo_path = base_path / archivo
        if archivo_path.exists():
            size = archivo_path.stat().st_size
            if size > 100:  # Al menos 100 bytes
                print(f"  ✅ {archivo} (contenido OK)")
            else:
                print(f"  ⚠️ {archivo} (muy pequeño)")
        else:
            print(f"  ❌ {archivo} (no existe)")
    
    # Información del autor
    print(f"\n👨‍💻 INFORMACIÓN DEL PROYECTO:")
    print(f"  • Autor: Bruno San Martín Navarro")
    print(f"  • Institución: Universidad Austral de Chile")
    print(f"  • Rol: Científico de Datos")
    print(f"  • Proyecto: Análisis Ocupación Laboral - Los Ríos")
    print(f"  • Versión: 1.0.0")
    print(f"  • Fecha: Julio 2025")
    
    print(f"\n🚀 PRÓXIMOS PASOS:")
    print(f"  1. Activar entorno virtual: source venv/bin/activate")
    print(f"  2. Instalar dependencias: make install") 
    print(f"  3. Ejecutar tests: make test")
    print(f"  4. Ejecutar análisis: make run")
    print(f"  5. Ver dashboard: make dashboard")
    
    print("=" * 50)

if __name__ == "__main__":
    verificar_estructura()
