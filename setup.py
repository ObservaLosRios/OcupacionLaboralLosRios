#!/usr/bin/env python3
"""
Setup script para el proyecto de Análisis de Ocupación Laboral - Los Ríos
"""

from setuptools import setup, find_packages
import os

# Leer el README para la descripción larga
def read_readme():
    with open("README.md", "r", encoding="utf-8") as fh:
        return fh.read()

# Leer requirements
def read_requirements():
    with open("requirements.txt", "r", encoding="utf-8") as fh:
        return [line.strip() for line in fh if line.strip() and not line.startswith("#")]

setup(
    name="ocupacion-laboral-losrios",
    version="1.0.0",
    author="Bruno San Martín Navarro",
    author_email="bruno.sanmartin@uach.cl",
    description="Análisis de datos de ocupación laboral en la Región de Los Ríos, Chile",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    url="https://github.com/brunosanmartin/OcupacionLaboral_LosRios",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Science/Research",
        "Topic :: Scientific/Engineering :: Information Analysis",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.0",
            "pytest-cov>=4.0",
            "black>=22.0",
            "flake8>=5.0",
            "mypy>=0.991"
        ],
        "docs": [
            "sphinx>=5.0",
            "sphinx-rtd-theme>=1.0"
        ]
    },
    entry_points={
        "console_scripts": [
            "ocupacion-etl=etl.main:main",
            "ocupacion-analysis=main:main",
        ],
    },
    include_package_data=True,
    package_data={
        "": ["*.txt", "*.md", "*.yaml", "*.yml"],
    },
    zip_safe=False,
)
