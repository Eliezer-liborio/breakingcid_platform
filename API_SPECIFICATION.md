# BreakingCID - API Specification
## Backend ↔ Worker Communication

---

## Arquitetura

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │────────▶│   Backend   │◀────────│   Worker    │
│   (React)   │  tRPC   │  (Express)  │   REST  │  (Python)   │
└─────────────┘         └─────────────┘         └─────────────┘
                              │                        │
                              │                        │
                         ┌────▼────┐              ┌────▼────┐
                         │Database │              │  Kali   │
                         │ (MySQL) │              │  Tools  │
                         └─────────┘              └─────────┘
```

---

## Fluxo de Comunicação

### 1. Usuário Inicia Scan (Frontend → Backend)

```typescript
// Frontend chama via tRPC
trpc.scans.create.useMutation({
  target: "https://example.com",
  scanType: "xss",
  verbose: true
})
```

**Backend cria job no banco:**
```sql
INSERT INTO scans (target, scanType, status, createdAt)
VALUES ('https://example.com', 'xss', 'pending', NOW())
```

---

### 2. Worker Busca Jobs Pendentes (Polling)

**Endpoint:** `GET /api/worker/jobs/pending`

**Headers:**
```http
X-Worker-API-Key: your-secret-api-key
X-Worker-ID: worker-001
```

**Response 200 OK:**
```json
{
  "success": true,
  "jobs": [
    {
      "id": 123,
      "target": "https://example.com",
      "scanType": "xss",
      "verbose": true,
      "createdAt": "2026-01-15T15:30:00Z"
    }
  ]
}
```

**Response 401 Unauthorized:**
```json
{
  "success": false,
  "error": "Invalid API key"
}
```

**Response 404 Not Found:**
```json
{
  "success": true,
  "jobs": []
}
```

---

### 3. Worker Marca Job como "Em Execução"

**Endpoint:** `POST /api/worker/jobs/:id/start`

**Headers:**
```http
X-Worker-API-Key: your-secret-api-key
X-Worker-ID: worker-001
Content-Type: application/json
```

**Request Body:**
```json
{
  "workerId": "worker-001"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Job started"
}
```

**Backend atualiza banco:**
```sql
UPDATE scans 
SET status = 'running', 
    workerId = 'worker-001', 
    workerPickedAt = NOW()
WHERE id = 123
```

---

### 4. Worker Envia Logs em Tempo Real

**Endpoint:** `POST /api/worker/jobs/:id/logs`

**Headers:**
```http
X-Worker-API-Key: your-secret-api-key
X-Worker-ID: worker-001
Content-Type: application/json
```

**Request Body:**
```json
{
  "logs": [
    {
      "timestamp": "2026-01-15T15:30:05Z",
      "level": "info",
      "message": "[*] Starting XSS scan..."
    },
    {
      "timestamp": "2026-01-15T15:30:06Z",
      "level": "verbose",
      "message": "[VERBOSE] Testing parameter: q"
    },
    {
      "timestamp": "2026-01-15T15:30:07Z",
      "level": "success",
      "message": "[+] Vulnerability found: Reflected XSS"
    }
  ]
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Logs saved"
}
```

**Backend salva logs:**
```sql
INSERT INTO scan_logs (scanId, timestamp, level, message)
VALUES (123, '2026-01-15 15:30:05', 'info', '[*] Starting XSS scan...')
```

---

### 5. Worker Envia Resultados Finais

**Endpoint:** `POST /api/worker/jobs/:id/results`

**Headers:**
```http
X-Worker-API-Key: your-secret-api-key
X-Worker-ID: worker-001
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "completed",
  "vulnerabilities": [
    {
      "type": "Reflected XSS",
      "severity": "high",
      "location": "/search?q=",
      "payload": "<script>alert(1)</script>",
      "evidence": "Payload reflected in response",
      "impact": "Attacker can execute arbitrary JavaScript",
      "remediation": "Implement proper output encoding"
    }
  ],
  "report": "# Security Assessment Report\n\n## Executive Summary\n...",
  "duration": 45.2,
  "completedAt": "2026-01-15T15:30:45Z"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Results saved"
}
```

**Backend atualiza banco:**
```sql
UPDATE scans 
SET status = 'completed', 
    completedAt = NOW()
WHERE id = 123;

INSERT INTO vulnerabilities (scanId, type, severity, location, payload, evidence, impact, remediation)
VALUES (123, 'Reflected XSS', 'high', '/search?q=', '<script>alert(1)</script>', ...);
```

---

### 6. Worker Reporta Erro

**Endpoint:** `POST /api/worker/jobs/:id/error`

**Headers:**
```http
X-Worker-API-Key: your-secret-api-key
X-Worker-ID: worker-001
Content-Type: application/json
```

**Request Body:**
```json
{
  "error": "Connection timeout",
  "details": "Failed to connect to target after 3 retries",
  "timestamp": "2026-01-15T15:35:00Z"
}
```

**Response 200 OK:**
```json
{
  "success": true,
  "message": "Error reported"
}
```

**Backend atualiza banco:**
```sql
UPDATE scans 
SET status = 'failed', 
    error = 'Connection timeout',
    completedAt = NOW()
WHERE id = 123
```

---

## Autenticação

### API Key

O worker se autentica usando uma chave API no header `X-Worker-API-Key`.

**Geração da API Key:**
```bash
# No backend, gerar chave aleatória
openssl rand -hex 32
# Resultado: 8f4a9b2c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
```

**Configuração no Worker:**
```bash
# worker/.env
BACKEND_URL=https://breakingcid.manus.space
WORKER_API_KEY=8f4a9b2c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0
WORKER_ID=worker-001
```

**Validação no Backend:**
```typescript
// server/workerApi.ts
const WORKER_API_KEY = process.env.WORKER_API_KEY || "default-key-change-me";

function validateWorkerAuth(req: Request): boolean {
  const apiKey = req.headers['x-worker-api-key'];
  return apiKey === WORKER_API_KEY;
}
```

---

## Formato de Dados

### Scan Types

```typescript
type ScanType = 
  | "http_smuggling"
  | "ssrf"
  | "xss"
  | "subdomain_enum"
  | "comprehensive";
```

### Scan Status

```typescript
type ScanStatus = 
  | "pending"      // Aguardando worker
  | "running"      // Em execução
  | "completed"    // Concluído com sucesso
  | "failed";      // Falhou com erro
```

### Vulnerability Severity

```typescript
type Severity = 
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "info";
```

### Log Levels

```typescript
type LogLevel = 
  | "info"       // [*] Informações gerais
  | "verbose"    // [VERBOSE] Detalhes técnicos
  | "success"    // [+] Sucesso/vulnerabilidade
  | "warning"    // [!] Avisos
  | "error";     // [-] Erros
```

---

## Exemplos de Implementação

### Worker Client (Python)

```python
import requests
import time
import json
from typing import Dict, List

class WorkerClient:
    def __init__(self, backend_url: str, api_key: str, worker_id: str):
        self.backend_url = backend_url
        self.api_key = api_key
        self.worker_id = worker_id
        self.headers = {
            'X-Worker-API-Key': api_key,
            'X-Worker-ID': worker_id,
            'Content-Type': 'application/json'
        }
    
    def get_pending_jobs(self) -> List[Dict]:
        """Busca jobs pendentes"""
        response = requests.get(
            f"{self.backend_url}/api/worker/jobs/pending",
            headers=self.headers
        )
        if response.status_code == 200:
            return response.json()['jobs']
        return []
    
    def start_job(self, job_id: int):
        """Marca job como iniciado"""
        requests.post(
            f"{self.backend_url}/api/worker/jobs/{job_id}/start",
            headers=self.headers,
            json={'workerId': self.worker_id}
        )
    
    def send_logs(self, job_id: int, logs: List[Dict]):
        """Envia logs em tempo real"""
        requests.post(
            f"{self.backend_url}/api/worker/jobs/{job_id}/logs",
            headers=self.headers,
            json={'logs': logs}
        )
    
    def send_results(self, job_id: int, results: Dict):
        """Envia resultados finais"""
        requests.post(
            f"{self.backend_url}/api/worker/jobs/{job_id}/results",
            headers=self.headers,
            json=results
        )
    
    def report_error(self, job_id: int, error: str, details: str):
        """Reporta erro"""
        requests.post(
            f"{self.backend_url}/api/worker/jobs/{job_id}/error",
            headers=self.headers,
            json={
                'error': error,
                'details': details,
                'timestamp': time.strftime('%Y-%m-%dT%H:%M:%SZ')
            }
        )

# Uso
client = WorkerClient(
    backend_url="https://breakingcid.manus.space",
    api_key="8f4a9b2c1d3e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0",
    worker_id="worker-001"
)

# Loop principal
while True:
    jobs = client.get_pending_jobs()
    for job in jobs:
        client.start_job(job['id'])
        # Executar scan...
        client.send_results(job['id'], results)
    time.sleep(5)  # Polling a cada 5 segundos
```

---

## Segurança

### 1. HTTPS Obrigatório

Toda comunicação deve usar HTTPS para proteger a API key em trânsito.

### 2. Rate Limiting

Limitar requisições por worker:
- Polling: 1 req/5s
- Logs: 10 req/min
- Results: 1 req/scan

### 3. Validação de Dados

Backend deve validar todos os dados recebidos:
```typescript
const resultSchema = z.object({
  status: z.enum(['completed', 'failed']),
  vulnerabilities: z.array(z.object({
    type: z.string(),
    severity: z.enum(['critical', 'high', 'medium', 'low', 'info']),
    location: z.string(),
    payload: z.string().optional(),
    evidence: z.string(),
    impact: z.string(),
    remediation: z.string()
  })),
  report: z.string(),
  duration: z.number(),
  completedAt: z.string()
});
```

### 4. Timeout de Jobs

Jobs que não completam em 30 minutos são marcados como `timeout`:
```sql
UPDATE scans 
SET status = 'failed', error = 'Timeout' 
WHERE status = 'running' 
AND workerPickedAt < NOW() - INTERVAL 30 MINUTE
```

---

## Monitoramento

### Métricas

- **Jobs pendentes**: Quantos jobs aguardam worker
- **Jobs em execução**: Quantos jobs estão rodando
- **Taxa de sucesso**: % de jobs completados vs falhados
- **Tempo médio**: Duração média dos scans
- **Workers ativos**: Quantos workers fizeram polling nos últimos 60s

### Logs

Backend deve logar:
- Autenticação de workers
- Início/fim de jobs
- Erros reportados
- Timeouts

---

## Troubleshooting

### Worker não consegue buscar jobs

**Problema:** `401 Unauthorized`

**Solução:** Verificar se `WORKER_API_KEY` no worker corresponde à chave no backend.

### Jobs ficam em "running" indefinidamente

**Problema:** Worker crashou sem reportar erro

**Solução:** Implementar cron job no backend para marcar jobs antigos como timeout:
```bash
# Executar a cada 5 minutos
*/5 * * * * curl -X POST https://backend/api/admin/cleanup-timeouts
```

### Logs não aparecem no frontend

**Problema:** Frontend não está fazendo polling

**Solução:** Verificar se `refetchInterval` está configurado no `useQuery`:
```typescript
const { data: logs } = trpc.scans.getLogs.useQuery(
  { scanId },
  { refetchInterval: 1000, enabled: status === 'running' }
);
```

---

## Próximos Passos

1. **WebSocket**: Substituir polling por WebSocket para logs em tempo real
2. **Queue System**: Implementar Redis/Bull para gerenciar fila de jobs
3. **Load Balancing**: Distribuir jobs entre múltiplos workers
4. **Health Check**: Endpoint para workers reportarem status
5. **Admin Dashboard**: Interface para monitorar workers e jobs

---

*Documentação gerada em 2026-01-15*
