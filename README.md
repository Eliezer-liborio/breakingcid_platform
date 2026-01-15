░▒▓█▓▒░░▒▓█▓▒░▒▓████████▓▒░▒▓████████▓▒░▒▓███████▓▒░ ░▒▓███████▓▒░░▒▓██████▓▒░ ░▒▓██████▓▒░░▒▓███████▓▒░  
░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓████████▓▒░  ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓███████▓▒░ ░▒▓██████▓▒░░▒▓█▓▒░      ░▒▓████████▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░             ░▒▓█▓▒░▒▓█▓▒░      ░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░             ░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
░▒▓█▓▒░░▒▓█▓▒░  ░▒▓█▓▒░      ░▒▓█▓▒░   ░▒▓█▓▒░      ░▒▓███████▓▒░ ░▒▓██████▓▒░░▒▓█▓▒░░▒▓█▓▒░▒▓█▓▒░░▒▓█▓▒░ 
                                                                                                          
                                                                                                          
Módulos de Segurança

- **HTTP Request Smuggling**: Testes CL.TE, TE.CL e TE.TE baseados na pesquisa de James Kettle (PortSwigger)
- **SSRF Detection**: Scanner de Server-Side Request Forgery com detecção de cloud metadata (AWS, GCP, Azure) e serviços internos
- **Comprehensive Scan**: Execução de todos os módulos de segurança simultaneamente

Sistema de Gerenciamento

- **Autenticação**: Sistema completo com controle de acesso (admin/usuário)
- **Dashboard Interativo**: Visualização em tempo real de estatísticas e vulnerabilidades
- **Histórico de Scans**: Armazenamento completo de resultados e metadados
- **Relatórios Detalhados**: Geração automática de relatórios em markdown com:
  - Severidade (Critical, High, Medium, Low)
  - Impacto e descrição técnica
  - Evidências e payloads
  - Recomendações de remediação
  - CVSS scores

Como Usar

### 1. Acessar a Plataforma

Faça login na plataforma usando sua conta Manus OAuth.

### 2. Iniciar um Novo Scan

1. Clique em **"New Scan"** no header ou dashboard
2. Insira a **URL do alvo** (ex: https://example.com)
3. Selecione o **tipo de scan**:
   - HTTP Request Smuggling
   - SSRF Detection
   - Comprehensive Scan (todos os testes)
4. (Opcional) Adicione **escopo adicional** (subdomínios, endpoints)
5. Clique em **"Start Scan"**

### 3. Acompanhar Progresso

- O scan será executado de forma assíncrona
- Status é atualizado automaticamente a cada 3-5 segundos
- Estados possíveis: `pending`, `running`, `completed`, `failed`

### 4. Visualizar Resultados

Após a conclusão, você terá acesso a:

- **Sumário Executivo**: Total de vulnerabilidades por severidade
- **Lista Detalhada**: Cada vulnerabilidade com descrição, payload e evidências
- **Relatório Completo**: Documento markdown com metodologia e recomendações

### 5. Gerenciar Histórico

- Acesse **"History"** para ver todos os scans
- Use a busca para filtrar por alvo ou tipo
- Clique em qualquer scan para ver detalhes completos

##  Controle de Acesso

### Usuário Regular
- Criar e executar scans
- Visualizar próprios resultados
- Acessar dashboard pessoal

### Administrador
- Todas as permissões de usuário
- Visualizar scans de todos os usuários
- Estatísticas globais da plataforma

##  Dashboard

O dashboard principal exibe:

- **Total de Scans**: Quantidade total e scans em execução
- **Vulnerabilidades**: Total encontrado e críticas
- **Scans Completados**: Com taxa de falha
- **Issues Críticos**: Vulnerabilidades de alta severidade
- **Scans Recentes**: Últimos 5 scans com status

##  Módulos Técnicos

### HTTP Request Smuggling

Baseado na pesquisa de James Kettle, testa três técnicas principais:

- **CL.TE**: Content-Length vs Transfer-Encoding
- **TE.CL**: Transfer-Encoding vs Content-Length
- **TE.TE**: Transfer-Encoding obfuscation

### SSRF Scanner

Detecta vulnerabilidades de Server-Side Request Forgery testando:

- AWS Metadata (169.254.169.254)
- Google Cloud Metadata
- Azure Metadata
- Serviços internos (localhost, 127.0.0.1)
- Endpoints comuns vulneráveis

##  Aviso Legal

**Esta plataforma é destinada exclusivamente para testes autorizados.**

- Apenas teste alvos que você tem **permissão explícita** para testar
- Testes não autorizados são **ilegais** e podem resultar em consequências legais
- O usuário é totalmente responsável pelo uso da plataforma
- Siga as diretrizes de **responsible disclosure** ao reportar vulnerabilidades

##  Tecnologias Utilizadas

### Backend
- **Node.js + Express**: Servidor web
- **tRPC**: Type-safe API
- **Drizzle ORM**: Database queries
- **Python**: Módulos de segurança (HTTP Smuggling, SSRF)
- **MySQL/TiDB**: Banco de dados

### Frontend
- **React 19**: Framework UI
- **Tailwind CSS 4**: Estilização
- **shadcn/ui**: Componentes
- **Wouter**: Roteamento
- **TanStack Query**: State management

### Segurança
- **Manus OAuth**: Autenticação
- **JWT**: Session management
- **Role-based Access Control**: Permissões

##  Metodologia

Os testes seguem padrões :

- **OWASP Testing Guide v4.2**
- **NIST SP 800-115**
- **PTES (Penetration Testing Execution Standard)**
- Pesquisas de James Kettle (PortSwigger)

##  Design System

### Cores Principais
- **Primary (Cyan)**: #00FFFF - Elementos principais e ações
- **Secondary (Magenta)**: #FF00FF - Destaques secundários
- **Accent (Pink)**: #FF0080 - Acentos e alertas
- **Destructive (Red)**: #FF0000 - Erros e vulnerabilidades críticas

### Tipografia
- **Headings**: Space Grotesk (bold)
- **Body**: Inter (regular)

### Efeitos
- Glow text shadows
- Neon borders
- Pulse animations
- Cyber grid background

##  Estrutura do Projeto

```
breakingcid_platform/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas da aplicação
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Utilitários
├── server/                # Backend Node.js
│   ├── modules/           # Módulos Python de segurança
│   │   ├── http_smuggling.py
│   │   └── ssrf_scanner.py
│   ├── routers.ts         # Rotas tRPC
│   └── db.ts              # Database queries
├── drizzle/               # Schema e migrations
└── shared/                # Tipos compartilhados
```

##  Status do Projeto

 **Completo e Funcional**

Todas as funcionalidades principais foram implementadas e testadas:
-  Autenticação e controle de acesso
-  Módulos de segurança (HTTP Smuggling, SSRF)
-  Dashboard interativo
-  Sistema de scans assíncronos
-  Geração de relatórios
-  Interface cyberpunk completa

---

**Desenvolvido com 💚 para a comunidade de segurança ofensiva**
