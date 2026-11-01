# Visualizador CSV & Conversor (CSV Viewer)

Aplicação web moderna, intuitiva e rápida, projetada para ser executada diretamente no **GitHub Pages** (100% client-side, mantendo total privacidade de dados sensíveis).

---

## 🚀 Funcionalidades

1. **Visualização Tabular Inteligente**:
   - Detecção automática de qualquer delimitador: vírgulas (`,`), ponto e vírgulas (`;`), tabulações (`\t`) e barras verticais / pipes (`|`).
   - Tabela rica e interativa com busca global, ordenação em todas as colunas e paginação configurável (10, 25, 50, 100).
   - Estatísticas em tempo real (total de linhas, colunas, delimitador ativo e nome do arquivo).

2. **Calibração Total pelo Usuário**:
   - Ajuste manual do delimitador (Vírgula, Ponto e vírgula, Tab, Pipe ou personalizado).
   - Controle de cabeçalho: habilite ou desabilite se a 1ª linha for cabeçalho (com geração automática de títulos genéricos).
   - Suporte a múltiplas codificações (Encoding): UTF-8, ISO-8859-1 (Latin-1) e Windows-1252 para arquivos brasileiros/legados com acentuação.

3. **Exibição e Download em Markdown**:
   - Aba dedicada com preview e visualização do código formatado em Markdown pronto.
   - Botão de **Copiar Markdown** direto para a área de transferência.
   - Botão de **Download em `.md`**.

4. **Conversão e Download em Excel**:
   - Download direto no formato moderno **`.xlsx`** com preservação de tipos numéricos.
   - Download no formato compatível **`.xls`**.
   - Botão inteligente **"Copiar p/ Planilha"** (formato TSV para colar imediatamente no Excel ou Google Sheets).

5. **Ideias Úteis Adicionadas**:
   - **Visualização e Download em JSON**.
   - **Upload flexível**: Arraste e solte (Drag & Drop) ou seleção de arquivo local.
   - **Exemplos embutidos**: carregue amostras com 1 clique (Vendas Brasil, Usuários Globais, Produtos).
   - **Dark Mode / Light Mode**: alternância de tema escuro e claro com salvamento de preferência.

---

## 🛠️ Tecnologias Utilizadas

- **React 19** + **Vite**
- **Tailwind CSS v4**
- **PapaParse** (parsing robusto de CSV)
- **SheetJS (xlsx)** (conversão e geração de planilhas Excel)
- **Lucide React** (ícones)
- **Vitest & React Testing Library** (testes automatizados)

---

## 📦 Como rodar localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Rodar testes
npm test

# Gerar build estático para GitHub Pages
npm run build
```

---

## 🌐 Deploy no GitHub Pages

O projeto já está configurado com caminhos relativos (`base: './'`). Basta publicar a pasta `dist` gerada por `npm run build` na branch `gh-pages` ou configurar o GitHub Actions com deploy do Vite.
