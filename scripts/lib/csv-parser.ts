/**
 * Simple CSV parser for Berlin population data
 */

export interface CSVParseOptions {
  delimiter?: string
  hasHeader?: boolean
  skipLines?: number
}

export interface ParsedCSV {
  headers: string[]
  rows: string[][]
}

/**
 * Parse CSV text into headers and rows
 */
export function parseCSV(text: string, options: CSVParseOptions = {}): ParsedCSV {
  const { delimiter = ';', hasHeader = true, skipLines = 0 } = options

  const lines = text.trim().split('\n')
  const dataLines = lines.slice(skipLines)

  if (dataLines.length === 0) {
    return { headers: [], rows: [] }
  }

  const parseRow = (line: string): string[] => {
    // Handle quoted fields
    const result: string[] = []
    let current = ''
    let inQuotes = false

    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === delimiter && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    result.push(current.trim())

    return result
  }

  const headers = hasHeader ? parseRow(dataLines[0] ?? '') : []
  const rows = hasHeader
    ? dataLines.slice(1).map(parseRow)
    : dataLines.map(parseRow)

  return { headers, rows }
}

/**
 * Convert parsed CSV to array of objects
 */
export function csvToObjects<T extends Record<string, unknown>>(
  parsed: ParsedCSV
): T[] {
  return parsed.rows.map((row) => {
    const obj: Record<string, string> = {}
    parsed.headers.forEach((header, i) => {
      obj[header] = row[i] ?? ''
    })
    return obj as T
  })
}

/**
 * Parse numeric value from German format (comma as decimal separator)
 */
export function parseGermanNumber(value: string): number {
  if (!value || value === '-' || value === '.') return 0
  return parseFloat(value.replace('.', '').replace(',', '.'))
}

