import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileText,
  Sliders,
  Download,
  Copy,
  Check,
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Upload,
  RefreshCw,
  Sun,
  Moon,
  Database,
  Trash2,
  FileCode,
  Eye,
  Info
} from 'lucide-react';
import {
  parseCSV,
  detectDelimiter,
  convertToMarkdown,
  exportToExcel,
  downloadFile,
  convertToTSV,
  convertToJSON
} from './utils/csvUtils';
import { SAMPLE_CSVS } from './utils/sampleData';

export default function App() {
  // Estado do Arquivo / Texto
  const [rawText, setRawText] = useState(SAMPLE_CSVS.vendas_brasil.content);
  const [fileName, setFileName] = useState('vendas_brasil.csv');
  const [encoding, setEncoding] = useState('UTF-8');

  // Configurações de Calibração
  const [selectedDelimiter, setSelectedDelimiter] = useState('auto'); // 'auto', ',', ';', '\t', '|', 'custom'
  const [customDelimiter, setCustomDelimiter] = useState('');
  const [hasHeader, setHasHeader] = useState(true);

  // Interface
  const [activeTab, setActiveTab] = useState('table'); // 'table', 'markdown', 'json'
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [copiedType, setCopiedType] = useState(null);
  const [darkMode, setDarkMode] = useState(() => {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [isCalibrateOpen, setIsCalibrateOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef(null);

  // Aplica classe dark ao elemento raiz
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Parsing do CSV com configurações atuais
  const { parsedData, effectiveDelimiter } = useMemo(() => {
    if (!rawText.trim()) {
      return {
        parsedData: { headers: [], rows: [], rawRows: [], detectedDelimiter: ',' },
        effectiveDelimiter: ','
      };
    }

    const delimiterToUse =
      selectedDelimiter === 'auto'
        ? detectDelimiter(rawText)
        : selectedDelimiter === 'custom'
        ? customDelimiter || ','
        : selectedDelimiter;

    const parsed = parseCSV(rawText, {
      delimiter: delimiterToUse,
      hasHeader,
      skipEmptyLines: true,
    });

    return {
      parsedData: parsed,
      effectiveDelimiter: delimiterToUse
    };
  }, [rawText, selectedDelimiter, customDelimiter, hasHeader]);

  // Filtragem e Ordenação
  const filteredAndSortedRows = useMemo(() => {
    let result = [...parsedData.rows];

    // Busca Global
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row => {
        return parsedData.headers.some(h => {
          const val = row[h];
          return val !== undefined && String(val).toLowerCase().includes(term);
        });
      });
    }

    // Ordenação
    if (sortConfig.key) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key] ?? '';
        const valB = b[sortConfig.key] ?? '';

        const numA = Number(valA);
        const numB = Number(valB);

        let comparison = 0;
        if (!isNaN(numA) && !isNaN(numB) && valA !== '' && valB !== '') {
          comparison = numA - numB;
        } else {
          comparison = String(valA).localeCompare(String(valB), undefined, { numeric: true });
        }

        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  }, [parsedData, searchTerm, sortConfig]);

  // Paginação
  const totalPages = Math.ceil(filteredAndSortedRows.length / rowsPerPage) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredAndSortedRows.slice(start, start + rowsPerPage);
  }, [filteredAndSortedRows, currentPage, rowsPerPage]);

  // Resetar página ao mudar busca ou linhas por página
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, rowsPerPage, rawText, selectedDelimiter, hasHeader]);

  // Gerador de Markdown
  const markdownContent = useMemo(() => {
    return convertToMarkdown(parsedData.headers, filteredAndSortedRows);
  }, [parsedData.headers, filteredAndSortedRows]);

  // Handlers de Arquivo
  const handleFileUpload = (file) => {
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      const content = e.target.result;
      setRawText(content);
      setSelectedDelimiter('auto');
    };

    reader.readAsText(file, encoding);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleSort = (headerKey) => {
    setSortConfig(current => {
      if (current.key === headerKey) {
        if (current.direction === 'asc') return { key: headerKey, direction: 'desc' };
        return { key: null, direction: 'asc' };
      }
      return { key: headerKey, direction: 'asc' };
    });
  };

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    } catch {
      // Fallback simples
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedType(type);
      setTimeout(() => setCopiedType(null), 2000);
    }
  };

  const getDelimiterLabel = (d) => {
    switch (d) {
      case ',': return 'Vírgula (,)';
      case ';': return 'Ponto e Vírgula (;)';
      case '\t': return 'Tabulação (Tab)';
      case '|': return 'Pipe (|)';
      default: return `Personalizado (${d})`;
    }
  };

  const baseFileName = fileName.replace(/\.[^/.]+$/, '');

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} transition-colors duration-200`}>
      {/* Header */}
      <header className={`border-b ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} sticky top-0 z-30 backdrop-blur-md`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                Visualizador CSV & Conversor
              </h1>
              <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Visualização tabular, calibração dinâmica e exportação em MD & Excel
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Seletor de Amostras */}
            <div className="relative inline-block text-left">
              <select
                aria-label="Carregar exemplo"
                onChange={(e) => {
                  if (SAMPLE_CSVS[e.target.value]) {
                    setRawText(SAMPLE_CSVS[e.target.value].content);
                    setFileName(`${e.target.value}.csv`);
                    setSelectedDelimiter('auto');
                  }
                }}
                className={`text-xs font-medium py-2 px-3 rounded-lg border transition-colors cursor-pointer ${
                  darkMode
                    ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
                defaultValue=""
              >
                <option value="" disabled>Carregar Exemplo...</option>
                <option value="vendas_brasil">Vendas Brasil (Ponto e Vírgula)</option>
                <option value="usuarios_virgula">Usuários Globais (Vírgula)</option>
                <option value="produtos_tab">Produtos e Estoque (Tabulação)</option>
              </select>
            </div>

            {/* Alternar Tema */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-lg border transition-colors ${
                darkMode
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-amber-400'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
              }`}
              title={darkMode ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Banner de Upload e Drag-and-Drop */}
        <section
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[0.99]'
              : darkMode
              ? 'border-slate-800 bg-slate-900/40 hover:border-slate-700'
              : 'border-slate-300 bg-white hover:border-slate-400'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`p-3 rounded-full ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">
                Arraste e solte seu arquivo CSV aqui, ou{' '}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-bold"
                >
                  procure no computador
                </button>
              </p>
              <p className={`text-xs mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Suporta qualquer separador (vírgulas, ponto e vírgulas, tabs, pipes) e codificações (UTF-8, Latin-1)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.tsv,.txt"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </div>
        </section>

        {/* Barra de Status & Ações Rápidas */}
        <section className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${
          darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              darkMode ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-100'
            }`}>
              <FileSpreadsheet className="w-3.5 h-3.5" />
              {fileName}
            </span>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              <Info className="w-3.5 h-3.5" />
              Delimitador ativo: <strong className="font-semibold">{getDelimiterLabel(effectiveDelimiter)}</strong>
            </span>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
              darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'
            }`}>
              Linhas: {parsedData.rows.length} | Colunas: {parsedData.headers.length}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Botão de Calibração */}
            <button
              onClick={() => setIsCalibrateOpen(!isCalibrateOpen)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                isCalibrateOpen
                  ? 'bg-blue-600 text-white border-blue-600'
                  : darkMode
                  ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200'
                  : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {isCalibrateOpen ? 'Fechar Calibração' : 'Calibrar Leitura'}
            </button>

            {/* Limpar */}
            <button
              onClick={() => {
                setRawText('');
                setFileName('sem_titulo.csv');
              }}
              className={`p-1.5 rounded-lg border transition-colors ${
                darkMode
                  ? 'border-slate-800 hover:bg-red-950/40 hover:border-red-800 text-slate-400 hover:text-red-400'
                  : 'border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-400 hover:text-red-600'
              }`}
              title="Limpar dados"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Painel Expansível de Calibração */}
        {isCalibrateOpen && (
          <section className={`p-5 rounded-2xl border space-y-4 shadow-sm animate-in fade-in-50 duration-200 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <Sliders className="w-4 h-4 text-blue-500" />
              <h2 className="text-sm font-bold tracking-wide uppercase text-slate-500 dark:text-slate-400">
                Calibração de Leitura do CSV
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Seleção do Delimitador */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Separador / Delimitador
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'auto', label: 'Automático' },
                    { id: ',', label: 'Vírgula (,)' },
                    { id: ';', label: 'Ponto e vírgula (;)' },
                    { id: '\t', label: 'Tabulação (\\t)' },
                    { id: '|', label: 'Pipe (|)' },
                    { id: 'custom', label: 'Outro...' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedDelimiter(item.id)}
                      className={`text-xs py-2 px-3 rounded-lg border font-medium text-left flex items-center justify-between transition-all ${
                        selectedDelimiter === item.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shadow-xs'
                          : darkMode
                          ? 'border-slate-800 bg-slate-800/40 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.label}</span>
                      {selectedDelimiter === item.id && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                    </button>
                  ))}
                </div>

                {selectedDelimiter === 'custom' && (
                  <div className="mt-2">
                    <input
                      type="text"
                      maxLength={5}
                      placeholder="Ex: # ou :"
                      value={customDelimiter}
                      onChange={(e) => setCustomDelimiter(e.target.value)}
                      className={`w-full text-xs px-3 py-2 rounded-lg border outline-hidden focus:ring-2 focus:ring-blue-500 ${
                        darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-800'
                      }`}
                    />
                  </div>
                )}
              </div>

              {/* Opção de Cabeçalho */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Estrutura de Cabeçalho
                </label>
                <div className="space-y-2">
                  <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    darkMode ? 'border-slate-800 bg-slate-800/30' : 'border-slate-200 bg-slate-50/40'
                  }`}>
                    <input
                      type="checkbox"
                      checked={hasHeader}
                      onChange={(e) => setHasHeader(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                    />
                    <div className="text-xs">
                      <span className="font-semibold block">Primeira linha é o cabeçalho</span>
                      <span className="text-slate-500 dark:text-slate-400">
                        Se desmarcado, serão geradas colunas genéricas (Coluna_1, Coluna_2...)
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Codificação do Arquivo */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Codificação (Encoding)
                </label>
                <select
                  value={encoding}
                  onChange={(e) => setEncoding(e.target.value)}
                  className={`w-full text-xs px-3 py-2 rounded-lg border outline-hidden focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="UTF-8">UTF-8 (Padrão mundial)</option>
                  <option value="ISO-8859-1">ISO-8859-1 / Latin-1 (Acentos em CSVs antigos)</option>
                  <option value="windows-1252">Windows-1252 (Excel Brasil legado)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Se caracteres acentuados ficarem desconfigurados (como ), selecione ISO-8859-1 e recarregue o arquivo.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Barra de Navegação de Visualizações & Exportações */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Abas */}
          <div className={`flex rounded-xl p-1 border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setActiveTab('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'table'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Tabela Interativa
            </button>

            <button
              onClick={() => setActiveTab('markdown')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'markdown'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileCode className="w-3.5 h-3.5" />
              Markdown (.md)
            </button>

            <button
              onClick={() => setActiveTab('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'json'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              JSON
            </button>
          </div>

          {/* Botões de Ação e Download */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Download Excel XLSX */}
            <button
              onClick={() => exportToExcel(parsedData.headers, filteredAndSortedRows, baseFileName, 'xlsx')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
              title="Exportar dados para planilha Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Excel (.xlsx)
            </button>

            {/* Download Excel XLS */}
            <button
              onClick={() => exportToExcel(parsedData.headers, filteredAndSortedRows, baseFileName, 'xls')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
              title="Exportar para formato legado Excel (.xls)"
            >
              <Download className="w-3.5 h-3.5" />
              .xls
            </button>

            {/* Download Markdown */}
            <button
              onClick={() => downloadFile(markdownContent, `${baseFileName}.md`, 'text/markdown;charset=utf-8;')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
              title="Baixar arquivo Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5" />
              .md
            </button>

            {/* Copiar TSV para Colar no Excel */}
            <button
              onClick={() => copyToClipboard(convertToTSV(parsedData.headers, filteredAndSortedRows), 'tsv')}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                darkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
              title="Copiar dados tabulados para colar direto no Excel ou Planilhas Google"
            >
              {copiedType === 'tsv' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedType === 'tsv' ? 'Copiado!' : 'Copiar p/ Planilha'}
            </button>
          </div>
        </section>

        {/* Conteúdo Principal de Acordo com a Aba Selecionada */}
        {activeTab === 'table' && (
          <div className="space-y-4">
            {/* Controles da Tabela: Busca e Itens por Página */}
            <div className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-3 ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Pesquisar em todas as colunas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full text-xs pl-9 pr-4 py-2 rounded-lg border outline-hidden focus:ring-2 focus:ring-blue-500 transition-all ${
                    darkMode ? 'bg-slate-800/80 border-slate-700 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                  }`}
                />
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400">Por página:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className={`py-1.5 px-2.5 rounded-lg border outline-hidden font-medium ${
                      darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>

                <span className="text-slate-500 dark:text-slate-400">
                  Mostrando {paginatedRows.length} de {filteredAndSortedRows.length} registros
                </span>
              </div>
            </div>

            {/* Tabela de Dados */}
            <div className={`rounded-xl border overflow-hidden shadow-xs ${
              darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className={`border-b ${
                      darkMode ? 'bg-slate-800/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <th className="py-3 px-4 font-semibold w-12 text-center text-slate-400">#</th>
                      {parsedData.headers.map((header) => {
                        const isSorted = sortConfig.key === header;
                        return (
                          <th
                            key={header}
                            onClick={() => handleSort(header)}
                            className="py-3 px-4 font-bold tracking-wider cursor-pointer select-none hover:bg-slate-200/50 dark:hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-1.5 justify-between">
                              <span className="truncate max-w-[200px]">{header}</span>
                              <span className="text-slate-400">
                                {isSorted ? (
                                  sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5 text-blue-500" /> : <ArrowDown className="w-3.5 h-3.5 text-blue-500" />
                                ) : (
                                  <ArrowUpDown className="w-3 h-3 opacity-40 hover:opacity-100" />
                                )}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {paginatedRows.length === 0 ? (
                      <tr>
                        <td colSpan={parsedData.headers.length + 1} className="py-8 text-center text-slate-500 dark:text-slate-400">
                          Nenhum registro encontrado correspondente aos filtros.
                        </td>
                      </tr>
                    ) : (
                      paginatedRows.map((row, rIdx) => (
                        <tr
                          key={row._id ?? rIdx}
                          className={`transition-colors ${
                            darkMode
                              ? 'hover:bg-slate-800/40'
                              : 'hover:bg-blue-50/40'
                          }`}
                        >
                          <td className="py-2.5 px-4 text-center font-mono text-[11px] text-slate-400 select-none">
                            {(currentPage - 1) * rowsPerPage + rIdx + 1}
                          </td>
                          {parsedData.headers.map((header) => (
                            <td key={header} className="py-2.5 px-4 font-normal text-slate-700 dark:text-slate-200 truncate max-w-xs">
                              {row[header] !== undefined && row[header] !== '' ? String(row[header]) : (
                                <span className="text-slate-400 italic">vazio</span>
                              )}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Paginação */}
              <div className={`p-3 border-t flex flex-wrap items-center justify-between gap-3 text-xs ${
                darkMode ? 'border-slate-800 bg-slate-900/60' : 'border-slate-200 bg-slate-50/60'
              }`}>
                <div className="text-slate-500 dark:text-slate-400">
                  Página <strong className="font-semibold text-slate-700 dark:text-slate-200">{currentPage}</strong> de{' '}
                  <strong className="font-semibold text-slate-700 dark:text-slate-200">{totalPages}</strong>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Anterior
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber = i + 1;
                      if (totalPages > 5 && currentPage > 3) {
                        pageNumber = Math.min(currentPage - 2 + i, totalPages - (4 - i));
                      }
                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors ${
                            currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : darkMode
                              ? 'hover:bg-slate-800 text-slate-400'
                              : 'hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Visualização Markdown */}
        {activeTab === 'markdown' && (
          <div className={`p-4 rounded-xl border space-y-3 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Código da Tabela em Markdown
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(markdownContent, 'md')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {copiedType === 'md' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'md' ? 'Copiado!' : 'Copiar Markdown'}
                </button>
                <button
                  onClick={() => downloadFile(markdownContent, `${baseFileName}.md`, 'text/markdown;charset=utf-8;')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .md
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={markdownContent}
              rows={16}
              className={`w-full font-mono text-xs p-4 rounded-xl border outline-hidden resize-y ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        )}

        {/* Visualização JSON */}
        {activeTab === 'json' && (
          <div className={`p-4 rounded-xl border space-y-3 ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-500" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Objeto JSON
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(convertToJSON(parsedData.headers, filteredAndSortedRows), 'json')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    darkMode ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200' : 'bg-white border-slate-300 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  {copiedType === 'json' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedType === 'json' ? 'Copiado!' : 'Copiar JSON'}
                </button>
                <button
                  onClick={() => downloadFile(convertToJSON(parsedData.headers, filteredAndSortedRows), `${baseFileName}.json`, 'application/json;charset=utf-8;')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .json
                </button>
              </div>
            </div>

            <textarea
              readOnly
              value={convertToJSON(parsedData.headers, filteredAndSortedRows)}
              rows={16}
              className={`w-full font-mono text-xs p-4 rounded-xl border outline-hidden resize-y ${
                darkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`mt-12 border-t py-6 text-center text-xs ${
        darkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'
      }`}>
        <p>CSV Viewer & Markdown/Excel Exporter • 100% Client-Side no GitHub Pages • Nenhum dado sai do seu navegador</p>
      </footer>
    </div>
  );
}
