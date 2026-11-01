import { describe, it, expect } from 'vitest';
import { detectDelimiter, parseCSV, convertToMarkdown, convertToTSV, convertToJSON } from './csvUtils';

describe('CSV Utilities', () => {
  describe('detectDelimiter', () => {
    it('detects comma correctly', () => {
      const csv = 'nome,idade,cidade\nAna,25,São Paulo\nCarlos,30,Rio de Janeiro';
      expect(detectDelimiter(csv)).toBe(',');
    });

    it('detects semicolon correctly', () => {
      const csv = 'nome;idade;cidade\nAna;25;São Paulo\nCarlos;30;Rio de Janeiro';
      expect(detectDelimiter(csv)).toBe(';');
    });

    it('detects tab correctly', () => {
      const csv = 'nome\tidade\tcidade\nAna\t25\tSão Paulo\nCarlos\t30\tRio de Janeiro';
      expect(detectDelimiter(csv)).toBe('\t');
    });

    it('detects pipe correctly', () => {
      const csv = 'nome|idade|cidade\nAna|25|São Paulo\nCarlos|30|Rio de Janeiro';
      expect(detectDelimiter(csv)).toBe('|');
    });
  });

  describe('parseCSV', () => {
    it('parses comma-separated CSV with headers', () => {
      const csv = 'Nome,Idade\nLucas,28\nMariana,24';
      const result = parseCSV(csv);
      expect(result.detectedDelimiter).toBe(',');
      expect(result.headers).toEqual(['Nome', 'Idade']);
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].Nome).toBe('Lucas');
      expect(result.rows[0].Idade).toBe('28');
    });

    it('parses semicolon-separated CSV with custom delimiter', () => {
      const csv = 'Produto;Preço;Estoque\nCaderno;15,90;100';
      const result = parseCSV(csv, { delimiter: ';' });
      expect(result.headers).toEqual(['Produto', 'Preço', 'Estoque']);
      expect(result.rows[0].Produto).toBe('Caderno');
      expect(result.rows[0]['Preço']).toBe('15,90');
    });

    it('parses CSV without headers generating synthetic headers', () => {
      const csv = 'Lucas,28,Brasil\nMariana,24,Portugal';
      const result = parseCSV(csv, { hasHeader: false });
      expect(result.headers).toEqual(['Coluna_1', 'Coluna_2', 'Coluna_3']);
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].Coluna_1).toBe('Lucas');
    });

    it('handles empty input gracefully', () => {
      const result = parseCSV('');
      expect(result.headers).toEqual([]);
      expect(result.rows).toEqual([]);
    });
  });

  describe('convertToMarkdown', () => {
    it('converts headers and rows to valid markdown table', () => {
      const headers = ['Nome', 'Idade'];
      const rows = [{ Nome: 'João', Idade: '35' }, { Nome: 'Maria', Idade: '30' }];
      const md = convertToMarkdown(headers, rows);
      expect(md).toContain('| Nome | Idade |');
      expect(md).toContain('| --- | --- |');
      expect(md).toContain('| João | 35 |');
      expect(md).toContain('| Maria | 30 |');
    });

    it('escapes pipes in cell content', () => {
      const headers = ['Texto'];
      const rows = [{ Texto: 'A | B' }];
      const md = convertToMarkdown(headers, rows);
      expect(md).toContain('| A \\| B |');
    });
  });

  describe('convertToTSV and convertToJSON', () => {
    const headers = ['A', 'B'];
    const rows = [{ A: '1', B: '2' }];

    it('generates correct TSV', () => {
      const tsv = convertToTSV(headers, rows);
      expect(tsv).toBe('A\tB\n1\t2');
    });

    it('generates correct JSON', () => {
      const json = JSON.parse(convertToJSON(headers, rows));
      expect(json).toEqual([{ A: '1', B: '2' }]);
    });
  });
});
