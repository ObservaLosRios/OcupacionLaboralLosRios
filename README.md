# 📊 Análisis de Ocupación Laboral - Región de Los Ríos

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Code style: black](https://img.shields.io/badge/code%20style-black-000000.svg)](https://github.com/psf/black)

## 📋 Descripción

Este proyecto realiza un análisis comprehensivo de los datos de ocupación laboral en la Región de Los Ríos, Chile. Utilizando técnicas avanzadas de ciencia de datos, el proyecto examina patrones temporales, distribuciones por género, categorías ocupacionales y tendencias del mercado laboral regional.

**Autor:** Bruno San Martín Navarro  
**Institución:** Universidad Austral de Chile (UACh)  
**Rol:** Científico de Datos  
**Fecha:** Julio 2025

## 🎯 Objetivos

- **Análisis Temporal**: Evaluar la evolución de la ocupación laboral desde 2010 hasta 2024
- **Segmentación por Género**: Identificar brechas y patrones de género en el empleo
- **Categorización Ocupacional**: Analizar la distribución por categorías y grupos ocupacionales
- **Detección de Anomalías**: Identificar cambios significativos y sus posibles causas
- **Visualización Interactiva**: Crear dashboards para exploración de datos
- **Insights Estratégicos**: Generar recomendaciones basadas en evidencia

## 🚀 Características Principales

### 📈 Análisis de Datos
- **ETL Robusto**: Pipeline completo de extracción, transformación y carga
- **Calidad de Datos**: Validación automática y detección de inconsistencias
- **Análisis Temporal**: Series de tiempo con detección de tendencias y estacionalidad
- **Análisis Multivariado**: Correlaciones y clustering de categorías ocupacionales

### 📊 Visualizaciones
- **Gráficos Interactivos**: Plotly para exploración dinámica
- **Estilo Profesional**: Diseño inspirado en The Economist
- **Dashboard Web**: Interfaz Dash para análisis en tiempo real
- **Exports**: Generación automática de reportes PDF/HTML

### 🔧 Ingeniería de Datos
- **Arquitectura Modular**: Código organizado en paquetes especializados
- **Testing Automatizado**: Suite completa de pruebas unitarias
- **Logging**: Sistema de logging estructurado con Loguru
- **Configuración**: Manejo centralizado de configuraciones

## 📁 Estructura del Proyecto

```
OcupacionLaboral_LosRios/
├── 📂 config/                 # Configuraciones del proyecto
│   ├── settings.yaml          # Configuración principal
│   └── database.yaml          # Configuración de datos
├── 📂 data/                   # Datos del proyecto
│   ├── 📂 raw/               # Datos originales sin procesar
│   ├── 📂 processed/         # Datos procesados y limpios
│   └── 📂 external/          # Datos externos de referencia
├── 📂 docs/                   # Documentación del proyecto
├── 📂 logs/                   # Archivos de log
├── 📂 notebooks/              # Jupyter notebooks para análisis
│   ├── ocupados_categoria_ocupacional.ipynb        # Análisis básico por categoría
│   ├── ocupados_grupo_ocupacional_ciuo88.ipynb     # Análisis por grupo ocupacional
│   └── analisis_avanzado_los_rios.ipynb           # Análisis avanzado con The Economist styling
├── 📂 reports/                # Reportes generados
│   ├── 📂 figures/           # Gráficos y visualizaciones
│   └── 📂 tables/            # Tablas de resultados
├── 📂 scripts/                # Scripts de utilidad
├── 📂 src/                    # Código fuente principal
│   ├── 📂 etl/               # Procesos ETL
│   │   ├── extract.py        # Extracción de datos
│   │   ├── transform.py      # Transformación de datos
│   │   └── load.py           # Carga de datos
│   ├── 📂 models/            # Modelos de datos
│   │   ├── data_models.py    # Modelos Pydantic
│   │   └── schemas.py        # Esquemas de validación
│   ├── 📂 utils/             # Utilidades
│   │   ├── data_quality.py   # Validación de calidad
│   │   ├── logger.py         # Configuración de logging
│   │   └── comparar_valores.py # Comparación de valores
│   └── 📂 visualization/     # Módulos de visualización
│       ├── charts.py         # Gráficos estáticos
│       ├── dashboard.py      # Dashboard interactivo
│       └── themes.py         # Temas y estilos
├── 📂 tests/                  # Pruebas automatizadas
│   ├── test_etl.py           # Tests para ETL
│   ├── test_models.py        # Tests para modelos
│   └── test_dashboard.py     # Tests para dashboard
├── 📄 main.py                 # Punto de entrada principal
├── 📄 requirements.txt        # Dependencias Python
├── 📄 setup.py               # Configuración de instalación
├── 📄 README.md              # Este archivo
└── 📄 LICENSE                # Licencia MIT
```

## 🛠️ Instalación

### Prerrequisitos
- Python 3.8 o superior
- Git
- pip (gestor de paquetes de Python)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone https://github.com/brunosanmartin/OcupacionLaboral_LosRios.git
cd OcupacionLaboral_LosRios
```

2. **Crear entorno virtual**
```bash
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate
```

3. **Instalar dependencias**
```bash
pip install -r requirements.txt
```

4. **Instalar el paquete en modo desarrollo**
```bash
pip install -e .
```

5. **Verificar instalación**
```bash
python -m pytest tests/
```

## 🚀 Uso Rápido

### Uso Rápido

### Análisis Básico
```python
from src.etl.processors import DataProcessor
from src.visualization.dashboard import create_dashboard

# Procesamiento de datos
processor = DataProcessor()
data = processor.process_all_datasets()

# Crear dashboard
app = create_dashboard(data)
app.run_server(debug=True)
```

### Ejecutar desde línea de comandos
```bash
# Ejecutar dashboard completo
python main.py

# Solo procesamiento ETL
python -m src.etl.processors

# Solo dashboard
python -m src.visualization.dashboard
```

### Jupyter Notebooks
```bash
# Iniciar Jupyter Lab
jupyter lab

# Abrir notebooks recomendados:
# - analisis_avanzado_los_rios.ipynb (análisis completo)
# - ocupados_categoria_ocupacional.ipynb (análisis básico)
```

## 📊 Datos

### Fuentes de Datos
- **Categoría Ocupacional**: `ocupados_categoria_ocupacional.csv`
- **Grupo Ocupacional**: `ocupados_grupo_ocupacional_ciuo88.csv`

### Período de Análisis
- **Datos Completos**: 2010-2019 (ambas fuentes)
- **Datos Parciales**: 2020-2024 (solo Categoría Ocupacional)

### Variables Principales
- **Temporal**: Trimestre móvil, año
- **Geográfica**: Región de Los Ríos (CHL14)
- **Demográfica**: Sexo (Hombres, Mujeres, Total)
- **Ocupacional**: Categoría ICSE93, Grupo CIUO88
- **Métrica**: Número de ocupados (en miles)

## 📈 Resultados Principales

### Hallazgos Clave
1. **Tendencia General**: Crecimiento sostenido 2010-2019, impacto COVID-19 en 2020
2. **Brecha de Género**: Participación históricamente mayor de hombres
3. **Estacionalidad**: Variaciones trimestrales relacionadas con actividades agrícolas
4. **Categorías Dominantes**: Trabajadores por cuenta propia y asalariados privados

### Anomalías Detectadas
- **2020**: Caída del -76.6% (impacto COVID-19)
- **2021**: Recuperación del +110.7%
- **2024**: Caída del -85.6% (datos incompletos)
- `DataCleaner`: Solo limpieza de datos
- `PathManager`: Solo gestión de rutas

#### Open/Closed Principle (OCP)
- Clases abiertas para extensión, cerradas para modificación
## 🔧 Desarrollo

### Ejecutar Tests
```bash
# Todos los tests
pytest

# Tests con cobertura
pytest --cov=src --cov-report=html

# Tests específicos
pytest tests/test_etl.py
```

### Formateo de Código
```bash
# Formatear código
black src/ tests/

# Verificar estilo
flake8 src/ tests/

# Type checking
mypy src/
```

### Contribuir
1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📚 Documentación

### Notebooks de Análisis
- **`ocupados_categoria_ocupacional.ipynb`**: Análisis básico por categoría ocupacional
- **`ocupados_grupo_ocupacional_ciuo88.ipynb`**: Análisis por grupo ocupacional CIUO88
- **`analisis_avanzado_los_rios.ipynb`**: Análisis avanzado con visualizaciones The Economist, análisis de género, estabilidad laboral y detección de anomalías

### Documentación Técnica
- Documentación de API en `docs/`
- Docstrings en formato Google Style
- Ejemplos de uso en cada módulo

## ⚠️ Limitaciones y Consideraciones

### Calidad de Datos
- **Datos 2020-2024**: Solo disponibles para Categoría Ocupacional
- **Datos Faltantes**: Grupo Ocupacional requiere actualización
- **Precisión**: Valores en miles, redondeo puede introducir pequeñas diferencias

### Interpretación
- Las caídas en 2020 y 2024 requieren contexto adicional
- Los datos de 2024 son preliminares y pueden cambiar
- El análisis asume continuidad metodológica en la recolección

## 🔮 Trabajo Futuro

### Mejoras Técnicas
- [ ] Integración con APIs gubernamentales para datos en tiempo real
- [ ] Modelos de predicción temporal con ML
- [ ] Análisis de impacto económico regional
- [ ] Dashboard público con datos actualizados

### Análisis Adicionales
- [ ] Comparación con otras regiones de Chile
- [ ] Análisis de productividad por sector
- [ ] Correlaciones con indicadores económicos
- [ ] Análisis de políticas públicas de empleo

## 🤝 Contacto y Soporte

**Bruno San Martín Navarro**  
📧 Email: bruno.sanmartin@uach.cl  
🏛️ Institución: Universidad Austral de Chile  
💼 LinkedIn: [bruno-sanmartin-navarro](https://linkedin.com/in/bruno-sanmartin-navarro)  
🐙 GitHub Personal: [@brunosanmartin](https://github.com/brunosanmartin)  
🏢 Organización: [ObservaLosRios](https://github.com/ObservaLosRios)

### 📍 Proyecto Repositorio
- **URL**: https://github.com/ObservaLosRios/OcupacionLaboralLosRios
- **Organización**: ObservaLosRios - Observatorio Económico de Los Ríos

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo [LICENSE](LICENSE) para más detalles.

## 🙏 Agradecimientos

- Universidad Austral de Chile por el soporte institucional
- INE Chile por la provisión de datos estadísticos
- Comunidad open source por las herramientas utilizadas
- Colegas del área de ciencia de datos por sus valiosos aportes

---

**⭐ Si este proyecto te resulta útil, considera darle una estrella en GitHub!**
```bash
python main.py --mode both --base-path /ruta/personalizada --host 0.0.0.0 --port 8080
```

## Funcionalidades

### Pipeline ETL

1. **Extract**: Carga datos desde archivos CSV
2. **Transform**: 
   - Validación de datos
   - Limpieza de valores nulos y duplicados
   - Normalización de columnas
   - Agregación de metadatos
3. **Load**: Guarda datos procesados en formato CSV

### Dashboard Interactivo

- **Filtros Dinámicos**: Selección por dataset, sexo, y otros criterios
- **Múltiples Visualizaciones**:
  - Gráficos de barras
  - Gráficos de líneas temporales
  - Gráficos de torta
  - Mapas de calor
  - Box plots
  - Gráficos sunburst
- **Métricas en Tiempo Real**: Totales y estadísticas actualizadas
- **Responsive Design**: Compatible con diferentes dispositivos

### Tipos de Análisis

1. **Análisis Temporal**: Evolución de la ocupación a lo largo del tiempo
2. **Análisis por Género**: Comparación entre hombres y mujeres
3. **Análisis Ocupacional**: Distribución por grupos ocupacionales
4. **Análisis Comparativo**: Comparación entre diferentes datasets

## Datos

### Fuentes de Datos
- **ocupados_categoria_ocupacional.csv**: Datos de ocupación por categoría ocupacional
- **ocupados_grupo_ocupacional_ciuo88.csv**: Datos de ocupación por grupo ocupacional CIUO88

### Estructura de Datos Procesados
```
- trimestre_movil: Código del trimestre móvil
- trimestre_movil_desc: Descripción del trimestre
- region_code: Código de la región
- region_name: Nombre de la región
- grupo_ocupacional_code: Código del grupo ocupacional
- grupo_ocupacional_desc: Descripción del grupo ocupacional
- sexo_code: Código del sexo
- sexo_desc: Descripción del sexo
- value: Número de ocupados
- fuente: Fuente del dato
```

## Testing

Ejecutar tests unitarios:
```bash
python -m pytest tests/ -v
```

## Configuración

La configuración se encuentra en `config/settings.py` y puede ser personalizada mediante variables de entorno.

## Logging

Los logs se guardan en:
- **Consola**: Información general
- **Archivo**: `logs/etl_pipeline.log` (rotación diaria)

## Contribución

1. Fork el proyecto
2. Crear una rama para la funcionalidad (`git checkout -b feature/nueva-funcionalidad`)
3. Commit los cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear un Pull Request

## Próximas Mejoras

- [ ] Integración con bases de datos
- [ ] API REST para acceso a datos
- [ ] Análisis predictivo con machine learning
- [ ] Exportación de reportes en PDF
- [ ] Notificaciones automáticas
- [ ] Integración con sistemas externos

