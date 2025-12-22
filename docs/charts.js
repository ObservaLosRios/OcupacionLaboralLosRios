window.PlotlyConfig = window.PlotlyConfig || { MathJaxConfig: "local" };

const TABLE_ICON = {
    width: 512,
    height: 512,
    path: 'M64 96c0-17.7 14.3-32 32-32h320c17.7 0 32 14.3 32 32v320c0 17.7-14.3 32-32 32H96c-17.7 0-32-14.3-32-32V96zm64 32v64h256v-64H128zm0 128v128h256V256H128z',
};

function toArray(value) {
    if (!value) return [];
    if (value && typeof value === 'object' && value.bdata && value.dtype) {
        return decodeEncodedArray(value);
    }
    if (Array.isArray(value)) return value;
    if (ArrayBuffer.isView(value)) return Array.from(value);
    return [];
}

function decodeEncodedArray(value) {
    if (!value || typeof value !== 'object' || !value.bdata || !value.dtype) {
        return value;
    }
    const b64 = value.bdata;
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    const dtype = value.dtype;
    let view;
    if (dtype === 'f8') view = new Float64Array(bytes.buffer);
    else if (dtype === 'f4') view = new Float32Array(bytes.buffer);
    else if (dtype === 'i4') view = new Int32Array(bytes.buffer);
    else if (dtype === 'i2') view = new Int16Array(bytes.buffer);
    else if (dtype === 'i1') view = new Int8Array(bytes.buffer);
    else if (dtype === 'u4') view = new Uint32Array(bytes.buffer);
    else if (dtype === 'u2') view = new Uint16Array(bytes.buffer);
    else if (dtype === 'u1') view = new Uint8Array(bytes.buffer);
    else view = bytes;
    const flat = Array.from(view);
    const shapeRaw = value.shape;
    if (!shapeRaw) {
        return flat;
    }

    const shape = Array.isArray(shapeRaw)
        ? shapeRaw.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n > 0)
        : String(shapeRaw)
            .split(/[^0-9]+/)
            .filter(Boolean)
            .map((n) => Number(n))
            .filter((n) => Number.isFinite(n) && n > 0);

    if (shape.length === 1) {
        return flat;
    }
    if (shape.length === 2) {
        const rows = shape[0];
        const cols = shape[1];
        if (!rows || !cols) {
            return flat;
        }
        if (rows * cols > flat.length) {
            return flat;
        }
        const reshaped = [];
        for (let r = 0; r < rows; r += 1) {
            const start = r * cols;
            reshaped.push(flat.slice(start, start + cols));
        }
        return reshaped;
    }
    return flat;
}

function decodeTraceArrays(trace) {
    const fields = ['x', 'y', 'z', 'text', 'customdata'];
    fields.forEach((field) => {
        if (field in trace) {
            const val = trace[field];
            if (Array.isArray(val)) {
                trace[field] = val.map((v) => decodeEncodedArray(v));
            } else {
                trace[field] = decodeEncodedArray(val);
            }
        }
    });
}

function collectRows(gd) {
    const rows = [];
    (gd?.data || []).forEach((trace, idx) => {
        const name = trace.name || `serie_${idx + 1}`;
        const x = toArray(trace.x);
        const y = toArray(trace.y);
        const text = toArray(trace.text);
        const custom = toArray(trace.customdata);
        const maxLen = Math.max(x.length, y.length, text.length, custom.length, 1);
        for (let i = 0; i < maxLen; i += 1) {
            const customVal = custom[i];
            rows.push({
                trace: name,
                x: x[i] ?? '',
                y: y[i] ?? '',
                text: text[i] ?? '',
                customdata: customVal == null
                    ? ''
                    : Array.isArray(customVal) || typeof customVal === 'object'
                        ? JSON.stringify(customVal)
                        : customVal,
            });
        }
    });
    return rows;
}

function triggerDownload(content, mime, filename) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 500);
}

function rowsToCsv(rows) {
    const columns = rows && rows.length ? Object.keys(rows[0]) : undefined;
    return Plotly.d3.csvFormat(rows, columns);
}

function rowsToXls(rows) {
    const header = rows && rows.length ? Object.keys(rows[0]) : ['trace', 'x', 'y', 'text', 'customdata'];
    const headHtml = `<tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>`;
    const bodyHtml = rows
        .map((r) => `<tr>${header.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`)
        .join('');
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body><table>${headHtml}${bodyHtml}</table></body></html>`;
}

function openDataTable(gd, rowsOverride) {
    const rows = Array.isArray(rowsOverride) ? rowsOverride : collectRows(gd);
    const header = rows && rows.length ? Object.keys(rows[0]) : ['trace', 'x', 'y', 'text', 'customdata'];
    const headHtml = `<tr>${header.map((h) => `<th>${h}</th>`).join('')}</tr>`;
    const bodyHtml = rows
        .map((r) => `<tr>${header.map((h) => `<td>${r[h] ?? ''}</td>`).join('')}</tr>`)
        .join('');
    const win = window.open('', '_blank', 'noopener,noreferrer,width=900,height=600');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Datos del gráfico</title><style>body{font-family:Arial, sans-serif;padding:12px;}table{border-collapse:collapse;width:100%;}th,td{border:1px solid #ccc;padding:6px;text-align:left;}thead{background:#f5f5f5;}</style></head><body><h3>Datos del gráfico</h3><table><thead>${headHtml}</thead><tbody>${bodyHtml}</tbody></table></body></html>`);
    win.document.close();
}

// =============================
// Panorama Ocupacional (Highcharts)
// =============================
const PANORAMA_HIGHCHART_ID = '16f92e65-4ab7-4999-8340-0c67cbd2c60b';
const GENERO_HIGHCHART_ID = 'c39f245b-ad01-49ae-9b10-5fc558fa4494';
const ESTABILIDAD_HIGHCHART_ID = '3eb19530-b4fd-41fe-b20d-c2576a4b1d6d';
const SECTORES_GENERO_HIGHCHART_ID = '19ed95b5-a42d-4831-b6f5-6da45745280e';
const EVOLUCION_SECTORIAL_HIGHCHART_ID = 'aeedbf19-72f2-407c-8696-29fe251f0886';
const TRABAJOS_COMUNES_HIGHCHART_ID = 'b5a5d5b8-4279-4feb-aee6-4a5142d0b71c';
const PARTICIPACION_GENERO_HIGHCHART_ID = 'c39601bf-93e6-425a-9931-e1a836f9b1e7';
const ESTRUCTURA_SECTORIAL_HIGHCHART_ID = 'e0ec7aa7-e263-46ed-b579-ad2add9c7671';

function getDecodedPlotlyTracesFor(targetId) {
    const def = chartDefinitions?.find?.((d) => d.targetId === targetId);
    if (!def || !Array.isArray(def.data)) {
        return [];
    }
    return def.data.map((trace) => {
        const copy = { ...trace };
        decodeTraceArrays(copy);
        return copy;
    });
}

function renderPanoramaHighcharts() {
    const container = document.getElementById(PANORAMA_HIGHCHART_ID);
    if (!container || typeof Highcharts === 'undefined') return;

    const categories = [
        'Trabajadores No Calificados',
        'Oficiales y Artesanos',
        'Servicios y Comercio',
        'Técnicos de Nivel Medio',
        'Profesionales, científicos<br>e intelectuales',
        'Personal de Oficina',
        'Directivos y Autoridades<br>Públicas',
        'Otros no identificados',
        'Operadores de Máquinas',
        'Trabajadores por cuenta<br>propia',
        'Asalariados sector público',
        'Familiar no remunerado',
        'Empleadores',
        'Asalariados sector privado',
        'Personal de servicio<br>doméstico',
    ];

    const data = [
        4626,
        7612,
        14628,
        19455,
        21715,
        28691,
        36057,
        40965,
        44335,
        62763,
        94617,
        155946,
        163953,
        196022,
        282143,
    ];

    Highcharts.setOptions({
        lang: { thousandsSep: '.', numericSymbols: null },
        chart: {
            style: { fontFamily: 'Georgia, serif' },
            backgroundColor: '#ffffff',
        },
        colors: [
            'rgb(238,117,118)',
            'rgb(114,169,207)',
            'rgb(116,192,116)',
            'rgb(255,167,89)',
            'rgb(178,146,207)',
            'rgb(169,129,121)',
            'rgb(233,150,207)',
            'rgb(152,152,152)',
            'rgb(199,200,71)',
            'rgb(56,199,213)',
            'rgb(218,63,64)',
            'rgb(255,160,159)',
            'rgb(157,224,144)',
            'rgb(255,182,133)',
            'rgb(197,176,213)',
        ],
    });

    Highcharts.chart(PANORAMA_HIGHCHART_ID, {
        chart: {
            type: 'bar',
            height: 720,
            spacing: [20, 30, 30, 40],
        },
        title: {
            useHTML: true,
            text: '<span style="color:#E31A1C;">▬▬▬▬</span> <b style="color:#2C3E50;">DISTRIBUCIÓN DEL EMPLEO</b> <span style="color:#E31A1C;">▬▬▬▬</span><br><span style="color:#1f77b4;">▬▬</span> <span style="color:#666; font-size:14px;">Por Sector Ocupacional • Región de Los Ríos</span> <span style="color:#1f77b4;">▬▬</span>',
            align: 'center',
            margin: 30,
        },
        subtitle: {
            useHTML: true,
            text: '<span style="color:#7F8C8D; font-size:12px;">Nota metodológica: Excluye categoría "Total" • Datos procesados y validados</span>',
            align: 'left',
            y: 10,
            x: 10,
        },
        xAxis: {
            categories,
            title: { text: null },
            gridLineWidth: 1,
            lineWidth: 0,
            labels: { useHTML: true, style: { color: '#34495E', fontSize: '11px' } },
        },
        yAxis: {
            min: 0,
            title: {
                text: '<b style="color:#2C3E50;">Total de Ocupados</b> <span style="color:#E31A1C;">•</span> <span style="color:#666; font-size:10px;">en miles de personas</span>',
                margin: 20,
                useHTML: true,
            },
            labels: {
                style: { color: '#34495E', fontSize: '11px' },
                formatter() { return Highcharts.numberFormat(this.value, 0, ',', '.'); },
            },
            gridLineWidth: 0,
        },
        tooltip: {
            shared: false,
            useHTML: true,
            formatter() {
                const category = this.point.category.replace(/<br>/g, ' ');
                return `<b style="color:#E31A1C;">${category}</b><br>` +
                    `<span style="color:#666;">Ocupados: <b>${Highcharts.numberFormat(this.y, 0, ',', '.')}</b></span>`;
            },
        },
        legend: { enabled: false },
        plotOptions: {
            series: {
                borderWidth: 0,
                colorByPoint: true,
                dataLabels: {
                    enabled: true,
                    formatter() { return Highcharts.numberFormat(this.y, 0, ',', '.'); },
                    style: { color: '#2C3E50', fontSize: '11px', fontWeight: 'bold' },
                },
            },
            bar: {
                borderRadius: '50%',
                pointPadding: 0.1,
                groupPadding: 0.06,
            },
        },
        credits: { enabled: false },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
                },
            },
        },
        series: [
            {
                name: 'Ocupados',
                data,
            },
        ],
    });
}

// =============================
// Dinámica por Género (Highcharts)
// =============================
function renderDinamicaGeneroHighcharts() {
    const container = document.getElementById(GENERO_HIGHCHART_ID);
    if (!container || typeof Highcharts === 'undefined') return;

    const years = [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019];
    const dataAmbos = [9050, 2035, 11300, 10749, 102, 2124, 970, 10748, 1155, 11031];
    const dataHombres = [4721, 1704, 3643, 4270, 14180, 18789, 7725, 12982, 9939, 12885];
    const dataMujeres = [85, 23847, 9313, 16551, 1075, 100, 16379, 10432, 11549, 44310];

    Highcharts.setOptions({
        lang: { thousandsSep: '.', numericSymbols: null },
        chart: { style: { fontFamily: 'Georgia, serif' }, backgroundColor: '#ffffff' },
    });

    Highcharts.chart(GENERO_HIGHCHART_ID, {
        chart: { type: 'line', height: 520, spacing: [20, 20, 30, 20] },
        title: {
            useHTML: true,
            text: '<b>Evolución del Empleo por Género: Personal de servicio doméstico • Los Ríos</b><br><span style="font-size:13px; color:#475569;">Interactividad completa • Clic en leyenda para mostrar/ocultar géneros • Período 2010-2019</span>',
            align: 'left',
            margin: 24,
        },
        subtitle: { text: '', align: 'left' },
        xAxis: {
            categories: years,
            title: { text: 'Año' },
            gridLineWidth: 0,
            lineColor: '#cbd5e1',
            tickColor: '#cbd5e1',
            labels: { style: { color: '#475569', fontSize: '11px' } },
        },
        yAxis: {
            title: { text: 'Número de Personas Empleadas' },
            gridLineColor: '#e2e8f0',
            labels: {
                formatter() { return Highcharts.numberFormat(this.value, 0, ',', '.'); },
                style: { color: '#475569', fontSize: '11px' },
            },
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: 0,
            y: 20,
            borderColor: '#e2e8f0',
            borderWidth: 1,
            backgroundColor: 'rgba(255,255,255,0.95)',
            itemStyle: { color: '#1e293b', fontSize: '11px' },
        },
        tooltip: {
            shared: true,
            useHTML: true,
            formatter() {
                const yearLabel = this.points?.[0]?.key ?? this.x;
                let html = `<span style="color:#475569;">Año: <b>${yearLabel}</b></span>`;
                this.points.forEach((p) => {
                    html += `<br><span style="color:${p.color};">●</span> ${p.series.name}: <b>${Highcharts.numberFormat(p.y, 0, ',', '.')}</b>`;
                });
                return html;
            },
        },
        plotOptions: {
            series: {
                marker: { enabled: true, radius: 4, lineWidth: 1, lineColor: '#fff' },
                states: { hover: { enabled: true } },
            },
        },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
                },
            },
        },
        credits: { enabled: false },
        series: [
            { name: 'Ambos sexos', data: dataAmbos, color: '#047857', dashStyle: 'ShortDot' },
            { name: 'Hombres', data: dataHombres, color: '#1e3a8a', dashStyle: 'Solid', lineWidth: 3 },
            { name: 'Mujeres', data: dataMujeres, color: '#dc2626', dashStyle: 'Solid', lineWidth: 3 },
        ],
        responsive: {
            rules: [
                {
                    condition: { maxWidth: 700 },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom',
                            x: 0,
                            y: 0,
                        },
                        chart: { height: 480 },
                    },
                },
                {
                    condition: { maxWidth: 500 },
                    chartOptions: {
                        xAxis: { labels: { style: { fontSize: '10px' } } },
                        yAxis: { labels: { style: { fontSize: '10px' } } },
                        chart: { spacing: [16, 16, 24, 12] },
                    },
                },
            ],
        },
    });
}

// =============================
// Pulso de Estabilidad (Highcharts)
// =============================
function renderEstabilidadHighcharts() {
    const container = document.getElementById(ESTABILIDAD_HIGHCHART_ID);
    if (!container || typeof Highcharts === 'undefined') return;

    const categories = [
        'Familiar No Remunerado',
        'Asalariados Sector Privado',
        'Trabajadores por Cuenta Propia',
        'Empleadores',
        'Personal de Servicio Doméstico',
        'Asalariados Sector Público',
    ];

    const variability = [
        64.49802025491395,
        65.49266966739907,
        83.88023232756464,
        95.57568214526515,
        97.7592965151082,
        103.66226470815599,
    ];

    const stats = [
        { mean: 3161.1857500000006, min: 271.404, max: 7248.647, count: 12 },
        { mean: 13848.755642857144, min: 1017.56, max: 25966.23, count: 14 },
        { mean: 4676.9846153846165, min: 425.724, max: 14100.798999999999, count: 13 },
        { mean: 5922.776642857143, min: 134.35, max: 17707.497, count: 14 },
        { mean: 4784.335666666667, min: 6.436, max: 11300.121, count: 12 },
        { mean: 1686.2655000000002, min: 245.006, max: 5847.994, count: 12 },
    ];

    Highcharts.setOptions({
        lang: { thousandsSep: '.', numericSymbols: null },
        chart: { style: { fontFamily: 'Georgia, serif' }, backgroundColor: '#ffffff' },
    });

    Highcharts.chart(ESTABILIDAD_HIGHCHART_ID, {
        chart: { type: 'column', height: 620, spacing: [20, 24, 30, 20] },
        title: {
            useHTML: true,
            text: '<b>Estabilidad del Empleo por Categoría Ocupacional • Los Ríos</b><br><span style="font-size:13px; color:#64748b;">Menor valor = Mayor estabilidad</span>',
            align: 'left',
            margin: 24,
        },
        subtitle: { text: '', align: 'left' },
        xAxis: {
            categories,
            crosshair: true,
            lineColor: '#cbd5e1',
            tickColor: '#cbd5e1',
            labels: { style: { color: '#475569', fontSize: '11px' } },
        },
        yAxis: {
            min: 0,
            title: { text: 'Coeficiente de Variación (%)' },
            gridLineColor: '#e2e8f0',
            labels: {
                formatter() { return Highcharts.numberFormat(this.value, 1, ',', '.'); },
                style: { color: '#475569', fontSize: '11px' },
            },
        },
        tooltip: {
            shared: false,
            useHTML: true,
            formatter() {
                const point = this.point;
                const s = stats[point.index];
                return [
                    `<b>${point.category}</b>`,
                    `Variabilidad: <b>${Highcharts.numberFormat(point.y, 1, ',', '.')}%</b>`,
                    `Promedio: ${Highcharts.numberFormat(s.mean, 0, ',', '.')} ocupados`,
                    `Rango: ${Highcharts.numberFormat(s.min, 0, ',', '.')} - ${Highcharts.numberFormat(s.max, 0, ',', '.')}`,
                    `Puntos de datos: ${s.count}`,
                ].join('<br>');
            },
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0,
                borderRadius: 6,
                colorByPoint: true,
            },
        },
        legend: { enabled: false },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
                },
            },
        },
        credits: { enabled: false },
        series: [
            {
                name: 'Variabilidad (%)',
                data: variability,
                colors: [
                    '#92400e',
                    '#1e3a8a',
                    '#dc2626',
                    '#14532d',
                    '#64748b',
                    '#0f766e',
                ],
            },
        ],
        responsive: {
            rules: [
                {
                    condition: { maxWidth: 700 },
                    chartOptions: {
                        chart: { height: 520 },
                        xAxis: { labels: { style: { fontSize: '10px' } } },
                        yAxis: { labels: { style: { fontSize: '10px' } } },
                    },
                },
            ],
        },
    });
}

// =============================
// Sectores Clave por Género (Highcharts)
// =============================
function renderSectoresGeneroHighcharts() {
    const container = document.getElementById(SECTORES_GENERO_HIGHCHART_ID);
    if (!container || typeof Highcharts === 'undefined') return;

    const categories = [
        'Trabajadores por<br>cuenta propia',
        'Asalariados<br>sector público',
        'Familiar<br>no remunerado',
        'Empleadores',
        'Asalariados<br>sector privado',
        'Personal de<br>servicio doméstico',
    ];

    const hombres = [39393.311, 42353.939, 100207.884, 80596.408, 146106.895, 114668.188];
    const mujeres = [23370.169, 52263.138, 55738.254, 83356.492, 49915.559, 167474.799];

    Highcharts.setOptions({
        lang: { thousandsSep: '.', numericSymbols: null },
        chart: { style: { fontFamily: 'Georgia, serif' }, backgroundColor: '#ffffff' },
    });

    Highcharts.chart(SECTORES_GENERO_HIGHCHART_ID, {
        chart: { type: 'bar', height: 650, spacing: [20, 24, 30, 20] },
        title: {
            useHTML: true,
            text: '<b>Participación Laboral por Género en Sectores Estratégicos</b><br><span style="font-size:12px; color:#64748b;">Análisis comparativo de empleo masculino vs femenino en Los Ríos</span>',
            align: 'left',
            margin: 24,
        },
        subtitle: { text: '', align: 'left' },
        xAxis: {
            categories,
            title: { text: null },
            gridLineWidth: 1,
            lineWidth: 0,
            labels: { useHTML: true, style: { color: '#34495E', fontSize: '11px' } },
        },
        yAxis: {
            min: 0,
            title: { text: 'Número de Personas Empleadas' },
            labels: {
                formatter() { return Highcharts.numberFormat(this.value, 0, ',', '.'); },
                style: { color: '#34495E', fontSize: '11px' },
            },
            gridLineWidth: 0,
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -10,
            y: 40,
            floating: true,
            borderWidth: 1,
            borderColor: '#e2e8f0',
            backgroundColor: 'rgba(255,255,255,0.95)',
            shadow: true,
            itemStyle: { color: '#1e293b', fontSize: '11px' },
        },
        tooltip: {
            shared: false,
            useHTML: true,
            formatter() {
                return `<b>${this.point.category.replace(/<br>/g, ' ')}</b><br>` +
                    `<span style="color:${this.color};">●</span> ${this.series.name}: <b>${Highcharts.numberFormat(this.y, 0, ',', '.')}</b>`;
            },
        },
        plotOptions: {
            bar: {
                borderRadius: '50%',
                dataLabels: {
                    enabled: true,
                    formatter() { return Highcharts.numberFormat(this.y, 0, ',', '.'); },
                    style: { color: '#2C3E50', fontSize: '11px', fontWeight: 'bold' },
                },
                groupPadding: 0.1,
                pointPadding: 0.05,
            },
        },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
                },
            },
        },
        credits: { enabled: false },
        series: [
            { name: 'Hombres', data: hombres, color: '#2E86AB' },
            { name: 'Mujeres', data: mujeres, color: '#A23B72' },
        ],
        responsive: {
            rules: [
                {
                    condition: { maxWidth: 700 },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom',
                            x: 0,
                            y: 0,
                        },
                        chart: { height: 560 },
                    },
                },
                {
                    condition: { maxWidth: 520 },
                    chartOptions: {
                        xAxis: { labels: { style: { fontSize: '10px' } } },
                        yAxis: { labels: { style: { fontSize: '10px' } } },
                        chart: { spacing: [16, 16, 24, 12] },
                    },
                },
            ],
        },
    });
}

// =============================
// Evolución Sectorial (Highcharts)
// =============================
function renderEvolucionSectorialHighcharts() {
    const container = document.getElementById(EVOLUCION_SECTORIAL_HIGHCHART_ID);
    if (!container || typeof Highcharts === 'undefined') return;

    const years = ['2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017', '2018', '2019', '2020', '2022', '2023'];
    const limit = years.length;

    const seriePublico = [2401.357, 245.006, 2504.0860000000002, 645.431, 372.637, 3413.7259999999997, 7444.411, 264.959, 2834.553, 277.894, 597.1510000000001, 830.392, 5847.994];
    const serieFamiliar = [4721.066, 4509.602, 4414.892, 713.233, 646.126, 3602.359, 7248.647, 1820.7740000000001, 13529.926, 2781.965, 3652.1530000000002, 271.404, 3552.008];
    const serieCuentaPropia = [4188.391, 879.521, 4479.005, 4889.945, 8617.691, 14100.798999999999, 508.872, 5120.585, 14837.381000000001, 1285.925, 3538.442, 8764.6, 4001.3, 425.724];
    const serieServicioDom = [9052.393, 2035.09, 11300.121, 27132.566, 101.456, 2123.0640000000003, 968.837, 10746.315, 1153.8290000000002, 11030.811, 1444.252, 7449.424, 6.436];
    const serieEmpleadores = [735.232, 6080.725, 134.35, 8285.516, 8668.123, 1236.565, 32420.760000000002, 8851.51, 2900.619, 17707.497, 1179.9189999999999, 999.169, 12629.345000000001, 12728.36, 781.943];
    const seriePrivado = [1953.591, 24048.713, 19416.540999999997, 1492.065, 11890.501, 20346.139, 12314.826000000001, 11332.407, 2293.857, 20712.096, 21888.023, 25966.23, 19210.03, 26923.07, 1017.56];
    const seriePromedio = [3842.0049999999997, 6299.7761666666665, 7041.499166666666, 7193.125999999999, 5049.422333333333, 7470.442, 10151.058833333334, 6356.091666666667, 6258.360833333333, 8966.031333333334, 5383.323333333334, 8671.55675, 8288.1606, 10610.5464, 741.7423333333332];

    const trim = (arr) => arr.slice(0, limit);

    Highcharts.setOptions({
        lang: { thousandsSep: '.', numericSymbols: null },
        chart: { style: { fontFamily: 'Georgia, serif' }, backgroundColor: '#ffffff' },
    });

    Highcharts.chart(EVOLUCION_SECTORIAL_HIGHCHART_ID, {
        chart: { type: 'line', height: 580, spacing: [20, 20, 30, 20] },
        title: {
            useHTML: true,
            text: '<b>Evolución Temporal del Empleo por Sector</b><br><span style="font-size:13px; color:#64748b;">Dinámicas sectoriales • Los Ríos, Chile (2010-2023)</span>',
            align: 'left',
            margin: 24,
        },
        subtitle: { text: '', align: 'left' },
        xAxis: {
            type: 'category',
            categories: years,
            title: { text: 'Año' },
            gridLineWidth: 0,
            lineColor: '#cbd5e1',
            tickColor: '#cbd5e1',
            labels: { style: { color: '#475569', fontSize: '11px' } },
        },
        yAxis: {
            title: { text: 'Número de Empleados' },
            gridLineColor: '#e2e8f0',
            labels: {
                formatter() { return Highcharts.numberFormat(this.value, 0, ',', '.'); },
                style: { color: '#475569', fontSize: '11px' },
            },
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: 0,
            y: 20,
            borderColor: '#e2e8f0',
            borderWidth: 1,
            backgroundColor: 'rgba(255,255,255,0.95)',
            itemStyle: { color: '#1e293b', fontSize: '11px' },
        },
        tooltip: {
            shared: true,
            useHTML: true,
            formatter() {
                const yearLabel = this.points?.[0]?.key ?? this.x;
                let html = `<span style="color:#475569;">Año: <b>${yearLabel}</b></span>`;
                this.points.forEach((p) => {
                    html += `<br><span style="color:${p.color};">●</span> ${p.series.name}: <b>${Highcharts.numberFormat(p.y, 0, ',', '.')}</b>`;
                });
                return html;
            },
        },
        plotOptions: {
            series: {
                marker: { enabled: true, radius: 4, lineWidth: 1, lineColor: '#fff' },
                dashStyle: 'Solid',
                connectNulls: true,
            },
        },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
                },
            },
        },
        credits: { enabled: false },
        series: [
            { name: 'Asalariados sector público', data: trim(seriePublico), color: '#1e3a8a' },
            { name: 'Familiar no remunerado', data: trim(serieFamiliar), color: '#dc2626' },
            { name: 'Trabajadores por cuenta propia', data: trim(serieCuentaPropia), color: '#047857' },
            { name: 'Personal de servicio doméstico', data: trim(serieServicioDom), color: '#d97706' },
            { name: 'Empleadores', data: trim(serieEmpleadores), color: '#7c3aed' },
            { name: 'Asalariados sector privado', data: trim(seriePrivado), color: '#0f766e' },
            { name: 'Promedio Regional', data: trim(seriePromedio), color: 'rgba(122,122,122,0.7)', lineWidth: 2 },
        ],
        responsive: {
            rules: [
                {
                    condition: { maxWidth: 700 },
                    chartOptions: {
                        legend: {
                            layout: 'horizontal',
                            align: 'center',
                            verticalAlign: 'bottom',
                            x: 0,
                            y: 0,
                        },
                        chart: { height: 520 },
                    },
                },
                {
                    condition: { maxWidth: 520 },
                    chartOptions: {
                        xAxis: { labels: { style: { fontSize: '10px' } } },
                        yAxis: { labels: { style: { fontSize: '10px' } } },
                        chart: { spacing: [16, 16, 24, 12] },
                    },
                },
            ],
        },
    });
}

// =============================
// Trabajos Más Comunes (Highcharts)
// =============================
function renderTrabajosComunesHighcharts() {
    const container = document.getElementById(TRABAJOS_COMUNES_HIGHCHART_ID);
    if (!container || typeof Highcharts === 'undefined') return;

    const categories = [
        'Asalariados sector público',
        'Familiar no remunerado',
        'Trabajadores por cuenta propia',
        'Personal de servicio doméstico',
        'Empleadores',
        'Asalariados sector privado',
    ];

    const valores = [27679.597, 51464.155, 75638.181, 84544.594, 115339.633, 220805.649];
    const colores = ['#1e3a8a', '#dc2626', '#0f766e', '#d97706', '#7c3aed', '#2563eb'];

    Highcharts.setOptions({
        lang: { thousandsSep: '.', numericSymbols: null },
        chart: { style: { fontFamily: 'Georgia, serif' }, backgroundColor: '#ffffff' },
    });

    Highcharts.chart(TRABAJOS_COMUNES_HIGHCHART_ID, {
        chart: { type: 'bar', height: 620 },
        title: {
            useHTML: true,
            text: '<b>Los Trabajos Más Comunes en la Región de Los Ríos</b><br><span style="font-size:13px; color:#64748b;">Distribución por sector ocupacional</span>',
            align: 'left',
            margin: 24,
        },
        subtitle: { text: '', align: 'left' },
        xAxis: {
            categories,
            title: { text: null },
            gridLineWidth: 1,
            lineWidth: 0,
            labels: { useHTML: true, style: { color: '#34495E', fontSize: '11px' } },
        },
        yAxis: {
            min: 0,
            title: {
                text: 'Número de empleados',
                align: 'middle',
                rotation: 0,
                y: 24,
                offset: 14,
            },
            labels: {
                formatter() { return Highcharts.numberFormat(this.value, 0, ',', '.'); },
                style: { color: '#475569', fontSize: '11px' },
            },
            gridLineWidth: 0,
        },
        tooltip: {
            shared: false,
            useHTML: true,
            formatter() {
                const cat = this.point.category;
                return `<b>${cat}</b><br>Empleados: <b>${Highcharts.numberFormat(this.y, 0, ',', '.')}</b>`;
            },
        },
        plotOptions: {
            bar: {
                borderRadius: '50%',
                dataLabels: {
                    enabled: true,
                    formatter() { return Highcharts.numberFormat(this.y, 0, ',', '.'); },
                    style: { color: '#1e293b', fontSize: '11px', fontWeight: 'bold' },
                },
                groupPadding: 0.1,
                pointPadding: 0.05,
            },
            series: { borderWidth: 0 },
        },
        legend: { enabled: false },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
                },
            },
        },
        credits: { enabled: false },
        series: [{
            name: 'Empleados',
            colorByPoint: true,
            colors: colores,
            data: valores.map((y, idx) => ({ y, color: colores[idx % colores.length] })),
        }],
        responsive: {
            rules: [
                {
                    condition: { maxWidth: 700 },
                    chartOptions: {
                        chart: { height: 560 },
                        xAxis: { labels: { style: { fontSize: '10px' } } },
                        yAxis: { labels: { style: { fontSize: '10px' } } },
                    },
                },
            ],
        },
    });
}

// =============================
// Participación de Género (Highcharts)
// =============================
function renderParticipacionGeneroHighcharts() {
    const container = document.getElementById(PARTICIPACION_GENERO_HIGHCHART_ID);
    if (!container || typeof Highcharts === 'undefined') return;

    const traces = getDecodedPlotlyTracesFor(PARTICIPACION_GENERO_HIGHCHART_ID);
    const trace = traces[0];
    if (!trace) return;

    const categories = toArray(trace.y).map(cleanHtmlBreaks);
    const mujeres = toArray(trace.x).map((v) => (v == null || v === '' ? null : Number(v)));
    const custom = toArray(trace.customdata);
    const hombres = custom.map((row) => (Array.isArray(row) ? Number(row[0]) : null));
    const total = custom.map((row) => (Array.isArray(row) ? Number(row[1]) : null));

    Highcharts.setOptions({
        lang: { thousandsSep: '.', numericSymbols: null },
        chart: { style: { fontFamily: 'Georgia, serif' }, backgroundColor: '#ffffff' },
    });

    Highcharts.chart(PARTICIPACION_GENERO_HIGHCHART_ID, {
        chart: { type: 'bar', height: 650 },
        title: { text: 'Participación de Mujeres por Sector Laboral' },
        subtitle: { text: 'Fuente: INE Chile' },
        xAxis: {
            categories,
            title: { text: null },
            gridLineWidth: 1,
            lineWidth: 0,
        },
        yAxis: {
            min: 0,
            max: 100,
            title: { text: 'Participación (%)', align: 'high' },
            labels: { overflow: 'justify' },
            gridLineWidth: 0,
        },
        tooltip: {
            useHTML: true,
            formatter() {
                const idx = this.point.index;
                const tot = total[idx];
                const mujeresPct = this.y;
                const hombresPct = hombres[idx];
                const totStr = tot == null || Number.isNaN(tot) ? '' : `<br>Total empleados: <b>${Highcharts.numberFormat(tot, 0, ',', '.')}</b>`;
                const hombresStr = hombresPct == null || Number.isNaN(hombresPct) ? '' : `<br>Hombres: <b>${hombresPct.toFixed(1)}%</b>`;
                return `<b>${this.point.category}</b><br>Mujeres: <b>${Number(mujeresPct).toFixed(1)}%</b>${hombresStr}${totStr}`;
            },
        },
        plotOptions: {
            bar: {
                borderRadius: '50%',
                dataLabels: {
                    enabled: true,
                    formatter() {
                        return this.y == null ? '' : `${Number(this.y).toFixed(1)}%`;
                    },
                },
                groupPadding: 0.1,
            },
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -40,
            y: 80,
            floating: true,
            borderWidth: 1,
            backgroundColor: 'var(--highcharts-background-color, #ffffff)',
            shadow: true,
        },
        credits: { enabled: false },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
                },
            },
        },
        series: [
            { name: 'Mujeres (%)', data: mujeres, color: '#A23B72' },
            { name: 'Hombres (%)', data: hombres, color: '#2E86AB' },
            {
                name: 'Total empleados',
                data: total,
                visible: false,
                showInLegend: false,
                enableMouseTracking: false,
                includeInDataExport: true,
            },
        ],
    });
}

// =============================
// Estructura Sectorial (Highcharts)
// =============================
function renderEstructuraSectorialHighcharts() {
    const container = document.getElementById(ESTRUCTURA_SECTORIAL_HIGHCHART_ID);
    if (!container || typeof Highcharts === 'undefined') return;

    const traces = getDecodedPlotlyTracesFor(ESTRUCTURA_SECTORIAL_HIGHCHART_ID);
    const trace = traces[0];
    if (!trace) return;

    const categories = toArray(trace.y).map(cleanHtmlBreaks);
    const empleados = toArray(trace.x).map((v) => (v == null || v === '' ? null : Number(v)));
    const custom = toArray(trace.customdata);
    const pct = custom.map((row) => (Array.isArray(row) ? Number(row[0]) : null));
    const acumulado = custom.map((row) => (Array.isArray(row) ? Number(row[1]) : null));

    Highcharts.setOptions({
        lang: { thousandsSep: '.', numericSymbols: null },
        chart: { style: { fontFamily: 'Georgia, serif' }, backgroundColor: '#ffffff' },
    });

    Highcharts.chart(ESTRUCTURA_SECTORIAL_HIGHCHART_ID, {
        chart: { type: 'bar', height: 650 },
        title: { text: 'Estructura Sectorial del Empleo Regional' },
        subtitle: { text: 'Fuente: INE Chile' },
        xAxis: {
            categories,
            title: { text: null },
            gridLineWidth: 1,
            lineWidth: 0,
        },
        yAxis: {
            min: 0,
            title: { text: 'Empleados', align: 'high' },
            labels: { overflow: 'justify' },
            gridLineWidth: 0,
        },
        tooltip: {
            useHTML: true,
            formatter() {
                const idx = this.point.index;
                const p = pct[idx];
                const a = acumulado[idx];
                const pStr = p == null || Number.isNaN(p) ? '' : `<br>Participación: <b>${p.toFixed(1)}%</b>`;
                const aStr = a == null || Number.isNaN(a) ? '' : `<br>Acumulado: <b>${a.toFixed(1)}%</b>`;
                return `<b>${this.point.category}</b><br>Empleados: <b>${Highcharts.numberFormat(this.y, 0, ',', '.')}</b>${pStr}${aStr}`;
            },
        },
        plotOptions: {
            bar: {
                borderRadius: '50%',
                dataLabels: {
                    enabled: true,
                    formatter() {
                        return this.y == null ? '' : Highcharts.numberFormat(this.y, 0, ',', '.');
                    },
                },
                groupPadding: 0.1,
            },
        },
        legend: {
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'top',
            x: -40,
            y: 80,
            floating: true,
            borderWidth: 1,
            backgroundColor: 'var(--highcharts-background-color, #ffffff)',
            shadow: true,
        },
        credits: { enabled: false },
        exporting: {
            enabled: true,
            buttons: {
                contextButton: {
                    menuItems: ['viewFullscreen', 'printChart', 'separator', 'downloadPNG', 'downloadJPEG', 'downloadSVG', 'separator', 'downloadCSV', 'downloadXLS', 'viewData'],
                },
            },
        },
        series: [
            {
                name: 'Empleados',
                colorByPoint: true,
                data: empleados.map((y, idx) => {
                    const palette = ['#1e3a8a', '#dc2626', '#047857', '#d97706', '#7c3aed', '#0f766e', '#334155', '#2563eb'];
                    return { y, color: palette[idx % palette.length] };
                }),
            },
            {
                name: 'Participación (%)',
                data: pct,
                visible: false,
                showInLegend: false,
                enableMouseTracking: false,
                includeInDataExport: true,
            },
            {
                name: 'Acumulado (%)',
                data: acumulado,
                visible: false,
                showInLegend: false,
                enableMouseTracking: false,
                includeInDataExport: true,
            },
        ],
    });
}

// Iconos SVG personalizados para el menú de exportación
const EXPORT_ICONS = {
    menu: {
        width: 24,
        height: 24,
        path: 'M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z'
    },
    fullscreen: {
        width: 24,
        height: 24,
        path: 'M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z'
    },
    print: {
        width: 24,
        height: 24,
        path: 'M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z'
    },
    download: {
        width: 24,
        height: 24,
        path: 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z'
    },
    table: {
        width: 24,
        height: 24,
        path: 'M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z'
    }
};

// Función para abrir en pantalla completa
function openFullscreen(gd) {
    const container = gd.closest('.chart-embed') || gd.parentElement;
    if (container.requestFullscreen) {
        container.requestFullscreen();
    } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
    } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
    }
    setTimeout(() => Plotly.Plots.resize(gd), 100);
}

// Función para imprimir gráfico
function printChart(gd) {
    Plotly.toImage(gd, { format: 'png', width: 1200, height: 800 }).then((dataUrl) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Imprimir Gráfico</title>
                <style>
                    body { margin: 0; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
                    img { max-width: 100%; height: auto; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>
                <img src="${dataUrl}" alt="Gráfico" onload="window.print(); window.close();">
            </body>
            </html>
        `);
        printWindow.document.close();
    });
}

// Función para descargar imagen
function downloadImage(gd, format, filename) {
    const opts = { format: format, width: 1200, height: 800 };
    Plotly.downloadImage(gd, { ...opts, filename: filename || `grafico_${Date.now()}` });
}

// Función para descargar SVG
function downloadSvg(gd, filename) {
    Plotly.toImage(gd, { format: 'svg', width: 1200, height: 800 }).then((dataUrl) => {
        const svgData = decodeURIComponent(dataUrl.split(',')[1]);
        triggerDownload(svgData, 'image/svg+xml', (filename || `grafico_${Date.now()}`) + '.svg');
    });
}

function buildModebarButtons() {
    return [];
}

function attachExportToolbar(container, plotPromise, options = {}) {
    const wrapper = container.closest('.chart-embed') || container.parentElement || container;
    if (!wrapper) return;

    // Verificar si ya existe el menú
    let menuContainer = wrapper.querySelector('.export-menu-container');
    if (!menuContainer) {
        menuContainer = document.createElement('div');
        menuContainer.className = 'export-menu-container';
        menuContainer.innerHTML = `
            <button class="export-menu-btn" title="Opciones de exportación">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z"/>
                </svg>
            </button>
            <div class="export-dropdown">
                <button class="export-option" data-action="fullscreen">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/>
                    </svg>
                    Ver en pantalla completa
                </button>
                <button class="export-option" data-action="print">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/>
                    </svg>
                    Imprimir gráfico
                </button>
                <div class="export-divider"></div>
                <button class="export-option" data-action="png">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Descargar imagen PNG
                </button>
                <button class="export-option" data-action="jpeg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Descargar imagen JPEG
                </button>
                <button class="export-option" data-action="svg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Descargar imagen SVG
                </button>
                <div class="export-divider"></div>
                <button class="export-option" data-action="csv">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Descargar CSV
                </button>
                <button class="export-option" data-action="xls">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
                    </svg>
                    Descargar XLS
                </button>
                <div class="export-divider"></div>
                <button class="export-option" data-action="table">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/>
                    </svg>
                    Ver tabla de datos
                </button>
            </div>
        `;
        wrapper.style.position = 'relative';
        wrapper.appendChild(menuContainer);

        // Toggle del menú
        const menuBtn = menuContainer.querySelector('.export-menu-btn');
        const dropdown = menuContainer.querySelector('.export-dropdown');
        
        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });

        // Cerrar al hacer clic fuera
        document.addEventListener('click', (e) => {
            if (!menuContainer.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
    }

    const bindHandlers = (gd) => {
        if (!gd) return;
        const dropdown = menuContainer.querySelector('.export-dropdown');

        const baseName = options.baseName || 'grafico';
        const dataName = options.dataName || 'datos_grafico';
        const getRows = () => {
            if (typeof options.getRows === 'function') {
                const maybeRows = options.getRows(gd);
                return Array.isArray(maybeRows) ? maybeRows : [];
            }
            return collectRows(gd);
        };

        // Manejar cada acción
        dropdown.querySelectorAll('.export-option').forEach(btn => {
            btn.onclick = () => {
                const action = btn.dataset.action;
                dropdown.classList.remove('show');

                switch(action) {
                    case 'fullscreen':
                        openFullscreen(gd);
                        break;
                    case 'print':
                        printChart(gd);
                        break;
                    case 'png':
                        downloadImage(gd, 'png', baseName);
                        break;
                    case 'jpeg':
                        downloadImage(gd, 'jpeg', baseName);
                        break;
                    case 'svg':
                        downloadSvg(gd, baseName);
                        break;
                    case 'csv':
                        const rowsCsv = getRows();
                        if (rowsCsv.length) {
                            triggerDownload(rowsToCsv(rowsCsv), 'text/csv', `${dataName}.csv`);
                        }
                        break;
                    case 'xls':
                        const rowsXls = getRows();
                        if (rowsXls.length) {
                            triggerDownload(rowsToXls(rowsXls), 'application/vnd.ms-excel', `${dataName}.xls`);
                        }
                        break;
                    case 'table':
                        openDataTable(gd, getRows());
                        break;
                }
            };
        });
    };
    Promise.resolve(plotPromise ?? container).then((gd) => bindHandlers(gd));
}

function cleanHtmlBreaks(value) {
    if (typeof value !== 'string') return value;
    return value.replace(/<br\s*\/?\s*>/gi, ' ').trim();
}

function getCustomExportOptions(targetId) {
    if (targetId === PARTICIPACION_GENERO_HIGHCHART_ID) {
        return {
            baseName: 'participacion_mujeres_sector',
            dataName: 'dataset_participacion_mujeres_sector',
            getRows: (gd) => {
                const trace = gd?.data?.[0];
                if (!trace) return [];

                const sectors = toArray(trace.y).map(cleanHtmlBreaks);
                const mujeres = toArray(trace.x);
                const custom = toArray(trace.customdata);

                const rows = [];
                const maxLen = Math.max(sectors.length, mujeres.length, custom.length);
                for (let i = 0; i < maxLen; i += 1) {
                    const cd = custom[i];
                    const hombresPct = Array.isArray(cd) ? cd[0] : '';
                    const total = Array.isArray(cd) ? cd[1] : '';
                    rows.push({
                        sector_laboral: sectors[i] ?? '',
                        participacion_mujeres_pct: mujeres[i] ?? '',
                        participacion_hombres_pct: hombresPct ?? '',
                        total_empleados: total ?? '',
                    });
                }
                return rows;
            },
        };
    }
    return undefined;
}
const chartDefinitions = [
    {
        targetId: '16f92e65-4ab7-4999-8340-0c67cbd2c60b',
        data: [{"customdata":[["Trabajadores no calificados","Trabajadores No Calificados"],["Oficiales, operarios y artesanos de artes mec\u00e1nicas y de otros oficios","Oficiales y Artesanos"],["Trabajadores de los servicios y vendedores de comercios y mercados","Servicios y Comercio"],["T\u00e9cnicos y profesionales de nivel medio","T\u00e9cnicos de Nivel Medio"],["Profesionales, cient\u00edficos e intelectuales","Profesionales, cient\u00edficos e intelectuales"],["Empleados de oficina","Personal de Oficina"],["Miembros del poder ejecutivo y de los cuerpos legislativos y personal directivo de la administraci\u00f3n p\u00fablica y de empresas","Directivos y Autoridades P\u00fablicas"],["Otros no identificados","Otros no identificados"],["Operadores de instalaciones y m\u00e1quinas y montadores","Operadores de M\u00e1quinas"],["Trabajadores por cuenta propia","Trabajadores por cuenta propia"],["Asalariados sector p\u00fablico","Asalariados sector p\u00fablico"],["Familiar no remunerado","Familiar no remunerado"],["Empleadores","Empleadores"],["Asalariados sector privado","Asalariados sector privado"],["Personal de servicio dom\u00e9stico","Personal de servicio dom\u00e9stico"]],"hovertemplate":"\u003cb style=\"color:#E31A1C;\"\u003e%{customdata[1]}\u003c\u002fb\u003e\u003cbr\u003e\u003cspan style=\"color:#666;\"\u003eOcupados: \u003cb\u003e%{x:,.0f}\u003c\u002fb\u003e\u003c\u002fspan\u003e\u003cbr\u003e\u003cspan style=\"color:#999;\"\u003eNombre completo: %{customdata[0]}\u003c\u002fspan\u003e\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","marker":{"color":["rgb(238,117,118)","rgb(114,169,207)","rgb(116,192,116)","rgb(255,167,89)","rgb(178,146,207)","rgb(169,129,121)","rgb(233,150,207)","rgb(152,152,152)","rgb(199,200,71)","rgb(56,199,213)","rgb(218,63,64)","rgb(255,160,159)","rgb(157,224,144)","rgb(255,182,133)","rgb(197,176,213)"],"line":{"color":"#FFFFFF","width":1.2},"opacity":0.9},"name":"","orientation":"h","text":["4,626","7,612","14,628","19,455","21,715","28,691","36,057","40,965","44,335","62,763","94,617","155,946","163,953","196,022","282,143"],"textfont":{"color":"#2C3E50","family":"Georgia, serif","size":11,"weight":"bold"},"textposition":"outside","x":{"bdata":"dZMYBDYSskB9PzVemru9QH9qvHQDksxAWDm0yLb\u002f0kBmZmZmzjTVQBKDwMqxBNxA2\u002fl+aiCb4UCsHFpkmwDkQIlBYOXcpeVAw\u002fUoXG+l7kAdWmQ7kRn3QHe+nxpRCQNBMzMzM4cDBEGDwMqhs+0HQcUgsPJ7OBFB","dtype":"f8"},"y":["Trabajadores No Calificados","Oficiales y Artesanos","Servicios y Comercio","T\u00e9cnicos de Nivel Medio","Profesionales, cient\u00edficos\u003cbr\u003ee intelectuales","Personal de Oficina","Directivos y Autoridades\u003cbr\u003eP\u00fablicas","Otros no identificados","Operadores de M\u00e1quinas","Trabajadores por cuenta\u003cbr\u003epropia","Asalariados sector p\u00fablico","Familiar no remunerado","Empleadores","Asalariados sector privado","Personal de servicio\u003cbr\u003edom\u00e9stico"],"type":"bar"}],
    layout: {"annotations":[{"bgcolor":"rgba(255,255,255,0.8)","bordercolor":"#E8E8E8","borderwidth":1,"font":{"color":"#7F8C8D","family":"Georgia, serif","size":8},"showarrow":false,"text":"\u003cspan style=\"color:#E31A1C;\"\u003e\u25ac\u003c\u002fspan\u003e \u003cb style=\"color:#2C3E50; font-family:Georgia;\"\u003eTHE ECONOMIST STYLE\u003c\u002fb\u003e \u003cspan style=\"color:#E31A1C;\"\u003e\u25ac\u003c\u002fspan\u003e","x":0.98,"xanchor":"right","xref":"paper","y":0.02,"yanchor":"bottom","yref":"paper"},
    {"font":{"color":"#7F8C8D","family":"Georgia, serif","size":9},"showarrow":false,"text":"\u003ci style=\"color:#666;\"\u003eNota metodol\u00f3gica: Excluye categor\u00eda \"Total\" \u2022 Datos procesados y validados\u003c\u002fi\u003e\u003cbr\u003e\u003cspan style=\"color:#E31A1C;\"\u003e\u25ac\u25ac\u003c\u002fspan\u003e \u003cspan style=\"color:#999; font-size:8px;\"\u003eFuente: An\u00e1lisis propio \u2022 UACh Data Science\u003c\u002fspan\u003e","x":0.02,"xanchor":"left","xref":"paper","y":-0.08,"yanchor":"top","yref":"paper"}],"font":{"color":"#2C3E50","family":"Georgia, serif","size":11},"height":750,"hovermode":"closest","margin":{"b":80,"l":350,"r":120,"t":130},"paper_bgcolor":"white","plot_bgcolor":"#FAFAFA","shapes":[{"line":{"color":"#E31A1C","width":3},"type":"line","x0":0,"x1":1,"xref":"paper","y0":1.02,"y1":1.02,"yref":"paper"},{"line":{"color":"#1f77b4","width":2},"type":"line","x0":0,"x1":1,"xref":"paper","y0":-0.05,"y1":-0.05,"yref":"paper"}],"showlegend":false,"template":{"data":{"barpolar":[{"marker":{"line":{"color":"#E5ECF6","width":0.5},"pattern":{"fillmode":"overlay","size":10,"solidity":0.2}},"type":"barpolar"}],"bar":[{"error_x":{"color":"#2a3f5f"},"error_y":{"color":"#2a3f5f"},"marker":{"line":{"color":"#E5ECF6","width":0.5},"pattern":{"fillmode":"overlay","size":10,"solidity":0.2}},"type":"bar"}],"carpet":[{"aaxis":{"endlinecolor":"#2a3f5f","gridcolor":"white","linecolor":"white","minorgridcolor":"white","startlinecolor":"#2a3f5f"},"baxis":{"endlinecolor":"#2a3f5f","gridcolor":"white","linecolor":"white","minorgridcolor":"white","startlinecolor":"#2a3f5f"},"type":"carpet"}],"choropleth":[{"colorbar":{"outlinewidth":0,"ticks":""},"type":"choropleth"}],"contourcarpet":[{"colorbar":{"outlinewidth":0,"ticks":""},"type":"contourcarpet"}],"contour":[{"colorbar":{"outlinewidth":0,"ticks":""},"colorscale":[[0,"#0d0887"],[0.1111111111111111,"#46039f"],[0.2222222222222222,"#7201a8"],[0.3333333333333333,"#9c179e"],[0.4444444444444444,"#bd3786"],[0.5555555555555556,"#d8576b"],[0.6666666666666666,"#ed7953"],[0.7777777777777778,"#fb9f3a"],[0.8888888888888888,"#fdca26"],[1,"#f0f921"]],"type":"contour"}],"heatmap":[{"colorbar":{"outlinewidth":0,"ticks":""},"colorscale":[[0,"#0d0887"],[0.1111111111111111,"#46039f"],[0.2222222222222222,"#7201a8"],[0.3333333333333333,"#9c179e"],[0.4444444444444444,"#bd3786"],[0.5555555555555556,"#d8576b"],[0.6666666666666666,"#ed7953"],[0.7777777777777778,"#fb9f3a"],[0.8888888888888888,"#fdca26"],[1,"#f0f921"]],"type":"heatmap"}],"histogram2dcontour":[{"colorbar":{"outlinewidth":0,"ticks":""},"colorscale":[[0,"#0d0887"],[0.1111111111111111,"#46039f"],[0.2222222222222222,"#7201a8"],[0.3333333333333333,"#9c179e"],[0.4444444444444444,"#bd3786"],[0.5555555555555556,"#d8576b"],[0.6666666666666666,"#ed7953"],[0.7777777777777778,"#fb9f3a"],[0.8888888888888888,"#fdca26"],[1,"#f0f921"]],"type":"histogram2dcontour"}],"histogram2d":[{"colorbar":{"outlinewidth":0,"ticks":""},"colorscale":[[0,"#0d0887"],[0.1111111111111111,"#46039f"],[0.2222222222222222,"#7201a8"],[0.3333333333333333,"#9c179e"],[0.4444444444444444,"#bd3786"],[0.5555555555555556,"#d8576b"],[0.6666666666666666,"#ed7953"],[0.7777777777777778,"#fb9f3a"],[0.8888888888888888,"#fdca26"],[1,"#f0f921"]],"type":"histogram"}],"mesh3d":[{"colorbar":{"outlinewidth":0,"ticks":""},"type":"mesh3d"}],"parcoords":[{"line":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"parcoords"}],"pie":[{"automargin":true,"type":"pie"}],"scatter3d":[{"line":{"colorbar":{"outlinewidth":0,"ticks":""}},"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scatter3d"}],"scattercarpet":[{"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scattercarpet"}],"scattergeo":[{"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scattergeo"}],"scattergl":[{"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scattergl"}],"scattermapbox":[{"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scattermapbox"}],"scattermap":[{"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scattermap"}],"scatterpolargl":[{"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scatterpolargl"}],"scatterpolar":[{"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scatterpolar"}],"scatter":[{"fillpattern":{"fillmode":"overlay","size":10,"solidity":0.2},"type":"scatter"}],"scatterternary":[{"marker":{"colorbar":{"outlinewidth":0,"ticks":""}},"type":"scatterternary"}],"surface":[{"colorbar":{"outlinewidth":0,"ticks":""},"colorscale":[[0,"#0d0887"],[0.1111111111111111,"#46039f"],[0.2222222222222222,"#7201a8"],[0.3333333333333333,"#9c179e"],[0.4444444444444444,"#bd3786"],[0.5555555555555556,"#d8576b"],[0.6666666666666666,"#ed7953"],[0.7777777777777778,"#fb9f3a"],[0.8888888888888888,"#fdca26"],[1,"#f0f921"]],"type":"surface"}],"table":[{"cells":{"fill":{"color":"#EBF0F8"},"line":{"color":"white"}},"header":{"fill":{"color":"#C8D4E3"},"line":{"color":"white"}},"type":"table"}]},"layout":{"annotationdefaults":{"arrowcolor":"#2a3f5f","arrowhead":0,"arrowwidth":1},"autotypenumbers":"strict","coloraxis":{"colorbar":{"outlinewidth":0,"ticks":""}},"colorscale":{"diverging":[[0,"#8e0152"],[0.1,"#c51b7d"],[0.2,"#de77ae"],[0.3,"#f1b6da"],[0.4,"#fde0ef"],[0.5,"#f7f7f7"],[0.6,"#e6f5d0"],[0.7,"#b8e186"],[0.8,"#7fbc41"],[0.9,"#4d9221"],[1,"#276419"]],"sequential":[[0,"#0d0887"],[0.1111111111111111,"#46039f"],[0.2222222222222222,"#7201a8"],[0.3333333333333333,"#9c179e"],[0.4444444444444444,"#bd3786"],[0.5555555555555556,"#d8576b"],[0.6666666666666666,"#ed7953"],[0.7777777777777778,"#fb9f3a"],[0.8888888888888888,"#fdca26"],[1,"#f0f921"]],"sequentialminus":[[0,"#0d0887"],[0.1111111111111111,"#46039f"],[0.2222222222222222,"#7201a8"],[0.3333333333333333,"#9c179e"],[0.4444444444444444,"#bd3786"],[0.5555555555555556,"#d8576b"],[0.6666666666666666,"#ed7953"],[0.7777777777777778,"#fb9f3a"],[0.8888888888888888,"#fdca26"],[1,"#f0f921"]]},"colorway":["#636efa","#EF553B","#00cc96","#ab63fa","#FFA15A","#19d3f3","#FF6692","#B6E880","#FF97FF","#FECB52"],"font":{"color":"#2a3f5f"},"geo":{"bgcolor":"white","lakecolor":"white","landcolor":"#E5ECF6","showlakes":true,"showland":true,"subunitcolor":"white"},"hoverlabel":{"align":"left"},"hovermode":"closest","mapbox":{"style":"light"},"paper_bgcolor":"white","plot_bgcolor":"#E5ECF6","polar":{"angularaxis":{"gridcolor":"white","linecolor":"white","ticks":""},"bgcolor":"#E5ECF6","radialaxis":{"gridcolor":"white","linecolor":"white","ticks":""}},"scene":{"xaxis":{"backgroundcolor":"#E5ECF6","gridcolor":"white","gridwidth":2,"linecolor":"white","showbackground":true,"ticks":"","zerolinecolor":"white"},"yaxis":{"backgroundcolor":"#E5ECF6","gridcolor":"white","gridwidth":2,"linecolor":"white","showbackground":true,"ticks":"","zerolinecolor":"white"},"zaxis":{"backgroundcolor":"#E5ECF6","gridcolor":"white","gridwidth":2,"linecolor":"white","showbackground":true,"ticks":"","zerolinecolor":"white"}},"shapedefaults":{"line":{"color":"#2a3f5f"}},"ternary":{"aaxis":{"gridcolor":"white","linecolor":"white","ticks":""},"baxis":{"gridcolor":"white","linecolor":"white","ticks":""},"bgcolor":"#E5ECF6","caxis":{"gridcolor":"white","linecolor":"white","ticks":""}},"title":{"x":0.05},"xaxis":{"automargin":true,"gridcolor":"white","linecolor":"white","ticks":"","title":{"standoff":15},"zerolinecolor":"white","zerolinewidth":2},"yaxis":{"automargin":true,"gridcolor":"white","linecolor":"white","ticks":"","title":{"standoff":15},"zerolinecolor":"white","zerolinewidth":2}}},"title":{"font":{"color":"#2C3E50","family":"Georgia, serif","size":18},"text":"\u003cspan style=\"color:#E31A1C;\"\u003e\u25ac\u25ac\u25ac\u25ac\u003c\u002fspan\u003e \u003cb style=\"color:#2C3E50;\"\u003eDISTRIBUCI\u00d3N DEL EMPLEO\u003c\u002fb\u003e \u003cspan style=\"color:#E31A1C;\"\u003e\u25ac\u25ac\u25ac\u25ac\u003c\u002fspan\u003e\u003cbr\u003e\u003cspan style=\"color:#1f77b4;\"\u003e\u25ac\u25ac\u003c\u002fspan\u003e \u003cspan style=\"color:#666; font-size:14px;\"\u003ePor Sector Ocupacional \u2022 Regi\u00f3n de Los R\u00edos\u003c\u002fspan\u003e \u003cspan style=\"color:#1f77b4;\"\u003e\u25ac\u25ac\u003c\u002fspan\u003e","x":0.5,"xanchor":"center","y":0.94},"width":1300,"xaxis":{"gridcolor":"#E8E8E8","gridwidth":0.8,"linecolor":"#BDC3C7","linewidth":2,"mirror":true,"showgrid":true,"showline":true,"tickfont":{"color":"#34495E","family":"Georgia, serif","size":11},"tickformat":".0f","title":{"font":{"color":"#2C3E50","family":"Georgia, serif","size":13},"standoff":20,"text":"\u003cb style=\"color:#2C3E50;\"\u003eTotal de Ocupados\u003c\u002fb\u003e \u003cspan style=\"color:#E31A1C;\"\u003e\u2022\u003c\u002fspan\u003e \u003cspan style=\"color:#666; font-size:10px;\"\u003een miles de personas\u003c\u002fspan\u003e"},"zeroline":true,"zerolinecolor":"#D5D5D5","zerolinewidth":1},"yaxis":{"categoryarray":["Trabajadores No Calificados","Oficiales y Artesanos","Servicios y Comercio","T\u00e9cnicos de Nivel Medio","Profesionales, cient\u00edficos\u003cbr\u003ee intelectuales","Personal de Oficina","Directivos y Autoridades\u003cbr\u003eP\u00fablicas","Otros no identificados","Operadores de M\u00e1quinas","Trabajadores por cuenta\u003cbr\u003epropia","Asalariados sector p\u00fablico","Familiar no remunerado","Empleadores","Asalariados sector privado","Personal de servicio\u003cbr\u003edom\u00e9stico"],"categoryorder":"array","linecolor":"#BDC3C7","linewidth":2,"mirror":true,"showgrid":false,"showline":true,"tickfont":{"color":"#34495E","family":"Georgia, serif","size":10},"title":{"font":{"color":"#2C3E50","family":"Georgia, serif","size":13},"standoff":15,"text":"\u003cspan style=\"color:#E31A1C;\"\u003e\u258c\u003c\u002fspan\u003e\u003cb style=\"color:#2C3E50;\"\u003eGrupos Ocupacionales\u003c\u002fb\u003e"}}},
    config: {"displaylogo": false, "responsive": true},
    },
    {
        targetId: 'c39f245b-ad01-49ae-9b10-5fc558fa4494',
        data: [{"hovertemplate":"\u003cb\u003eAmbos sexos\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eOcupados: %{y:,.0f}\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#047857","dash":"dot","width":2},"marker":{"opacity":0.8,"size":7},"mode":"lines+markers","name":"Ambos sexos","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wc=","dtype":"i2"},"y":{"bdata":"WiPzByQs\u002fWlmAEwIygP8KYMEFys=","dtype":"i2"},"type":"scatter"},{"hovertemplate":"\u003cb\u003eHombres\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eOcupados: %{y:,.0f}\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#1e3a8a","dash":"solid","width":3},"marker":{"opacity":0.8,"size":7},"mode":"lines+markers","name":"Hombres","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wc=","dtype":"i2"},"y":{"bdata":"cRKoBjsOrhBkN2VJLR62MtMmVTI=","dtype":"i2"},"type":"scatter"},{"hovertemplate":"\u003cb\u003eMujeres\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eOcupados: %{y:,.0f}\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#dc2626","dash":"solid","width":3},"marker":{"opacity":0.8,"size":7},"mode":"lines+markers","name":"Mujeres","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wc=","dtype":"i2"},"y":{"bdata":"VQAAACddAABhJAAAp0AAADMEAABkAAAA+z8AAMAoAAAdLQAAFq0AAA==","dtype":"i4"},"type":"scatter"}],
        layout: {"font":{"color":"#1e293b","family":"Georgia, serif"},"height":520,"hoverlabel":{"bgcolor":"rgba(255,255,255,0.98)","bordercolor":"#cbd5e1","font":{"color":"#1e293b","family":"Georgia, serif","size":12}},"hovermode":"x unified","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#e2e8f0","borderwidth":1,"font":{"color":"#1e293b","family":"Georgia, serif","size":11},"orientation":"h","x":0.98,"xanchor":"right","y":1.08,"yanchor":"top"},"margin":{"b":110,"l":100,"r":80,"t":140},"paper_bgcolor":"white","plot_bgcolor":"#fefefe","showlegend":true,"spikedistance":-1,"spikesnap":"cursor","template":{"layout":{"colorway":["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],"font":{"color":"#444444","family":"Arial, sans-serif","size":12},"hovermode":"closest","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#cccccc","borderwidth":1,"font":{"size":11},"orientation":"h","x":0,"y":-0.15},"margin":{"b":80,"l":80,"r":40,"t":100},"paper_bgcolor":"#ffffff","plot_bgcolor":"#ffffff","title":{"font":{"color":"#444444","family":"Arial","size":20},"pad":{"b":25},"x":0.02,"xanchor":"left"},"xaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}},"yaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}}}},"title":{"font":{"color":"#1e293b","family":"Georgia, serif","size":16},"pad":{"b":30},"text":"\u003cb\u003eEvoluci\u00f3n del Empleo por G\u00e9nero: Personal de servicio dom\u00e9stico \u2022 Los R\u00edos\u003c\u002fb\u003e\u003cbr\u003e\u003cspan style=\"font-size:14px; color:#64748b;\"\u003e\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u003c\u002fspan\u003e\u003cbr\u003e\u003cspan style=\"font-size:12px; color:#475569;\"\u003eInteractividad completa \u2022 Clic en leyenda para mostrar\u002focultar g\u00e9neros \u2022 Per\u00edodo 2010-2019\u003c\u002fspan\u003e","x":0.12,"xanchor":"left"},"xaxis":{"gridcolor":"#e2e8f0","gridwidth":1,"linecolor":"#cbd5e1","linewidth":1,"range":[2009.5,2019.5],"showgrid":true,"showspikes":true,"spikecolor":"rgba(30,58,138,0.35)","spikemode":"across","spikethickness":1.5,"tickfont":{"color":"#475569","family":"Georgia, serif","size":10},"tickformat":"d","title":{"font":{"color":"#334155","family":"Georgia, serif","size":12},"text":"\u003cb\u003eA\u00f1o\u003c\u002fb\u003e"}},"yaxis":{"gridcolor":"#e2e8f0","gridwidth":1,"linecolor":"#cbd5e1","linewidth":1,"showgrid":true,"tickfont":{"color":"#475569","family":"Georgia, serif","size":10},"tickformat":",.0f","title":{"font":{"color":"#334155","family":"Georgia, serif","size":12},"text":"\u003cb\u003eN\u00famero de Personas Empleadas\u003c\u002fb\u003e"}}},
        config: {"displaylogo": false, "responsive": true}
    },
    {
        targetId: '3eb19530-b4fd-41fe-b20d-c2576a4b1d6d',
        data: [{"customdata":[[3161.1857500000006,271.404,7248.647,12,"Familiar no remunerado"],[13848.755642857144,1017.56,25966.23,14,"Asalariados sector privado"],[4676.9846153846165,425.724,14100.798999999999,13,"Trabajadores por cuenta propia"],[5922.776642857143,134.35,17707.497,14,"Empleadores"],[4784.335666666667,6.436,11300.121,12,"Personal de servicio domestico"],[1686.2655000000002,245.006,5847.994,12,"Asalariados sector publico"]],"hovertemplate":"\u003cb\u003e%{customdata[4]}\u003c\u002fb\u003e\u003cbr\u003eVariabilidad: %{x:.1f}%\u003cbr\u003ePromedio: %{customdata[0]:,.0f} ocupados\u003cbr\u003eRango: %{customdata[1]:,.0f} - %{customdata[2]:,.0f}\u003cbr\u003ePuntos de datos: %{customdata[3]}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","marker":{"color":["#92400e","#1e3a8a","#dc2626","#14532d","#64748b","#64748b"],"line":{"color":"white","width":1.2},"opacity":0.85},"orientation":"h","x":{"bdata":"d+ZYkN8fUEB0TVvmh19QQGrx+LlV+FRAhLPs+dfkV0DRFmlQmHBYQMy0g4ti6llA","dtype":"f8"},"y":["Familiar No Remunerado","Asalariados Sector Privado","Trabajadores Cuenta Propia","Empleadores","Personal Servicio Domestico","Asalariados Sector Publico"],"type":"bar"}],
        layout: {"height":620,"margin":{"b":90,"l":250,"r":120,"t":160},"paper_bgcolor":"white","plot_bgcolor":"#fefefe","showlegend":false,"template":{"layout":{"colorway":["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],"font":{"color":"#444444","family":"Arial, sans-serif","size":12},"hovermode":"closest","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#cccccc","borderwidth":1,"font":{"size":11},"orientation":"h","x":0,"y":-0.15},"margin":{"b":80,"l":80,"r":40,"t":100},"paper_bgcolor":"#ffffff","plot_bgcolor":"#ffffff","title":{"font":{"color":"#444444","family":"Arial","size":20},"pad":{"b":25},"x":0.02,"xanchor":"left"},"xaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}},"yaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}}}},"title":{"font":{"color":"#1e293b","family":"Georgia, serif","size":18},"pad":{"b":30},"text":"\u003cb\u003eEstabilidad del Empleo por Categor\u00eda Ocupacional \u2022 Los R\u00edos\u003c\u002fb\u003e\u003cbr\u003e\u003cspan style=\"font-size:14px; color:#64748b;\"\u003e\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u003c\u002fspan\u003e\u003cbr\u003e\u003cspan style=\"font-size:13px; color:#475569;\"\u003eAn\u00e1lisis de variabilidad por categor\u00eda ocupacional \u2022 Menor valor = Mayor estabilidad\u003c\u002fspan\u003e","x":0.12,"xanchor":"left"},"xaxis":{"gridcolor":"#e2e8f0","gridwidth":1,"linecolor":"#cbd5e1","linewidth":1,"range":[0,119.21160441437938],"showgrid":true,"tickfont":{"color":"#475569","family":"Georgia, serif","size":11},"ticksuffix":"%","title":{"font":{"color":"#334155","family":"Georgia, serif","size":13},"text":"\u003cb\u003eCoeficiente de Variaci\u00f3n (%)\u003c\u002fb\u003e"}},"yaxis":{"automargin":true,"linecolor":"#cbd5e1","linewidth":1,"tickfont":{"color":"#1e293b","family":"Georgia, serif","size":11},"title":{"text":""}}},
        config: {"displaylogo": false, "responsive": true}
    },
    {
        targetId: '19ed95b5-a42d-4831-b6f5-6da45745280e',
        data: [{"customdata":[62.76470170232753,44.763525087548416,64.25800939039607,49.158269234639945,74.53579527169882,40.641870712171915],"hovertemplate":"\u003cb\u003e\ud83d\udc68 Hombres\u003c\u002fb\u003e\u003cbr\u003eSector: %{text}\u003cbr\u003eEmpleados: %{x:,.0f}\u003cbr\u003eParticipaci\u00f3n: %{customdata:.1f}%\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","marker":{"color":"#2E86AB","line":{"color":"white","width":1.5},"opacity":0.9},"name":"Hombres","orientation":"h","text":["Trabajadores por cuenta propia","Asalariados sector p\u00fablico","Familiar no remunerado","Empleadores","Asalariados sector privado","Personal de servicio dom\u00e9stico"],"x":[39393.311,42353.939,100207.884,80596.408,146106.895,114668.188],"y":["Trabajadores por\u003cbr\u003ecuenta propia","Asalariados\u003cbr\u003esector p\u00fablico","Familiar\u003cbr\u003eno remunerado","Empleadores","Asalariados\u003cbr\u003esector privado","Personal de\u003cbr\u003eservicio dom\u00e9stico"],"type":"bar"},{"customdata":[37.23529829767247,55.23647491245159,35.74199060960394,50.84173076536005,25.464204728301176,59.3581292878281],"hovertemplate":"\u003cb\u003e\ud83d\udc69 Mujeres\u003c\u002fb\u003e\u003cbr\u003eSector: %{text}\u003cbr\u003eEmpleadas: %{x:,.0f}\u003cbr\u003eParticipaci\u00f3n: %{customdata:.1f}%\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","marker":{"color":"#A23B72","line":{"color":"white","width":1.5},"opacity":0.9},"name":"Mujeres","orientation":"h","text":["Trabajadores por cuenta propia","Asalariados sector p\u00fablico","Familiar no remunerado","Empleadores","Asalariados sector privado","Personal de servicio dom\u00e9stico"],"x":[23370.169,52263.138,55738.254,83356.492,49915.559,167474.799],"y":["Trabajadores por\u003cbr\u003ecuenta propia","Asalariados\u003cbr\u003esector p\u00fablico","Familiar\u003cbr\u003eno remunerado","Empleadores","Asalariados\u003cbr\u003esector privado","Personal de\u003cbr\u003eservicio dom\u00e9stico"],"type":"bar"}],
        layout: {"annotations":[{"bgcolor":"rgba(255,255,255,0.9)","bordercolor":"#7A7A7A","borderwidth":1,"font":{"color":"#7F8C8D","family":"Georgia","size":10,"style":"italic"},"showarrow":false,"text":"Fuente: INE Chile | Metodolog\u00eda: An\u00e1lisis comparativo de g\u00e9nero","textangle":0,"x":1,"xanchor":"right","xref":"paper","y":-0.12,"yanchor":"bottom","yref":"paper"}],"bargap":0.3,"bargroupgap":0.15,"barmode":"group","font":{"color":"#2c3e50","family":"Georgia"},"height":650,"legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#ecf0f1","borderwidth":1,"font":{"color":"#2c3e50","size":13},"orientation":"h","x":0.5,"xanchor":"center","y":1.02,"yanchor":"bottom"},"margin":{"b":80,"l":200,"r":100,"t":140},"paper_bgcolor":"white","plot_bgcolor":"white","shapes":[{"line":{"color":"#7A7A7A","dash":"dot","width":2},"type":"line","x0":79620.41966666667,"x1":79620.41966666667,"xref":"x","y0":0,"y1":1,"yref":"y domain"}],"showlegend":true,"template":{"layout":{"colorway":["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],"font":{"color":"#444444","family":"Arial, sans-serif","size":12},"hovermode":"closest","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#cccccc","borderwidth":1,"font":{"size":11},"orientation":"h","x":0,"y":-0.15},"margin":{"b":80,"l":80,"r":40,"t":100},"paper_bgcolor":"#ffffff","plot_bgcolor":"#ffffff","title":{"font":{"color":"#444444","family":"Arial","size":20},"pad":{"b":25},"x":0.02,"xanchor":"left"},"xaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}},"yaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}}}},"title":{"font":{"color":"#2C3E50","family":"Georgia","size":18},"text":"\u25ac\u25ac\u25ac\u25ac Participaci\u00f3n Laboral por G\u00e9nero en Sectores Estrat\u00e9gicos\u003cbr\u003e\u003csup style='color:#666666'\u003eAn\u00e1lisis comparativo de empleo masculino vs femenino en Los R\u00edos\u003c\u002fsup\u003e","x":0.02,"y":0.95},"xaxis":{"gridcolor":"#ecf0f1","gridwidth":1,"showgrid":true,"tickfont":{"color":"#34495e","size":12},"tickformat":",.0f","title":{"font":{"color":"#2c3e50","size":14},"text":"\u003cb\u003eN\u00famero de Personas Empleadas\u003c\u002fb\u003e"},"zeroline":true,"zerolinecolor":"#bdc3c7","zerolinewidth":1},"yaxis":{"automargin":true,"categoryarray":["Trabajadores por\u003cbr\u003ecuenta propia","Asalariados\u003cbr\u003esector p\u00fablico","Familiar\u003cbr\u003eno remunerado","Empleadores","Asalariados\u003cbr\u003esector privado","Personal de\u003cbr\u003eservicio dom\u00e9stico"],"categoryorder":"array","tickfont":{"color":"#2c3e50","family":"Arial","size":11},"title":{"text":""}}},
        config: {"displaylogo": false, "responsive": true}
    },
    {
        targetId: 'aeedbf19-72f2-407c-8696-29fe251f0886',
        data: [{"connectgaps":true,"hovertemplate":"\u003cb\u003e%{fullData.name}\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eEmpleados: %{y:,.0f}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#1e3a8a","dash":"solid","width":3},"marker":{"color":"#1e3a8a","line":{"color":"white","width":1},"opacity":0.8,"size":8},"mode":"lines+markers","name":"Asalariados sector p\u00fa...","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wfkB+YH5wc=","dtype":"i2"},"y":{"bdata":"WDm0yLbCokDVeOkmMaBuQOomMQgskKNAnMQgsHIrhEDVeOkmMUp3QMqhRbZzq6pAqMZLN2kUvUDTTWIQWI9wQGDl0CIbJaZA\u002fKnx0k1ecUCS7Xw\u002fNamCQEJg5dAi84lAObTIdv7XtkA=","dtype":"f8"},"type":"scatter"},{"connectgaps":true,"hovertemplate":"\u003cb\u003e%{fullData.name}\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eEmpleados: %{y:,.0f}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#dc2626","dash":"dash","width":3},"marker":{"color":"#dc2626","line":{"color":"white","width":1},"opacity":0.8,"size":8},"mode":"lines+markers","name":"Familiar no remunerado","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wfkB+UH5wc=","dtype":"i2"},"y":{"bdata":"iUFg5RBxskAxCKwcmp2xQAisHFrkPrFAvp8aL91JhkBeukkMAjGEQIcW2c63JKxAg8DKoaVQvEBrvHSTGHOcQAwCK4f2bMpASOF6FO67pUCUGARWToisQFg5tMh29nBAvHSTGATAq0A=","dtype":"f8"},"type":"scatter"},{"connectgaps":true,"hovertemplate":"\u003cb\u003e%{fullData.name}\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eEmpleados: %{y:,.0f}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#047857","dash":"dot","width":3},"marker":{"color":"#047857","line":{"color":"white","width":1},"opacity":0.8,"size":8},"mode":"lines+markers","name":"Trabajadores por cuent...","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wfkB+YH5wfoBw==","dtype":"i2"},"y":{"bdata":"vHSTGGRcsEC6SQwCK3yLQHsUrkcBf7FAuB6F6\u002fEZs0DFILBy2NTAQMDKoUVmistAy6FFtvPNf0ApXI\u002fClQC0QOSlm8Sw+sxAMzMzM7MXlECq8dJN4qSrQM3MzMxMHsFAmpmZmZlCr0DdJAaBlZt6QA==","dtype":"f8"},"type":"scatter"},{"connectgaps":true,"hovertemplate":"\u003cb\u003e%{fullData.name}\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eEmpleados: %{y:,.0f}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#d97706","dash":"dashdot","width":3},"marker":{"color":"#d97706","line":{"color":"white","width":1},"opacity":0.8,"size":8},"mode":"lines+markers","name":"Personal de servicio d...","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wfkB+UH5gc=","dtype":"i2"},"y":{"bdata":"qvHSTTKuwUCPwvUoXMyfQGiR7XwPEsZAYhBYOSR\u002f2kB3vp8aL11ZQOSlm8QglqBABFYOLbJGjkAfhetRKP3EQIpBYOVQB5JAhxbZzmeLxUBeukkMApGWQIGVQ4tsGb1AWDm0yHa+GUA=","dtype":"f8"},"type":"scatter"},{"connectgaps":true,"hovertemplate":"\u003cb\u003e%{fullData.name}\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eEmpleados: %{y:,.0f}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#7c3aed","dash":"solid","width":2.5},"marker":{"color":"#7c3aed","line":{"color":"white","width":1},"opacity":0.8,"size":8},"mode":"lines+markers","name":"Empleadores","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wfkB+UH5gfnB+gH","dtype":"i2"},"y":{"bdata":"YOXQItv5hkCamZmZucC3QDMzMzMzy2BAXrpJDMIuwEC0yHa+D+7AQPYoXI9CUpNAPgrXozCp30B7FK5HwUnBQHNoke08qaZAhxbZzt9K0UAYBFYOrW+SQDEIrBxaOY9AkML1KKyqyEBI4XoULtzIQAaBlUOLb4hA","dtype":"f8"},"type":"scatter"},{"connectgaps":true,"hovertemplate":"\u003cb\u003e%{fullData.name}\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eEmpleados: %{y:,.0f}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"#0f766e","dash":"dash","width":2.5},"marker":{"color":"#0f766e","line":{"color":"white","width":1},"opacity":0.8,"size":8},"mode":"lines+markers","name":"Asalariados sector pri...","x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wfkB+UH5gfnB+gH","dtype":"i2"},"y":{"bdata":"vp8aL12GnkCDwMqhLXzXQMh2vp8i9tJA9ihcj0JQl0Cmm8QgQDnHQIlBYOWI3tNAQDVeumkNyEC8dJMYNCLGQFg5tMi266FAGy\u002fdJAY61ED0\u002fdR4AWDVQIXrUbiOW9lAuB6F64HC0kCuR+F6xEraQBSuR+F6zI9A","dtype":"f8"},"type":"scatter"},{"hovertemplate":"\u003cb\u003ePromedio Regional\u003c\u002fb\u003e\u003cbr\u003eA\u00f1o: %{x}\u003cbr\u003eEmpleados: %{y:,.0f}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","line":{"color":"rgba(122, 122, 122, 0.6)","dash":"dot","width":2},"mode":"lines","name":"Promedio Regional","showlegend":true,"x":{"bdata":"2gfbB9wH3QfeB98H4AfhB+IH4wfkB+UH5gfnB+gH","dtype":"i2"},"y":{"bdata":"9ShcjwIErkCU0duyxpu4QJX8Ysl\u002fgbtASzeJQSAZvECtjgkebLmzQNV46SZxLr1AS8XZh4fTw0B4d3d3F9S4QPnFkl9ccrhA+Qy7AgSDwUBgLPnFUge1QAaBlUPH78BA3nGKjhQwwEBEaW\u002fwRbnEQC1rdUzwLYdA","dtype":"f8"},"type":"scatter"}],
        layout: {"font":{"color":"#1e293b","family":"Georgia, serif"},"height":580,"hoverlabel":{"bgcolor":"rgba(255,255,255,0.98)","bordercolor":"#cbd5e1","font":{"color":"#1e293b","family":"Georgia, serif","size":12}},"hovermode":"x unified","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#e2e8f0","borderwidth":1,"font":{"color":"#1e293b","family":"Georgia, serif","size":10},"orientation":"v","x":1.02,"xanchor":"left","y":0.98,"yanchor":"top"},"margin":{"b":90,"l":100,"r":200,"t":160},"paper_bgcolor":"white","plot_bgcolor":"#fefefe","showlegend":true,"spikedistance":-1,"spikesnap":"cursor","template":{"layout":{"colorway":["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],"font":{"color":"#444444","family":"Arial, sans-serif","size":12},"hovermode":"closest","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#cccccc","borderwidth":1,"font":{"size":11},"orientation":"h","x":0,"y":-0.15},"margin":{"b":80,"l":80,"r":40,"t":100},"paper_bgcolor":"#ffffff","plot_bgcolor":"#ffffff","title":{"font":{"color":"#444444","family":"Arial","size":20},"pad":{"b":25},"x":0.02,"xanchor":"left"},"xaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}},"yaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}}}},"title":{"font":{"color":"#1e293b","family":"Georgia, serif","size":18},"pad":{"b":30},"text":"\u003cb\u003eEvoluci\u00f3n Temporal del Empleo por Sector\u003c\u002fb\u003e\u003cbr\u003e\u003cspan style=\"font-size:14px; color:#64748b;\"\u003e\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u003c\u002fspan\u003e\u003cbr\u003e\u003cspan style=\"font-size:13px; color:#475569;\"\u003eDin\u00e1micas de crecimiento sectorial \u2022 Los R\u00edos, Chile (2010-2019)\u003c\u002fspan\u003e","x":0.12,"xanchor":"left"},"xaxis":{"dtick":1,"gridcolor":"#e2e8f0","gridwidth":1,"linecolor":"#cbd5e1","linewidth":1,"range":[2009.5,2019.5],"showgrid":true,"showspikes":true,"spikecolor":"rgba(30,58,138,0.35)","spikedash":"solid","spikemode":"across","spikesnap":"cursor","spikethickness":1.5,"tickfont":{"color":"#475569","family":"Georgia, serif","size":11},"tickformat":"d","title":{"font":{"color":"#334155","family":"Georgia, serif","size":13},"text":"\u003cb\u003eA\u00f1o\u003c\u002fb\u003e"}},"yaxis":{"gridcolor":"#e2e8f0","gridwidth":1,"linecolor":"#cbd5e1","linewidth":1,"showgrid":true,"showspikes":false,"tickfont":{"color":"#475569","family":"Georgia, serif","size":11},"tickformat":",.0f","title":{"font":{"color":"#334155","family":"Georgia, serif","size":13},"text":"\u003cb\u003eN\u00famero de Empleados\u003c\u002fb\u003e"}}},
        config: {"displaylogo": false, "responsive": true}
    },
    {
        targetId: 'b5a5d5b8-4279-4feb-aee6-4a5142d0b71c',
        data: [{"customdata":{"bdata":"UFjAcVU9E0DAcv1QyuIhQGFQDpuQSSpAy+EeAPlhLUAErtsz6Qo0QLl0z7xLL0NA","dtype":"f8"},"hovertemplate":"\u003cb\u003e%{y}\u003c\u002fb\u003e\u003cbr\u003eTotal empleados: %{x:,.0f}\u003cbr\u003eParticipaci\u00f3n: %{customdata:.1f}% del empleo total\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","marker":{"color":["#1e3a8a","#7f1d1d","#14532d","#d97706","#334155","#dc2626"],"line":{"color":"white","width":1.5},"opacity":0.85},"orientation":"h","showlegend":false,"x":{"bdata":"7Xw\u002fNeYH20Bcj8L1BCHpQIlBYOVid\u002fJA3SQGgQmk9ECmm8Qguij8QHnpJjEt9ApB","dtype":"f8"},"y":["Asalariados\u003cbr\u003esector p\u00fablico","Familiar\u003cbr\u003eno remunerado","Trabajadores por\u003cbr\u003ecuenta propia","Personal de\u003cbr\u003eservicio dom\u00e9stico","Empleadores","Asalariados\u003cbr\u003esector privado"],"type":"bar"}],
    layout: {"annotations":[{"align":"left","font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003e4.8%\u003c\u002fb\u003e","x":34303.766469999995,"xanchor":"left","y":0,"yanchor":"middle"},
    {"align":"left","font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003e8.9%\u003c\u002fb\u003e","x":58088.32447,"xanchor":"left","y":1,"yanchor":"middle"},{"align":"left","font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003e13.1%\u003c\u002fb\u003e","x":82262.35046999999,"xanchor":"left","y":2,"yanchor":"middle"},{"align":"left","font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003e14.7%\u003c\u002fb\u003e","x":91168.76346999999,"xanchor":"left","y":3,"yanchor":"middle"},{"align":"left","font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003e20.0%\u003c\u002fb\u003e","x":121963.80247,"xanchor":"left","y":4,"yanchor":"middle"},{"align":"left","font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003e38.4%\u003c\u002fb\u003e","x":227429.81847,"xanchor":"left","y":5,"yanchor":"middle"},{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#64748b","borderwidth":1,"font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003ePromedio\u003cbr\u003e95,912\u003c\u002fb\u003e","textangle":0,"x":95911.96816666667,"xanchor":"center","xref":"x","y":1,"yanchor":"bottom","yref":"y domain"}],"font":{"color":"#1e293b","family":"Georgia, serif"},"height":750,"margin":{"b":90,"l":280,"r":140,"t":160},"paper_bgcolor":"white","plot_bgcolor":"#fefefe","shapes":[{"line":{"color":"#64748b","dash":"dot","width":2},"type":"line","x0":95911.96816666667,"x1":95911.96816666667,"xref":"x","y0":0,"y1":1,"yref":"y domain"}],"showlegend":false,"template":{"layout":{"colorway":["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],"font":{"color":"#444444","family":"Arial, sans-serif","size":12},"hovermode":"closest","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#cccccc","borderwidth":1,"font":{"size":11},"orientation":"h","x":0,"y":-0.15},"margin":{"b":80,"l":80,"r":40,"t":100},"paper_bgcolor":"#ffffff","plot_bgcolor":"#ffffff","title":{"font":{"color":"#444444","family":"Arial","size":20},"pad":{"b":25},"x":0.02,"xanchor":"left"},"xaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}},"yaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}}}},"title":{"font":{"color":"#1e293b","family":"Georgia, serif","size":18},"pad":{"b":30},"text":"\u003cb\u003eLos Trabajos M\u00e1s Comunes en la Regi\u00f3n de Los R\u00edos\u003c\u002fb\u003e\u003cbr\u003e\u003cspan style=\"font-size:14px; color:#64748b;\"\u003e\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u003c\u002fspan\u003e\u003cbr\u003e\u003cspan style=\"font-size:13px; color:#475569;\"\u003eDistribuci\u00f3n del empleo por sector ocupacional \u2022 Los R\u00edos, Chile (2010-2019)\u003c\u002fspan\u003e","x":0.12,"xanchor":"left"},"xaxis":{"gridcolor":"#e2e8f0","gridwidth":1,"linecolor":"#cbd5e1","linewidth":1,"showgrid":true,"tickfont":{"color":"#475569","family":"Georgia, serif","size":11},"tickformat":",.0f","title":{"font":{"color":"#334155","family":"Georgia, serif","size":13},"text":"\u003cb\u003eN\u00famero Total de Personas Empleadas\u003c\u002fb\u003e"},"zeroline":false},"yaxis":{"automargin":true,"categoryarray":["Asalariados\u003cbr\u003esector p\u00fablico","Familiar\u003cbr\u003eno remunerado","Trabajadores por\u003cbr\u003ecuenta propia","Personal de\u003cbr\u003eservicio dom\u00e9stico","Empleadores","Asalariados\u003cbr\u003esector privado"],"categoryorder":"array","linecolor":"#cbd5e1","linewidth":1,"showgrid":false,"tickfont":{"color":"#1e293b","family":"Georgia, serif","size":10},"tickmode":"linear","title":{"text":""}}},
    config: {"displaylogo": false, "responsive": true}
    },
    {
        targetId: 'c39601bf-93e6-425a-9931-e1a836f9b1e7',
        data: [{"customdata":{"bdata":"EFNAeEqiUkCDwMqhs+0HQfhz0TmDEFBAd76fGlEJA0GcWNG+4WFPQMP1KFxvpe5A6l6RKkKUSEAzMzMzhwMEQRZZqDC7YUZAHFpkO5EZ90DxhMrRKFJEQMQgsPJ7OBFB","dtype":"f8","shape":"6, 2"},"hovertemplate":"\u003cb\u003e%{y}\u003c\u002fb\u003e\u003cbr\u003eParticipaci\u00f3n de mujeres: %{x:.1f}%\u003cbr\u003eParticipaci\u00f3n de hombres: %{customdata[0]:.1f}%\u003cbr\u003eTotal de empleados: %{customdata[1]:,.0f}\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","marker":{"color":["#dc2626","#ea580c","#ea580c","#1e40af","#0f766e","#0f766e"],"line":{"color":"white","width":1.2},"opacity":0.85},"orientation":"h","showlegend":false,"x":{"bdata":"vrP+HtZ2OUARGF2M+d5BQGSnLkEenkJAFaFu1b1rSUDrplfPRJ5LQBF7NS7XrU1A","dtype":"f8"},"y":["Asalariados\u003cbr\u003esector privado","Familiar no remunerado","Trabajadores por\u003cbr\u003ecuenta propia","Empleadores","Asalariados\u003cbr\u003esector p\u00fablico","Personal de\u003cbr\u003eservicio dom\u00e9stico"],"type":"bar"}],
        layout: {"annotations":[{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#64748b","borderwidth":1,"font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003eParidad\u003cbr\u003e50%\u003c\u002fb\u003e","textangle":0,"x":50,"xanchor":"center","xref":"x","y":1,"yanchor":"bottom","yref":"y domain"}],"font":{"color":"#1e293b","family":"Georgia, serif"},"height":650,"margin":{"b":90,"l":280,"r":120,"t":160},"paper_bgcolor":"white","plot_bgcolor":"#fefefe","shapes":[{"line":{"color":"#64748b","dash":"dot","width":2},"type":"line","x0":50,"x1":50,"xref":"x","y0":0,"y1":1,"yref":"y domain"}],"showlegend":false,"template":{"layout":{"colorway":["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],"font":{"color":"#444444","family":"Arial, sans-serif","size":12},"hovermode":"closest","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#cccccc","borderwidth":1,"font":{"size":11},"orientation":"h","x":0,"y":-0.15},"margin":{"b":80,"l":80,"r":40,"t":100},"paper_bgcolor":"#ffffff","plot_bgcolor":"#ffffff","title":{"font":{"color":"#444444","family":"Arial","size":20},"pad":{"b":25},"x":0.02,"xanchor":"left"},"xaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}},"yaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}}}},"title":{"font":{"color":"#1e293b","family":"Georgia, serif","size":18},"pad":{"b":30},"text":"\u003cb\u003eParticipaci\u00f3n de Mujeres por Sector Laboral\u003c\u002fb\u003e\u003cbr\u003e\u003cspan style=\"font-size:14px; color:#64748b;\"\u003e\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u003c\u002fspan\u003e\u003cbr\u003e\u003cspan style=\"font-size:13px; color:#475569;\"\u003eDistribuci\u00f3n de g\u00e9nero en el empleo \u2022 Los R\u00edos, Chile (2010-2019)\u003c\u002fspan\u003e","x":0.12,"xanchor":"left"},"xaxis":{"gridcolor":"#e2e8f0","gridwidth":1,"linecolor":"#cbd5e1","linewidth":1,"range":[0,100],"showgrid":true,"tickfont":{"color":"#475569","family":"Georgia, serif","size":11},"ticksuffix":"%","title":{"font":{"color":"#334155","family":"Georgia, serif","size":13},"text":"\u003cb\u003eParticipaci\u00f3n de Mujeres (%)\u003c\u002fb\u003e"},"zeroline":false},"yaxis":{"automargin":true,"categoryarray":["Asalariados\u003cbr\u003esector privado","Familiar no remunerado","Trabajadores por\u003cbr\u003ecuenta propia","Empleadores","Asalariados\u003cbr\u003esector p\u00fablico","Personal de\u003cbr\u003eservicio dom\u00e9stico"],"categoryorder":"array","linecolor":"#cbd5e1","linewidth":1,"showgrid":false,"tickfont":{"color":"#1e293b","family":"Georgia, serif","size":10},"title":{"text":""}}},
        config: {"displaylogo": false, "responsive": true}
    },
    {
        targetId: 'e0ec7aa7-e263-46ed-b579-ad2add9c7671',
        data: [{"customdata":{"bdata":"UFjAcVU9E0BQWMBxVT0TQMBy\u002fVDK4iFA6J7dCXWBK0BhUA6bkEkqQKT3ddKC5TpAy+EeAPlhLUBFtEKpP8tEQASu2zPpCjRAR4swQ7TQTkC5dM+8Sy9DQAAAAAAAAFlA","dtype":"f8","shape":"6, 2"},"hovertemplate":"\u003cb\u003e%{text}\u003c\u002fb\u003e\u003cbr\u003eEmpleados: %{x:,.0f}\u003cbr\u003eParticipaci\u00f3n: %{customdata[0]:.1f}%\u003cbr\u003eAcumulado: %{customdata[1]:.1f}%\u003cbr\u003e\u003cextra\u003e\u003c\u002fextra\u003e","marker":{"color":["#1e3a8a","#7f1d1d","#14532d","#d97706","#334155","#dc2626"],"line":{"color":"white","width":1.2},"opacity":0.85},"orientation":"h","showlegend":false,"text":["Asalariados sector p\u00fablico","Familiar no remunerado","Trabajadores por cuenta propia","Personal de servicio dom\u00e9stico","Empleadores","Asalariados sector privado"],"x":{"bdata":"7Xw\u002fNeYH20Bcj8L1BCHpQIlBYOVid\u002fJA3SQGgQmk9ECmm8Qguij8QHnpJjEt9ApB","dtype":"f8"},"y":["Asalariados\u003cbr\u003esector p\u00fablico","Familiar no remunerado","Trabajadores por\u003cbr\u003ecuenta propia","Personal de\u003cbr\u003eservicio dom\u00e9stico","Empleadores","Asalariados\u003cbr\u003esector privado"],"type":"bar"}],
        layout: {"annotations":[{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#64748b","borderwidth":1,"font":{"color":"#1e293b","family":"Georgia, serif","size":11},"showarrow":false,"text":"\u003cb\u003ePromedio\u003cbr\u003e95,912\u003c\u002fb\u003e","textangle":0,"x":95911.96816666667,"xanchor":"center","xref":"x","y":1,"yanchor":"bottom","yref":"y domain"}],"font":{"color":"#1e293b","family":"Georgia, serif"},"height":650,"margin":{"b":90,"l":280,"r":140,"t":160},"paper_bgcolor":"white","plot_bgcolor":"#fefefe","shapes":[{"line":{"color":"#64748b","dash":"dot","width":2},"type":"line","x0":95911.96816666667,"x1":95911.96816666667,"xref":"x","y0":0,"y1":1,"yref":"y domain"}],"showlegend":false,"template":{"layout":{"colorway":["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"],"font":{"color":"#444444","family":"Arial, sans-serif","size":12},"hovermode":"closest","legend":{"bgcolor":"rgba(255,255,255,0.95)","bordercolor":"#cccccc","borderwidth":1,"font":{"size":11},"orientation":"h","x":0,"y":-0.15},"margin":{"b":80,"l":80,"r":40,"t":100},"paper_bgcolor":"#ffffff","plot_bgcolor":"#ffffff","title":{"font":{"color":"#444444","family":"Arial","size":20},"pad":{"b":25},"x":0.02,"xanchor":"left"},"xaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}},"yaxis":{"gridcolor":"#cccccc","linecolor":"#7a7a7a","tickfont":{"color":"#444444","size":11},"ticks":"","title":{"font":{"color":"#444444","size":14}}}}},"title":{"font":{"color":"#1e293b","family":"Georgia, serif","size":18},"pad":{"b":30},"text":"\u003cb\u003eEstructura Sectorial del Empleo Regional\u003c\u002fb\u003e\u003cbr\u003e\u003cspan style=\"font-size:14px; color:#64748b;\"\u003e\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u25ac\u003c\u002fspan\u003e\u003cbr\u003e\u003cspan style=\"font-size:13px; color:#475569;\"\u003eDistribuci\u00f3n de empleos por sector econ\u00f3mico \u2022 Los R\u00edos, Chile (2010-2019)\u003c\u002fspan\u003e","x":0.12,"xanchor":"left"},"xaxis":{"gridcolor":"#e2e8f0","gridwidth":1,"linecolor":"#cbd5e1","linewidth":1,"showgrid":true,"tickfont":{"color":"#475569","family":"Georgia, serif","size":11},"tickformat":",.0f","title":{"font":{"color":"#334155","family":"Georgia, serif","size":13},"text":"\u003cb\u003eN\u00famero de Empleados\u003c\u002fb\u003e"},"zeroline":false},"yaxis":{"automargin":true,"categoryarray":["Asalariados\u003cbr\u003esector p\u00fablico","Familiar no remunerado","Trabajadores por\u003cbr\u003ecuenta propia","Personal de\u003cbr\u003eservicio dom\u00e9stico","Empleadores","Asalariados\u003cbr\u003esector privado"],"categoryorder":"array","linecolor":"#cbd5e1","linewidth":1,"showgrid":false,"tickfont":{"color":"#1e293b","family":"Georgia, serif","size":10},"title":{"text":""}}},
        config: {"displaylogo": false, "responsive": true}
    },
];

function temporarilyRevealSection(section) {
    if (!section || section.classList.contains('active')) {
        return () => {};
    }

    const count = Number(section.dataset.tempVisibleCount || '0') + 1;
    section.dataset.tempVisibleCount = String(count);
    if (count === 1) {
        section.classList.add('section-temp-visible');
    }

    return () => {
        const next = Number(section.dataset.tempVisibleCount || '1') - 1;
        if (next <= 0) {
            section.classList.remove('section-temp-visible');
            delete section.dataset.tempVisibleCount;
        } else {
            section.dataset.tempVisibleCount = String(next);
        }
    };
}

const RESIZE_PENDING_ATTR = 'data-plotly-resize-pending';

function markSectionNeedsResize(section) {
    if (section) {
        section.setAttribute(RESIZE_PENDING_ATTR, 'true');
    }
}

function clearSectionResize(section) {
    if (section) {
        section.removeAttribute(RESIZE_PENDING_ATTR);
    }
}

function renderCharts() {
    window.PLOTLYENV = window.PLOTLYENV || {};
    chartDefinitions.forEach(({ targetId, data, layout, config }) => {
        const container = document.getElementById(targetId);
        if (!container || container.dataset.highcharts === 'true') {
            return;
        }
        const decodedData = data.map((trace) => {
            const copy = { ...trace };
            decodeTraceArrays(copy);
            return copy;
        });
        const layoutCopy = { ...layout };
        if ('width' in layoutCopy) {
            delete layoutCopy.width;
        }
        layoutCopy.autosize = true;

        const configWithButtons = {
            displaylogo: false,
            responsive: true,
            displayModeBar: true,
            ...(config || {}),
        };

        const modebarButtons = buildModebarButtons();
        configWithButtons.modeBarButtonsToAdd = [
            ...(configWithButtons.modeBarButtonsToAdd || []),
            ...modebarButtons,
        ];

        const section = container.closest('.section');
        const releaseSection = temporarilyRevealSection(section);

        try {
            const host = container.parentElement || container;
            const bounds = host.getBoundingClientRect();
            const measuredWidth = Math.floor(bounds.width);
            if (measuredWidth > 0) {
                layoutCopy.width = measuredWidth;
            } else {
                markSectionNeedsResize(section);
            }

            const plotPromise = Plotly.newPlot(targetId, decodedData, layoutCopy, configWithButtons);
            attachExportToolbar(container, plotPromise, getCustomExportOptions(targetId));
            if (plotPromise && typeof plotPromise.finally === 'function') {
                plotPromise.finally(releaseSection);
            } else {
                releaseSection();
            }
        } catch (error) {
            releaseSection();
            throw error;
        }
    });
}

function resizeTargets(sectionId) {
    const scope = sectionId ? document.getElementById(sectionId) : document;
    if (!scope) {
        return;
    }
    const section = sectionId ? scope : null;
    const releaseSection = temporarilyRevealSection(section);

    requestAnimationFrame(() => {
        const plots = scope.querySelectorAll('.plotly-graph-div');
        plots.forEach((plot) => {
            if (!sectionId && plot.offsetParent === null) {
                return;
            }
            Plotly.Plots.resize(plot);
        });
        if (section) {
            clearSectionResize(section);
        } else {
            clearSectionResize(document.querySelector('.section.active'));
        }
        releaseSection();
    });
}

function reflowHighcharts(sectionId) {
    const highcharts = window.Highcharts;
    if (!highcharts || !Array.isArray(highcharts.charts)) {
        return;
    }

    const scope = sectionId ? document.getElementById(sectionId) : document;
    if (!scope) {
        return;
    }

    const chartsInScope = highcharts.charts.filter((chart) => {
        if (!chart || !chart.renderTo) {
            return false;
        }
        return scope === document ? true : scope.contains(chart.renderTo);
    });

    if (!chartsInScope.length) {
        return;
    }

    requestAnimationFrame(() => {
        chartsInScope.forEach((chart) => {
            try {
                chart.reflow();
            } catch {
                // ignore
            }
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    renderPanoramaHighcharts();
    renderDinamicaGeneroHighcharts();
    renderEstabilidadHighcharts();
    renderSectoresGeneroHighcharts();
    renderEvolucionSectorialHighcharts();
    renderTrabajosComunesHighcharts();
    renderParticipacionGeneroHighcharts();
    renderEstructuraSectorialHighcharts();
    renderCharts();
    window.addEventListener('resize', () => {
        document.querySelectorAll('.section').forEach((section) => {
            markSectionNeedsResize(section);
        });
        reflowHighcharts();
        resizeTargets();
    });
});

window.resizeCharts = (sectionId) => {
    reflowHighcharts(sectionId);

    if (!sectionId) {
        resizeTargets();
        return;
    }

    const section = document.getElementById(sectionId);
    if (!section) {
        return;
    }

    if (section.hasAttribute(RESIZE_PENDING_ATTR)) {
        resizeTargets(sectionId);
    }
};
