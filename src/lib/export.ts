// Shared report-export helpers — real PDF (jsPDF + autotable) and Excel
// (SheetJS), plus a CSV convenience that reuses the existing csv.ts plumbing.
// Used by the Reports module and the Incidents dashboard so they share one
// tabular-export call site.

import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

import { downloadTextFile, toCsv } from "@/lib/csv"

export interface ExportColumn {
  /** Column header label (already translated by the caller). */
  header: string
  /** Optional stable key — informational; rows are positional, not keyed. */
  key?: string
}

/** One row is a list of cells aligned positionally to `columns`. */
export type ExportRow = (string | number)[]

export interface PdfExportOptions {
  filename: string
  title: string
  subtitle?: string
  /** Extra lines under the title (e.g. filter summary, generated-at). */
  meta?: string[]
  columns: ExportColumn[]
  rows: ExportRow[]
}

export interface XlsxSheet {
  /** Sheet tab name — Excel caps this at 31 chars (we truncate). */
  name: string
  columns: ExportColumn[]
  rows: ExportRow[]
}

// Teal brand color (matches the app's primary), used for the PDF header row.
const BRAND_RGB: [number, number, number] = [15, 118, 110]
const ROW_TINT_RGB: [number, number, number] = [240, 245, 244]

/** Render a single-table report to a downloaded PDF (landscape A4). */
export function exportToPdf(opts: PdfExportOptions): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" })
  const marginX = 40
  let y = 46

  doc.setFont("helvetica", "bold")
  doc.setFontSize(15)
  doc.text(opts.title, marginX, y)
  y += 16

  if (opts.subtitle) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(10)
    doc.setTextColor(110)
    doc.text(opts.subtitle, marginX, y)
    y += 13
  }

  if (opts.meta && opts.meta.length > 0) {
    doc.setFont("helvetica", "normal")
    doc.setFontSize(9)
    doc.setTextColor(130)
    for (const line of opts.meta) {
      doc.text(line, marginX, y)
      y += 11
    }
  }
  doc.setTextColor(0)

  autoTable(doc, {
    startY: y + 8,
    head: [opts.columns.map((c) => c.header)],
    body: opts.rows.map((row) => row.map((cell) => String(cell))),
    styles: { fontSize: 8, cellPadding: 4, overflow: "linebreak" },
    headStyles: { fillColor: BRAND_RGB, textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: ROW_TINT_RGB },
    margin: { left: marginX, right: marginX },
  })

  doc.save(opts.filename)
}

/** Render one or more tables to a downloaded .xlsx workbook (one sheet each). */
export function exportToXlsx(filename: string, sheets: XlsxSheet[]): void {
  const wb = XLSX.utils.book_new()
  for (const sheet of sheets) {
    const aoa = [sheet.columns.map((c) => c.header), ...sheet.rows]
    const ws = XLSX.utils.aoa_to_sheet(aoa)
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.slice(0, 31))
  }
  XLSX.writeFile(wb, filename)
}

/** Download a single table as CSV (reuses the RFC-4180 serializer in csv.ts). */
export function exportToCsv(
  filename: string,
  columns: ExportColumn[],
  rows: ExportRow[]
): void {
  downloadTextFile(filename, toCsv(columns.map((c) => c.header), rows))
}
