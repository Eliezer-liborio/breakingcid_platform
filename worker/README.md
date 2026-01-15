# BreakingCID Worker Server

Worker remoto para executar scans de segurança com ferramentas reais do Kali Linux.

## Arquitetura

```
Frontend (Web UI)
    ↓
Backend API (Node.js + tRPC)
    ↓
Job Queue (MySQL Database)
    ↓
Worker Server (Python + Bash)
    ↓
Security Tools (nmap, amass, subfinder, etc)
```

## Instalação

### 1. Preparar Servidor Ubuntu/Kali

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y python3 python3-pip curl jq host dnsutils

# Instalar bibliotecas Python
sudo pip3 install requests beautifulsoup4 dnspython
```

### 2. Instalar Ferramentas de Pentest (Opcional)

Para funcionalidade completa, instale ferramentas adicionais:

```bash
# Amass (subdomain enumeration)
sudo apt install -y amass

# Subfinder
GO111MODULE=on go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest

# Assetfinder
go install github.com/tomnomnom/assetfinder@latest

# Nmap
sudo apt install -y nmap

# SQLMap
sudo apt install -y sqlmap
```

### 3. Configurar Worker

```bash
# Clonar/copiar diretório worker
cd /opt
sudo git clone <repo-url> breakingcid-worker
cd breakingcid-worker/worker

# Configurar variáveis de ambiente
sudo nano /etc/systemd/system/breakingcid-worker.env
```

Conteúdo do arquivo `.env`:

```bash
BACKEND_URL=https://your-backend-url.com
WORKER_API_KEY=your-secure-api-key-here
WORKER_ID=worker-prod-01
POLL_INTERVAL=5
```

### 4. Criar Serviço Systemd

```bash
sudo nano /etc/systemd/system/breakingcid-worker.service
```

Conteúdo:

```ini
[Unit]
Description=BreakingCID Worker Service
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/breakingcid-worker/worker
EnvironmentFile=/etc/systemd/system/breakingcid-worker.env
ExecStart=/usr/bin/python3 /opt/breakingcid-worker/worker/worker_client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5. Iniciar Worker

```bash
# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar auto-start
sudo systemctl enable breakingcid-worker

# Iniciar worker
sudo systemctl start breakingcid-worker

# Verificar status
sudo systemctl status breakingcid-worker

# Ver logs
sudo journalctl -u breakingcid-worker -f
```

## Configuração do Backend

No backend, configure a variável de ambiente:

```bash
WORKER_API_KEY=your-secure-api-key-here
```

**Importante**: Use a mesma chave no backend e no worker!

## Funcionamento

1. **Worker faz polling** no backend a cada 5 segundos buscando jobs pendentes
2. **Backend retorna job** com ID, tipo de scan e target
3. **Worker executa scan** usando scripts apropriados (.sh ou .py)
4. **Logs em tempo real** são enviados ao backend durante execução
5. **Resultados finais** (vulnerabilidades + relatório) são enviados ao completar
6. **Frontend atualiza** automaticamente via polling do banco de dados

## Scripts Disponíveis

### Python Scripts (`scripts/*.py`)

- `http_smuggling.py` - HTTP Request Smuggling (CL.TE, TE.CL, TE.TE)
- `ssrf_scanner.py` - Server-Side Request Forgery
- `xss_scanner.py` - Cross-Site Scripting (Reflected, DOM, Template Injection)

### Bash Scripts (`scripts/*.sh`)

- `subdomain_enum.sh` - Subdomain Enumeration (Certificate Transparency + DNS)

## Formato de Output

Todos os scripts devem retornar JSON no stdout:

```json
{
  "scan_type": "xss",
  "target": "https://example.com",
  "vulnerabilities": [
    {
      "type": "Reflected XSS",
      "severity": "high",
      "title": "XSS in search parameter",
      "description": "...",
      "payload": "<script>alert(1)</script>",
      "evidence": "...",
      "remediation": "...",
      "cvss": 7.5
    }
  ],
  "report": {
    "content": "# Markdown Report\n...",
    "summary": {
      "total": 1,
      "critical": 0,
      "high": 1,
      "medium": 0,
      "low": 0,
      "info": 0
    }
  }
}
```

## Logs Progressivos

Scripts podem enviar logs para stderr que serão capturados e enviados ao backend:

```python
print("[*] Starting scan...", file=sys.stderr)
print("[VERBOSE] Testing payload: <script>alert(1)</script>", file=sys.stderr)
print("[+] Vulnerability found!", file=sys.stderr)
print("[!] Error: Connection timeout", file=sys.stderr)
```

## Troubleshooting

### Worker não conecta ao backend

```bash
# Verificar conectividade
curl -H "X-Worker-API-Key: your-key" \
  http://backend-url/api/worker/jobs/pending?workerId=test

# Verificar logs
sudo journalctl -u breakingcid-worker -n 50
```

### Scripts falhando

```bash
# Testar script manualmente
cd /opt/breakingcid-worker/worker/scripts
python3 xss_scanner.py "https://example.com"

# Verificar permissões
ls -l scripts/
chmod +x scripts/*.sh
```

### Jobs ficam "running" indefinitely

- Verificar timeout dos scripts (padrão: 300s)
- Verificar se worker está enviando resultados
- Verificar logs do worker

## Segurança

- **API Key**: Use chave forte e única
- **Firewall**: Restrinja acesso ao backend apenas do IP do worker
- **Isolamento**: Execute worker em VM/container isolado
- **Rate Limiting**: Configure no backend para evitar abuse
- **Logs**: Monitore logs do worker para atividades suspeitas

## Performance

- **Polling Interval**: Ajuste `POLL_INTERVAL` baseado na carga
- **Concurrent Workers**: Execute múltiplos workers com IDs diferentes
- **Timeout**: Ajuste timeout dos scripts baseado no target
- **Resources**: Monitore CPU/RAM do servidor worker

## Manutenção

```bash
# Atualizar worker
cd /opt/breakingcid-worker
sudo git pull
sudo systemctl restart breakingcid-worker

# Limpar logs antigos
sudo journalctl --vacuum-time=7d

# Backup de configuração
sudo cp /etc/systemd/system/breakingcid-worker.env /root/backup/
```

## Suporte

Para problemas ou dúvidas, consulte:
- Logs do worker: `sudo journalctl -u breakingcid-worker -f`
- Logs do backend: Verifique console do servidor Node.js
- Status do job: Consulte banco de dados tabela `scans`
