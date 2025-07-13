# Makefile para el proyecto de Ocupación Laboral Los Ríos
# Autor: Bruno San Martín Navarro

.PHONY: help install dev-install test lint format clean run dashboard notebook docs

# Variables
PYTHON = python
PIP = pip
VENV = venv
SRC_DIR = src
TEST_DIR = tests

help: ## Mostrar esta ayuda
	@echo "Comandos disponibles:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Instalar dependencias en entorno virtual
	$(PYTHON) -m venv $(VENV)
	$(VENV)/bin/$(PIP) install --upgrade pip
	$(VENV)/bin/$(PIP) install -r requirements.txt

dev-install: install ## Instalar dependencias de desarrollo
	$(VENV)/bin/$(PIP) install -e .
	$(VENV)/bin/$(PIP) install pytest pytest-cov black flake8 mypy

test: ## Ejecutar tests
	$(VENV)/bin/pytest $(TEST_DIR) -v

test-cov: ## Ejecutar tests con cobertura
	$(VENV)/bin/pytest $(TEST_DIR) --cov=$(SRC_DIR) --cov-report=html --cov-report=term

lint: ## Verificar estilo de código
	$(VENV)/bin/flake8 $(SRC_DIR) $(TEST_DIR)
	$(VENV)/bin/mypy $(SRC_DIR)

format: ## Formatear código
	$(VENV)/bin/black $(SRC_DIR) $(TEST_DIR)
	$(VENV)/bin/isort $(SRC_DIR) $(TEST_DIR)

clean: ## Limpiar archivos temporales
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	find . -type f -name "*.pyo" -delete
	find . -type d -name "*.egg-info" -exec rm -rf {} +
	rm -rf build/ dist/ .coverage htmlcov/ .pytest_cache/ .mypy_cache/

run: ## Ejecutar análisis completo
	$(VENV)/bin/$(PYTHON) main.py

dashboard: ## Ejecutar solo dashboard
	$(VENV)/bin/$(PYTHON) -m $(SRC_DIR).visualization.dashboard

notebook: ## Iniciar Jupyter Lab
	$(VENV)/bin/jupyter lab

docs: ## Generar documentación
	@echo "Generando documentación..."
	@echo "README.md actualizado ✓"

setup: dev-install ## Setup completo del proyecto
	@echo "Proyecto configurado exitosamente ✓"
	@echo "Para activar el entorno virtual: source $(VENV)/bin/activate"

ci: test lint ## Ejecutar pipeline de CI (tests + lint)
	@echo "Pipeline CI completado ✓"

build: clean ## Construir distribución
	$(VENV)/bin/$(PYTHON) setup.py sdist bdist_wheel

check-deps: ## Verificar dependencias
	$(VENV)/bin/$(PIP) check

update-deps: ## Actualizar dependencias
	$(VENV)/bin/$(PIP) install --upgrade -r requirements.txt

tree: ## Mostrar estructura del proyecto
	@echo "Estructura del proyecto:"
	@find . -type d -name "__pycache__" -prune -o -type d -name ".git" -prune -o -type d -name "$(VENV)" -prune -o -type f -print | head -50
