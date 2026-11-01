export const SAMPLE_CSVS = {
  vendas_brasil: {
    name: 'Vendas Brasil (Ponto e Vírgula)',
    content: `ID_Pedido;Cliente;Cidade;Estado;Produto;Categoria;Valor_Unitario;Quantidade;Total;Data
1001;Ana Souza;São Paulo;SP;Notebook Dell;Eletrônicos;3500,00;2;7000,00;2024-01-15
1002;Carlos Eduardo;Rio de Janeiro;RJ;Monitor 27";Informática;1200,00;1;1200,00;2024-01-16
1003;Beatriz Lima;Belo Horizonte;MG;Teclado Mecânico;Acessórios;250,50;3;751,50;2024-01-17
1004;Rafael Mendes;Curitiba;PR;Mouse Sem Fio;Acessórios;89,90;4;359,60;2024-01-18
1005;Juliana Costa;Porto Alegre;RS;Cadeira Gamer;Móveis;890,00;1;890,00;2024-01-19
1006;Marcelo Dias;Salvador;BA;Headset Bluetooth;Áudio;320,00;2;640,00;2024-01-20
1007;Fernanda Rocha;Fortaleza;CE;Webcam Full HD;Vídeo;199,90;2;399,80;2024-01-21
1008;Thiago Silva;Recife;PE;Mesa Articulada;Móveis;450,00;1;450,00;2024-01-22
1009;Camila Alves;Brasília;DF;Suporte Monitor;Acessórios;120,00;2;240,00;2024-01-23
1010;Lucas Prado;Goiânia;GO;Luminária LED;Iluminação;75,00;3;225,00;2024-01-24`
  },
  usuarios_virgula: {
    name: 'Usuários Globais (Vírgula)',
    content: `id,first_name,last_name,email,gender,department,salary
1,John,Doe,john.doe@example.com,Male,Engineering,85000
2,Jane,Smith,jane.smith@example.com,Female,Marketing,72000
3,Alex,Taylor,alex.t@example.com,Non-binary,Engineering,91000
4,Maria,Garcia,m.garcia@example.com,Female,Finance,68000
5,Chen,Wei,chen.wei@example.com,Male,Design,76000
6,Fatima,Khan,fatima.k@example.com,Female,Engineering,95000
7,David,Kim,david.kim@example.com,Male,Product,88000
8,Sara,Connor,sara.c@example.com,Female,Security,102000`
  },
  produtos_tab: {
    name: 'Produtos e Estoque (Tabulação)',
    content: `SKU\tDescricao\tMarca\tCorredor\tEstoque\tStatus
PRD-01\tCamiseta Básica Algodão\tUrbanWear\tA-03\t145\tDisponível
PRD-02\tCalça Jeans Slim\tDenimCo\tB-01\t54\tDisponível
PRD-03\tTênis Esportivo Runner\tSpeedShoes\tC-04\t12\tBaixo Estoque
PRD-04\tJaqueta Corta Vento\tUrbanWear\tA-05\t0\tEsgotado
PRD-05\tMeia Esportiva (Kit 3)\tFitSport\tC-01\t320\tDisponível`
  }
};
