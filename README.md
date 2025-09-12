# Editor Visual de Fluxo de Processos (Workflow)

Este é um editor de fluxo de trabalho construído com React, TypeScript e React Flow. A ferramenta permite a criação visual de diagramas de processos complexos, onde cada etapa (nó) pode ser configurada com regras de negócio específicas, como campos de entrada, saída e lógicas condicionais.

O objetivo principal é permitir que um usuário modele um processo de forma intuitiva e gere uma estrutura de dados JSON limpa e semântica, pronta para ser interpretada por um sistema de backend.

![image_0eeebf.png](https://gist.github.com/assets/13340381/a4347101-7001-4439-93e1-38e53097d740)

## ✨ Funcionalidades

- **Criação Visual de Fluxos:** Adicione, remova, arraste e conecte etapas (nós) em uma interface de canvas intuitiva.
- **Configuração de Etapas:** Cada etapa possui um painel de configuração detalhado para definir:
  - **Campos de Entrada:** Defina os dados que a etapa precisa para ser executada.
  - **Campos de Saída:** Defina os dados que a etapa irá produzir.
- **Herança Inteligente de Campos:** Uma etapa pode "puxar" e reutilizar campos de entrada ou saída de qualquer etapa anterior no fluxo através de um seletor com autocomplete.
- **Lógica "OU" por Campo:** Configure campos de entrada que podem ser substituídos por outros campos alternativos, permitindo flexibilidade na execução do processo.
- **Geração de JSON Semântico:** Exporte a lógica do fluxo para um formato JSON limpo, focado nas regras de negócio e não nos dados visuais, pronto para ser consumido pelo backend.
- **Interface com Material-UI (MUI):** Componentes modernos e uma experiência de usuário aprimorada.

## 🛠️ Tecnologias Utilizadas

- **[React](https://reactjs.org/)**: Biblioteca para a construção da interface de usuário.
- **[TypeScript](https://www.typescriptlang.org/)**: Superset do JavaScript que adiciona tipagem estática.
- **[React Flow](https://reactflow.dev/)**: Biblioteca para a criação de editores baseados em nós.
- **[Material-UI (MUI)](https://mui.com/)**: Biblioteca de componentes React para um design mais rápido e fácil.
- **[Create React App](https://create-react-app.dev/)**: Template para inicialização do projeto.

## 🚀 Instalação e Execução

Siga os passos abaixo para rodar o projeto em sua máquina local.

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 16 ou superior)
- [npm](https://www.npmjs.com/) (geralmente instalado junto com o Node.js)

### Passos

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/jvbarea/meu-workflow-editor.git
    ```

2.  **Navegue até a pasta do projeto:**
    ```bash
    cd nome-do-repositorio
    ```

3.  **Instale todas as dependências:**
    ```bash
    npm install
    ```

4.  **Inicie o servidor de desenvolvimento:**
    ```bash
    npm start
    ```

Após executar o último comando, o projeto será aberto automaticamente em seu navegador no endereço `http://localhost:3000`.

---
