import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Detecta o melhor delimitador para uma amostra de texto CSV
 * @param {string} text 
 * @returns {string} Delimitador detectado (ex: ',', ';', '\t', '|')
 */
export function detectDelimiter(text) {
  if (!text || typeof text !== 'string') return ',';

  // Analisa as primeiras 15 linhas
  const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim().length > 0).slice(0, 15);
  if (lines.length === 0) return ',';

  const candidates = [
    { char: ';', name: 'ponto e vírgula' },
    { char: ',', name: 'vírgula' },
    { char: '\t', name: 'tabulação' },
    { char: '|', name: 'pipe' },
  ];

  let bestDelimiter = ',';
  let maxScore = -1;

  for (const cand of candidates) {
    const counts = lines.map(line => {
      // Contagem aproximada considerando citações simples
      let count = 0;
      let inQuote = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuote = !inQuote;
        else if (!inQuote && line[i] === cand.char) count++;
      }
      return count;
    });

    const nonZero = counts.filter(c => c > 0);
    if (nonZero.length === 0) continue;

    // Consistência: desvio padrão das contagens por linha
    const avg = nonZero.reduce((a, b) => a + b, 0) / lines.length;
    const variance = nonZero.reduce((acc, c) => acc + Math.pow(c - avg, 2), 0) / lines.length;
    // Score prioriza frequência consistente (>0 em todas as linhas e menor variância)
    const consistencyBonus = (nonZero.length === lines.length) ? 10 : (nonZero.length / lines.length);
    const score = (avg / (1 + variance)) * consistencyBonus;

    if (score > maxScore) {
      maxScore = score;
      bestDelimiter = cand.char;
    }
  }

  return bestDelimiter;
}

/**
 * Faz o parsing de dados CSV
 * @param {string} text Conteúdo CSV
 * @param {object} options Configurações de parsing
 * @returns {object} { headers, rows, rawRows, errors }
 */
export function parseCSV(text, options = {}) {
  const {
    delimiter = 'auto',
    hasHeader = true,
    skipEmptyLines = true,
  } = options;

  const actualDelimiter = (delimiter === 'auto' || !delimiter)
    ? detectDelimiter(text)
    : delimiter;

  const results = Papa.parse(text, {
    delimiter: actualDelimiter,
    header: false,
    skipEmptyLines: skipEmptyLines ? 'greedy' : false,
    dynamicTyping: false,
  });

  const rawRows = results.data || [];
  if (rawRows.length === 0) {
    return {
      headers: [],
      rows: [],
      rawRows: [],
      detectedDelimiter: actualDelimiter,
      errors: results.errors || []
    };
  }

  let headers = [];
  let rows = [];

  if (hasHeader && rawRows.length > 0) {
    // Normaliza nomes de cabeçalhos
    const firstRow = rawRows[0];
    const seen = {};
    headers = firstRow.map((col, idx) => {
      let name = String(col !== undefined && col !== null ? col : '').trim();
      if (!name) name = `Coluna_${idx + 1}`;
      if (seen[name]) {
        seen[name]++;
        name = `${name}_${seen[name]}`;
      } else {
        seen[name] = 1;
      }
      return name;
    });

    rows = rawRows.slice(1).map((row, rIdx) => {
      const rowObj = { _id: rIdx };
      headers.forEach((h, cIdx) => {
        rowObj[h] = row[cIdx] !== undefined ? String(row[cIdx]) : '';
      });
      return rowObj;
    });
  } else {
    const maxCols = Math.max(...rawRows.map(r => r.length), 0);
    headers = Array.from({ length: maxCols }, (_, i) => `Coluna_${i + 1}`);
    rows = rawRows.map((row, rIdx) => {
      const rowObj = { _id: rIdx };
      headers.forEach((h, cIdx) => {
        rowObj[h] = row[cIdx] !== undefined ? String(row[cIdx]) : '';
      });
      return rowObj;
    });
  }

  return {
    headers,
    rows,
    rawRows,
    detectedDelimiter: actualDelimiter,
    errors: results.errors || []
  };
}

/**
 * Converte headers e rows para tabela em formato Markdown
 * @param {string[]} headers 
 * @param {Array<object|Array>} rows 
 * @param {boolean} isObjectRow Se as linhas são objetos com chaves iguais aos headers
 * @returns {string} Tabela Markdown
 */
export function convertToMarkdown(headers, rows, isObjectRow = true) {
  if (!headers || headers.length === 0) return '';

  const cleanCell = (val) => {
    if (val === null || val === undefined) return '';
    return String(val)
      .replace(/\r\n|\n|\r/g, ' ')
      .replace(/\|/g, '\\|')
      .trim();
  };

  const headerLine = `| ${headers.map(cleanCell).join(' | ')} |`;
  const separatorLine = `| ${headers.map(() => '---').join(' | ')} |`;

  const dataLines = rows.map(row => {
    const cells = headers.map(h => {
      const val = isObjectRow ? row[h] : row[headers.indexOf(h)];
      return cleanCell(val);
    });
    return `| ${cells.join(' | ')} |`;
  });

  return [headerLine, separatorLine, ...dataLines].join('\n');
}

/**
 * Gera arquivo Excel e aciona download (.xlsx ou .xls)
 * @param {string[]} headers 
 * @param {Array<object>} rows 
 * @param {string} filename 
 * @param {'xlsx'|'xls'} format 
 */
export function exportToExcel(headers, rows, filename = 'dados', format = 'xlsx') {
  const data = [
    headers,
    ...rows.map(row => headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return '';
      // Tenta converter para número se for puramente numérico
      const num = Number(val);
      if (!isNaN(num) && String(val).trim() !== '') {
        return num;
      }
      return val;
    }))
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Dados');

  const fullFilename = filename.endsWith(`.${format}`) ? filename : `${filename}.${format}`;
  XLSX.writeFile(workbook, fullFilename, {
    bookType: format === 'xls' ? 'biff8' : 'xlsx'
  });
}

/**
 * Faz download de texto como arquivo
 * @param {string} content 
 * @param {string} filename 
 * @param {string} mimeType 
 */
export function downloadFile(content, filename, mimeType = 'text/plain;charset=utf-8;') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Converte os dados para TSV (Tab-Separated Values) perfeito para colar no Excel/Google Sheets
 */
export function convertToTSV(headers, rows) {
  const lines = [
    headers.join('\t'),
    ...rows.map(row => headers.map(h => String(row[h] ?? '').replace(/\t/g, ' ')).join('\t'))
  ];
  return lines.join('\n');
}

/**
 * Converte para JSON formatado
 */
export function convertToJSON(headers, rows) {
  const cleanRows = rows.map(r => {
    const obj = {};
    headers.forEach(h => { obj[h] = r[h]; });
    return obj;
  });
  return JSON.stringify(cleanRows, null, 2);
}
