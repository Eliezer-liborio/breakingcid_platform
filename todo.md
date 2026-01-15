# BreakingCID Platform - TODO

## Banco de Dados e Schema
- [x] Criar tabela de scans com metadados (alvo, tipo, status, timestamps)
- [x] Criar tabela de vulnerabilidades encontradas
- [x] Criar tabela de relatórios gerados
- [x] Adicionar queries helpers no server/db.ts

## Backend - Módulos de Segurança
- [x] Implementar módulo HTTP Request Smuggling (CL.TE, TE.CL, TE.TE)
- [x] Implementar módulo SSRF Scanner
- [x] Criar sistema de execução assíncrona de scans
- [x] Criar gerador de relatórios markdown
- [x] Implementar rotas tRPC para iniciar scans
- [x] Implementar rotas tRPC para listar histórico
- [x] Implementar rotas tRPC para obter resultados
- [x] Adicionar controle de acesso admin/user

## Frontend - Interface e Visual
- [x] Configurar tema dark cyberpunk com cores neon
- [x] Criar página inicial com dashboard
- [x] Criar página de novo scan com seleção de ferramentas
- [x] Criar página de histórico de scans
- [x] Criar página de visualização de resultados
- [x] Criar componente de gráficos de vulnerabilidades
- [x] Criar componente de estatísticas em tempo real
- [x] Implementar DashboardLayout com navegação

## Integração e Testes
- [x] Testar execução de scans HTTP Smuggling
- [x] Testar execução de scans SSRF
- [x] Testar fluxo completo de autenticação
- [x] Testar controle de acesso admin/user
- [x] Validar armazenamento de resultados
- [x] Validar geração de relatórios

## Finalização
- [x] Criar checkpoint final
- [x] Documentar uso da plataforma

## Melhorias de Design (Feedback do Usuário)
- [x] Suavizar cores neon para tons mais sutis
- [x] Remover efeitos de blur/backdrop-blur
- [x] Criar design mais limpo e minimalista
- [x] Melhorar contraste e legibilidade
- [x] Remover glow effects excessivos

## Implementação XSS Scanner
- [x] Criar módulo Python para XSS Scanner
- [x] Adicionar suporte a Reflected XSS
- [x] Adicionar suporte a DOM-based XSS
- [x] Adicionar suporte a Stored XSS
- [x] Adicionar suporte a Template Injection
- [x] Integrar XSS scanner no backend (routers.ts)
- [x] Adicionar tipo de scan "xss" no frontend
- [x] Atualizar schema do banco de dados se necessário
- [x] Testar execução de scans XSS

## Implementação Subdomain Enumeration
- [x] Criar módulo Python para enumeração de subdomínios
- [x] Implementar descoberta via DNS (subfinder-like)
- [x] Implementar descoberta via Certificate Transparency
- [x] Implementar brute force de subdomínios
- [x] Adicionar verificação de subdomínios ativos
- [x] Integrar no backend (routers.ts)
- [x] Adicionar tipo de scan "subdomain_enum" no frontend
- [x] Atualizar schema do banco de dados
- [x] Testar execução de enumeração

## Redesign Frontend - Single Page Terminal Style
- [x] Remover navegação complexa e múltiplas páginas
- [x] Criar Single Page Application minimalista
- [x] Adicionar ASCII art banner estilo hacker
- [x] Implementar animações de texto tipo terminal
- [x] Criar componente de execução em tempo real
- [x] Adicionar output de scan estilo console/terminal
- [x] Implementar download de relatórios .txt
- [x] Remover sidebar e menus desnecessários
- [x] Criar experiência visual red team/exploit style
- [x] Adicionar animações de loading estilo hacker

## Bug Fix - Scanners Não Funcionando
- [x] Investigar logs de erro dos scanners
- [x] Verificar execução dos módulos Python
- [x] Corrigir problema de execução (retry logic implementado)
- [x] Testar todos os tipos de scan
- [x] Validar output no terminal

## Modo Verbose - Output Detalhado em Tempo Real
- [x] Adicionar toggle verbose no control panel
- [x] Modificar scanners Python para output progressivo (stderr)
- [x] Implementar captura de stderr no backend
- [x] Criar streaming de logs em tempo real
- [x] Mostrar cada request/teste no terminal output
- [x] Adicionar timestamps nos logs verbose
- [x] Testar modo verbose com todos os scanners

## Bug Crítico - Scanners Não Funcionando
- [x] Verificar se códigos fornecidos pelo usuário estão sendo usados
- [x] Testar execução direta dos módulos Python
- [x] Verificar logs de erro no backend
- [x] Corrigir problema de execução (mudado para python3.10)
- [x] Validar todos os scanners funcionando

## Streaming de Logs em Tempo Real
- [x] Investigar causa dos scan failed (dependências Python 3.10 instaladas)
- [x] Modificar scanners Python para output progressivo linha por linha
- [x] Implementar captura de stderr no backend
- [x] Criar endpoint tRPC para streaming de logs (scans.getLogs)
- [x] Salvar logs no banco de dados em tempo real
- [x] Atualizar frontend para exibir logs em tempo real
- [x] Mostrar cada request, payload e resposta no terminal
- [x] Testar streaming com todos os scanners

## Correção Python 3.10 - Caminho Absoluto
- [x] Identificar caminho absoluto do Python 3.10 (/usr/bin/python3.10)
- [x] Modificar backend para usar /usr/bin/python3.10
- [x] Testar execução dos scanners

## Reestruturação - Arquitetura Cliente-Servidor com Worker Remoto

### Planejamento
- [ ] Definir arquitetura: Frontend → Backend API → Job Queue → Worker Server
- [ ] Escolher sistema de queue (Redis + Bull ou banco de dados simples)
- [ ] Definir formato de comunicação (REST API ou WebSocket)
- [ ] Planejar estrutura de jobs (status, logs, resultados)

### Backend API (Atual)
- [ ] Remover execução direta de scripts Python
- [x] Implementar sistema de jobs no banco de dados (campos workerId, workerPickedAt)
- [x] Criar API endpoint para worker buscar jobs pendentes (GET /api/worker/jobs/pending)
- [x] Criar API endpoint para worker enviar logs em tempo real (POST /api/worker/jobs/:id/logs)
- [x] Criar API endpoint para worker enviar resultados (POST /api/worker/jobs/:id/results)
- [x] Adicionar autenticação para worker server (X-Worker-API-Key header)

### Worker Server (Novo)
- [ ] Criar script de setup para Ubuntu/Kali
- [x] Criar worker client que se conecta ao backend (worker_client.py)
- [x] Implementar polling de jobs pendentes
- [x] Criar scripts .sh para ferramentas bash (subdomain_enum.sh)
- [x] Criar scripts .py para ferramentas Python (XSS, SSRF, HTTP Smuggling)
- [x] Implementar envio de logs progressivos
- [x] Implementar envio de resultados finais
- [x] Adicionar tratamento de erros e retry

### Documentação
- [x] Criar guia de instalação do worker server (worker/README.md)
- [x] Documentar dependências necessárias (Kali tools)
- [x] Criar script de instalação automática (worker/setup.sh)
- [x] Documentar configuração de API key

## Reorganização - Arquitetura Profissional
- [x] Criar estrutura de diretórios (modules/, config/, logs/, results/, utils/)
- [x] Criar arquivos de payloads (smuggling.txt, ssrf_endpoints.txt, xss_payloads.txt)
- [x] Criar wordlists (subdomains.txt, api_endpoints.txt, ssrf_params.txt)
- [x] Atualizar módulos Python com payloads externos
- [x] Criar utils/progress_bar.py
- [x] Criar utils/banner.py
- [x] Criar utils/report_generator.py
- [x] Criar breakingcid.sh script principal
- [x] Atualizar worker para usar nova estrutura

## Especificação API Backend-Worker
- [x] Documentar endpoints REST
- [x] Documentar autenticação
- [x] Documentar fluxos de comunicação
- [x] Documentar formato de dados
- [x] Criar exemplos de requisições

## Desabilitar Execução Local - Arquitetura Cliente-Servidor
- [x] Remover execução direta de scripts Python do backend
- [x] Modificar routers.ts para apenas criar jobs no banco
- [x] Atualizar frontend para mostrar status "Waiting for worker"
- [x] Adicionar mensagem sobre configuração de worker
- [x] Testar criação de jobs sem execução local

## Deploy Worker em Servidor Kali Linux
- [x] Criar script deploy.sh automatizado
- [x] Criar arquivo de configuração .env para worker
- [x] Criar systemd service para iniciar worker automaticamente
- [x] Criar script de monitoramento do worker
- [x] Documentar processo de deploy passo a passo (WORKER_DEPLOYMENT_GUIDE.md)


## WebSocket e Terminal Output - Streaming em Tempo Real

- [x] Implementar WebSocket server no backend (Socket.io ou ws)
- [x] Substituir HTTP polling por WebSocket para logs em tempo real
- [x] Melhorar terminal output com status geral + detalhado
- [x] Adicionar prefixos coloridos ao terminal ([+], [*], [!], [VERBOSE])
- [x] Implementar animação de cursor piscando durante execução
- [ ] Mostrar progresso percentual do scan

## Admin Dashboard - Monitoramento de Workers

- [x] Criar página /admin com autenticação (apenas usuários logados)
- [x] Listar workers ativos com status (online/offline/idle/busy)
- [x] Mostrar job queue (pending, running, completed)
- [x] Exibir métricas de workers (uptime, scans completados, taxa de sucesso)
- [x] Health check de workers (última conexão, latência)
- [x] Gráficos de performance (scans por hora, tempo médio, vulnerabilidades encontradas)
- [x] Logs de sistema (eventos de workers, erros, alertas)
- [ ] Controles de gerenciamento (pausar/retomar workers, limpar fila)

## Testes e Validação

- [x] Testar WebSocket com múltiplos clientes simultâneos
- [x] Validar streaming de logs em tempo real
- [x] Testar admin dashboard com dados reais
- [ ] Validar performance com múltiplos workers
- [ ] Testar fallback para HTTP polling se WebSocket falhar


## Exibição de Resultados e Download de Relatórios

- [x] Criar componente VulnerabilitiesTable para exibir resultados
- [x] Mostrar vulnerabilidades no terminal output com formatação
- [x] Exibir severidade com cores (crítico=vermelho, alto=laranja, médio=amarelo, baixo=azul)
- [x] Criar seção de resultados com tabela de vulnerabilidades
- [x] Implementar filtros de severidade nos resultados
- [x] Criar função de geração de relatório completo (.txt)
- [x] Adicionar botão de download de relatório com dados completos
- [x] Incluir gráficos ASCII no relatório
- [x] Adicionar timestamps e metadados no relatório
- [x] Testar download com múltiplos tipos de scan
- [x] Validar formatação do relatório em diferentes sistemas operacionais
