// Generación de PDFs (listado completo y pedido individual) con jsPDF + autoTable.
// Se arma en el cliente a partir de los mismos datos que ya muestra la interfaz,
// reutilizando los formateadores de utils/format.js para mantener consistencia.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatoPrecio, formatoFecha, formatoFechaHora, paisMostrar } from './format.js';

const COLOR_PRIMARY = [59, 130, 246]; // --primary
const COLOR_TEXT = [30, 41, 59]; // --text
const COLOR_MUTED = [100, 116, 139]; // --text-soft
const COLOR_DJ = [139, 92, 246]; // --dj
const COLOR_DJ_BG = [242, 237, 253]; // --dj-bg
const COLOR_LINE = [226, 232, 240]; // --border

const COLOR_ESTADO = {
  'En espera': [180, 120, 6],
  'En camino': [37, 99, 235],
  Recibido: [21, 128, 61],
};

const MARGEN = 14;

// Encabezado con la marca de la clínica, un subtítulo y la fecha de generación.
function encabezado(doc, subtitulo) {
  const ancho = doc.internal.pageSize.getWidth();
  doc.setFillColor(...COLOR_PRIMARY);
  doc.rect(0, 0, ancho, 24, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Clínica Mottura', MARGEN, 11);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(subtitulo, MARGEN, 18);
  doc.setFontSize(8);
  doc.text(`Generado el ${new Date().toLocaleString('es-AR')}`, ancho - MARGEN, 18, { align: 'right' });
  doc.setTextColor(...COLOR_TEXT);
}

// Pie de página con línea separadora y numeración, repetido en todas las páginas.
function piePagina(doc) {
  const totalPaginas = doc.internal.getNumberOfPages();
  const ancho = doc.internal.pageSize.getWidth();
  const alto = doc.internal.pageSize.getHeight();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLOR_LINE);
    doc.line(MARGEN, alto - 14, ancho - MARGEN, alto - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...COLOR_MUTED);
    doc.text('Clínica Mottura · Gestión de pedidos', MARGEN, alto - 9);
    doc.text(`Página ${i} de ${totalPaginas}`, ancho - MARGEN, alto - 9, { align: 'right' });
  }
}

// Exporta el listado completo de pedidos (el actualmente visible/filtrado) a un único PDF.
export function exportarListadoPDF(pedidos) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  encabezado(doc, `Listado de pedidos — ${pedidos.length} resultado${pedidos.length === 1 ? '' : 's'}`);

  autoTable(doc, {
    startY: 30,
    head: [['N° pedido', 'Empresa', 'País', 'Proveedor', 'Fecha', 'Precio', 'Estado', 'Declaración Jurada']],
    body: pedidos.map((p) => [
      p.numero_pedido,
      p.empresa,
      paisMostrar(p),
      p.proveedor,
      formatoFecha(p.fecha_compra),
      formatoPrecio(p.precio_total, p.moneda),
      p.estado,
      p.tiene_dj ? (p.numero_dj || 'Sí') : 'Sin declarar',
    ]),
    styles: { fontSize: 8.5, cellPadding: 3, textColor: COLOR_TEXT, lineColor: COLOR_LINE },
    headStyles: { fillColor: COLOR_PRIMARY, textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [247, 249, 252] },
    margin: { left: MARGEN, right: MARGEN, top: 30, bottom: 20 },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      if (data.column.index === 6) {
        data.cell.styles.textColor = COLOR_ESTADO[data.cell.raw] || COLOR_TEXT;
        data.cell.styles.fontStyle = 'bold';
      }
      if (data.column.index === 7 && data.cell.raw !== 'Sin declarar') {
        data.cell.styles.textColor = COLOR_DJ;
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  piePagina(doc);
  doc.save(`pedidos_${new Date().toISOString().slice(0, 10)}.pdf`);
}

// Exporta el detalle completo de un único pedido (incluye historial de estados) a PDF.
export function exportarPedidoPDF(pedido) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const ancho = doc.internal.pageSize.getWidth();
  const anchoUtil = ancho - MARGEN * 2;
  encabezado(doc, `Pedido ${pedido.numero_pedido}`);

  const campos = [
    ['N° de pedido', pedido.numero_pedido],
    ['Estado', pedido.estado],
    ['Empresa', pedido.empresa],
    ['País de origen', paisMostrar(pedido)],
    ['Proveedor', pedido.proveedor],
    ['Precio total', formatoPrecio(pedido.precio_total, pedido.moneda)],
    ['Fecha de compra', formatoFecha(pedido.fecha_compra)],
  ];

  autoTable(doc, {
    startY: 30,
    body: campos,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 1.8 },
    columnStyles: {
      0: { fontStyle: 'bold', textColor: COLOR_MUTED, cellWidth: 42 },
      1: { textColor: COLOR_TEXT },
    },
    margin: { left: MARGEN, right: MARGEN },
  });

  let y = doc.lastAutoTable.finalY + 6;

  const bloqueTexto = (titulo, texto) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLOR_TEXT);
    doc.text(titulo, MARGEN, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_MUTED);
    const lineas = doc.splitTextToSize(texto, anchoUtil);
    doc.text(lineas, MARGEN, y);
    y += lineas.length * 4.4 + 6;
  };

  if (pedido.descripcion) bloqueTexto('Descripción', pedido.descripcion);
  if (pedido.observaciones) bloqueTexto('Observaciones', pedido.observaciones);

  // Bloque de Declaración Jurada, con color propio (violeta) para diferenciarlo del resto.
  if (pedido.tiene_dj) {
    const altoBloque = 18;
    doc.setFillColor(...COLOR_DJ_BG);
    doc.setDrawColor(...COLOR_DJ);
    doc.roundedRect(MARGEN, y, anchoUtil, altoBloque, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...COLOR_DJ);
    doc.text('Declaración Jurada', MARGEN + 4, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`N°: ${pedido.numero_dj || '—'}`, MARGEN + 4, y + 13.5);
    y += altoBloque + 8;
  }

  if (pedido.historial?.length) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_TEXT);
    doc.text('Historial de estados', MARGEN, y);

    autoTable(doc, {
      startY: y + 3,
      head: [['Cambio', 'Fecha']],
      body: pedido.historial.map((h) => [
        h.estado_anterior ? `${h.estado_anterior} → ${h.estado_nuevo}` : `Creado como "${h.estado_nuevo}"`,
        formatoFechaHora(h.fecha),
      ]),
      styles: { fontSize: 9, cellPadding: 2.5, lineColor: COLOR_LINE },
      headStyles: { fillColor: COLOR_PRIMARY, textColor: 255, fontStyle: 'bold' },
      margin: { left: MARGEN, right: MARGEN },
    });
  }

  piePagina(doc);
  doc.save(`pedido_${pedido.numero_pedido}.pdf`);
}
