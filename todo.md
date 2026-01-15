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
