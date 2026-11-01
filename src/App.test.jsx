import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from './App';

// Mock de matchMedia caso o ambiente JSDOM não o defina
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('App Component', () => {
  it('renders application header and title', () => {
    render(<App />);
    expect(screen.getByText('Visualizador CSV & Conversor')).toBeDefined();
    expect(screen.getByText('Tabela Interativa')).toBeDefined();
    expect(screen.getByText('Markdown (.md)')).toBeDefined();
    expect(screen.getByText('Excel (.xlsx)')).toBeDefined();
  });

  it('allows switching to Markdown tab and displays markdown code', () => {
    render(<App />);
    const mdTabButton = screen.getByText('Markdown (.md)');
    fireEvent.click(mdTabButton);

    expect(screen.getByText('Código da Tabela em Markdown')).toBeDefined();
    expect(screen.getByText('Download .md')).toBeDefined();
  });

  it('allows opening calibration panel and toggling settings', () => {
    render(<App />);
    const calibrateButton = screen.getByText('Calibrar Leitura');
    fireEvent.click(calibrateButton);

    expect(screen.getByText('Calibração de Leitura do CSV')).toBeDefined();
    expect(screen.getByText('Ponto e vírgula (;)')).toBeDefined();
    expect(screen.getByText('Primeira linha é o cabeçalho')).toBeDefined();
  });

  it('filters table rows according to search term', () => {
    render(<App />);
    const searchInput = screen.getByPlaceholderText('Pesquisar em todas as colunas...');
    fireEvent.change(searchInput, { target: { value: 'Notebook Dell' } });

    expect(screen.getByText('Notebook Dell')).toBeDefined();
    // Beatriz Lima não deve estar visível após esse filtro
    expect(screen.queryByText('Beatriz Lima')).toBeNull();
  });
});
