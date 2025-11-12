"""Export Plotly visualizations from notebooks to standalone HTML.

The utility can export:

* `notebooks/ocupados_grupo_ocupacional_ciuo88.ipynb` (cell id `d5269fc0`)
    into `docs/ocupados_grupo_ocupacional.html`.
* `notebooks/ocupados_categoria_ocupacional.ipynb` (cell id `4ae9b9f7`)
    into `docs/ocupados_categoria_ocupacional.html`.
* `notebooks/ocupados_categoria_ocupacional.ipynb` (cell id `99f2f5e3`)
    into `docs/ocupados_estabilidad_laboral.html`.
* `notebooks/ocupados_categoria_ocupacional.ipynb` (cell id `31e5b059`)
    into `docs/ocupados_genero_sectores.html`.
* `notebooks/ocupados_categoria_ocupacional.ipynb` (cell id `999208a1`)
    into `docs/ocupados_evolucion_sectorial.html`.
* `notebooks/ocupados_categoria_ocupacional.ipynb` (cell id `e074bf25`,
    Plotly outputs 0-2) into:
    - `docs/ocupados_trabajos_comunes.html`
    - `docs/ocupados_participacion_genero.html`
    - `docs/ocupados_sectorial.html`.

The generated HTML embeds Plotly inline so it is self-contained.
"""
from __future__ import annotations

import json
import argparse
from pathlib import Path
from dataclasses import dataclass
from typing import Any, Dict, Iterable, Optional

import nbformat
import plotly.io as pio

@dataclass(frozen=True)
class ExportTask:
    name: str
    notebook_path: Path
    target_cell_id: str
    output_html: Path
    plotly_index: int = 0


EXPORT_TASKS: Dict[str, ExportTask] = {
        "grupo_ocupacional": ExportTask(
                name="grupo_ocupacional",
                notebook_path=Path("notebooks/ocupados_grupo_ocupacional_ciuo88.ipynb"),
                target_cell_id="d5269fc0",
                output_html=Path("docs/ocupados_grupo_ocupacional.html"),
        ),
        "categoria_ocupacional": ExportTask(
                name="categoria_ocupacional",
                notebook_path=Path("notebooks/ocupados_categoria_ocupacional.ipynb"),
                target_cell_id="4ae9b9f7",
                output_html=Path("docs/ocupados_categoria_ocupacional.html"),
    ),
    "estabilidad_laboral": ExportTask(
        name="estabilidad_laboral",
        notebook_path=Path("notebooks/ocupados_categoria_ocupacional.ipynb"),
        target_cell_id="99f2f5e3",
        output_html=Path("docs/ocupados_estabilidad_laboral.html"),
    ),
    "genero_sectores": ExportTask(
        name="genero_sectores",
        notebook_path=Path("notebooks/ocupados_categoria_ocupacional.ipynb"),
        target_cell_id="31e5b059",
        output_html=Path("docs/ocupados_genero_sectores.html"),
    ),
    "evolucion_sectorial": ExportTask(
        name="evolucion_sectorial",
        notebook_path=Path("notebooks/ocupados_categoria_ocupacional.ipynb"),
        target_cell_id="999208a1",
        output_html=Path("docs/ocupados_evolucion_sectorial.html"),
        ),
    "trabajos_comunes": ExportTask(
        name="trabajos_comunes",
        notebook_path=Path("notebooks/ocupados_categoria_ocupacional.ipynb"),
        target_cell_id="e074bf25",
        output_html=Path("docs/ocupados_trabajos_comunes.html"),
        plotly_index=0,
    ),
    "participacion_genero": ExportTask(
        name="participacion_genero",
        notebook_path=Path("notebooks/ocupados_categoria_ocupacional.ipynb"),
        target_cell_id="e074bf25",
        output_html=Path("docs/ocupados_participacion_genero.html"),
        plotly_index=1,
    ),
    "sectorial": ExportTask(
        name="sectorial",
        notebook_path=Path("notebooks/ocupados_categoria_ocupacional.ipynb"),
        target_cell_id="e074bf25",
        output_html=Path("docs/ocupados_sectorial.html"),
        plotly_index=2,
    ),
}


def extract_plotly_payload(
    cell: Dict[str, Any], target_index: int = 0
) -> Optional[Dict[str, Any]]:
    """Return the Nth Plotly payload from a notebook cell, if present."""

    match_count = -1
    for output in cell.get("outputs", []):
        data = output.get("data", {})
        payload = data.get("application/vnd.plotly.v1+json")
        if payload:
            match_count += 1
            if match_count == target_index:
                return payload
    return None


def export_visualization(task: ExportTask) -> Path:
    if not task.notebook_path.exists():
        raise FileNotFoundError(f"Notebook not found: {task.notebook_path}")

    nb_node = nbformat.read(task.notebook_path, as_version=4)

    plot_payload: Optional[Dict[str, Any]] = None
    for cell in nb_node.cells:
        cell_id = cell.get("id") or cell.get("metadata", {}).get("id")
        if cell_id == task.target_cell_id:
            plot_payload = extract_plotly_payload(cell, task.plotly_index)
            break

    if not plot_payload:
        raise ValueError(
            "No Plotly output found in the target cell. "
            "Run the notebook cell before exporting." 
        )

    fig = pio.from_json(json.dumps(plot_payload))
    figure_html = pio.to_html(
        fig,
        full_html=False,
        include_plotlyjs="inline",
        config={"displaylogo": False},
    )

    minimal_html = (
        "<!DOCTYPE html>\n"
        "<html lang=\"es\">\n"
        "<head><meta charset=\"utf-8\" /><meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" /></head>\n"
        "<body>" + figure_html + "</body>\n"
        "</html>\n"
    )

    task.output_html.parent.mkdir(parents=True, exist_ok=True)
    task.output_html.write_text(minimal_html, encoding="utf-8")
    return task.output_html


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Export Plotly figures from notebooks.")
    parser.add_argument(
        "--target",
        action="append",
        choices=sorted(EXPORT_TASKS.keys()),
        help="Select a specific export target. Repeat for multiple exports.",
    )
    return parser.parse_args(argv)


def main(argv: Optional[Iterable[str]] = None) -> None:
    args = parse_args(argv)
    targets = args.target or sorted(EXPORT_TASKS.keys())

    for target in targets:
        output_path = export_visualization(EXPORT_TASKS[target])
        print(f"✅ Export complete: {output_path}")


if __name__ == "__main__":
    main()
