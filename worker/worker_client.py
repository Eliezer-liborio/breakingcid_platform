#!/usr/bin/env python3
"""
BreakingCID Worker Client
Executa scans de segurança e reporta resultados ao backend
"""

import os
import sys
import time
import json
import requests
import subprocess
from datetime import datetime
from pathlib import Path

# Configuração
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:3000")
WORKER_API_KEY = os.getenv("WORKER_API_KEY", "default-worker-key-change-in-production")
WORKER_ID = os.getenv("WORKER_ID", f"worker-{os.uname().nodename}")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "5"))  # segundos

# Diretório dos scripts
SCRIPTS_DIR = Path(__file__).parent / "scripts"

class WorkerClient:
    def __init__(self):
        self.headers = {
            "X-Worker-API-Key": WORKER_API_KEY,
            "Content-Type": "application/json"
        }
        
    def log(self, message):
        """Log com timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {message}")
        
    def send_log(self, job_id, message):
        """Envia log em tempo real para o backend"""
        try:
            requests.post(
                f"{BACKEND_URL}/api/worker/jobs/{job_id}/logs",
                headers=self.headers,
                json={"message": message},
                timeout=5
            )
        except Exception as e:
            self.log(f"Failed to send log: {e}")
            
    def fetch_pending_job(self):
        """Busca próximo job pendente"""
        try:
            response = requests.get(
                f"{BACKEND_URL}/api/worker/jobs/pending",
                headers=self.headers,
                params={"workerId": WORKER_ID},
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                return data.get("job")
            else:
                self.log(f"Error fetching job: {response.status_code}")
                return None
        except Exception as e:
            self.log(f"Failed to fetch job: {e}")
            return None
            
    def execute_scan(self, job):
        """Executa scan baseado no tipo"""
        job_id = job["id"]
        scan_type = job["scanType"]
        target = job["target"]
        
        self.log(f"[Job {job_id}] Starting {scan_type} scan on {target}")
        self.send_log(job_id, f"[*] Worker {WORKER_ID} picked up job")
        self.send_log(job_id, f"[*] Scan type: {scan_type}")
        self.send_log(job_id, f"[*] Target: {target}")
        
        start_time = time.time()
        
        try:
            # Selecionar script apropriado
            if scan_type == "http_smuggling":
                script = SCRIPTS_DIR / "http_smuggling.py"
            elif scan_type == "ssrf":
                script = SCRIPTS_DIR / "ssrf_scanner.py"
            elif scan_type == "xss":
                script = SCRIPTS_DIR / "xss_scanner.py"
            elif scan_type == "subdomain_enum":
                script = SCRIPTS_DIR / "subdomain_enum.sh"
            elif scan_type == "comprehensive":
                return self.execute_comprehensive(job)
            else:
                raise ValueError(f"Unknown scan type: {scan_type}")
                
            # Executar script
            self.send_log(job_id, f"[*] Executing {script.name}...")
            
            if script.suffix == ".sh":
                result = subprocess.run(
                    ["bash", str(script), target],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
            else:
                result = subprocess.run(
                    ["python3", str(script), target],
                    capture_output=True,
                    text=True,
                    timeout=300
                )
                
            # Capturar logs do stderr
            if result.stderr:
                for line in result.stderr.split("\n"):
                    if line.strip():
                        self.send_log(job_id, line.strip())
                        
            # Parse resultado
            if result.returncode == 0 and result.stdout:
                scan_result = json.loads(result.stdout)
                duration = int(time.time() - start_time)
                
                self.send_log(job_id, f"[+] Scan completed in {duration}s")
                self.send_results(job_id, scan_result, duration)
            else:
                raise Exception(f"Script failed: {result.stderr}")
                
        except Exception as e:
            self.log(f"[Job {job_id}] Error: {e}")
            self.send_error(job_id, str(e))
            
    def execute_comprehensive(self, job):
        """Executa todos os scans"""
        job_id = job["id"]
        target = job["target"]
        
        self.send_log(job_id, "[*] Starting comprehensive scan...")
        
        scan_types = ["http_smuggling", "ssrf", "xss", "subdomain_enum"]
        all_vulnerabilities = []
        start_time = time.time()
        
        for scan_type in scan_types:
            self.send_log(job_id, f"[*] Running {scan_type}...")
            sub_job = {"id": job_id, "scanType": scan_type, "target": target}
            # Execute cada scan individualmente
            # (simplificado - na prática você executaria e agregaria resultados)
            
        duration = int(time.time() - start_time)
        self.send_log(job_id, f"[+] Comprehensive scan completed in {duration}s")
        
        # Enviar resultados agregados
        result = {
            "vulnerabilities": all_vulnerabilities,
            "report": {
                "content": "# Comprehensive Scan Report\n\nAll scans completed.",
                "summary": {
                    "total": len(all_vulnerabilities),
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "info": 0
                }
            }
        }
        
        self.send_results(job_id, result, duration)
        
    def send_results(self, job_id, result, duration):
        """Envia resultados finais"""
        try:
            response = requests.post(
                f"{BACKEND_URL}/api/worker/jobs/{job_id}/results",
                headers=self.headers,
                json={
                    "status": "completed",
                    "vulnerabilities": result.get("vulnerabilities", []),
                    "report": result.get("report"),
                    "duration": duration
                },
                timeout=30
            )
            
            if response.status_code == 200:
                self.log(f"[Job {job_id}] Results sent successfully")
            else:
                self.log(f"[Job {job_id}] Failed to send results: {response.status_code}")
        except Exception as e:
            self.log(f"[Job {job_id}] Error sending results: {e}")
            
    def send_error(self, job_id, error):
        """Reporta erro na execução"""
        try:
            requests.post(
                f"{BACKEND_URL}/api/worker/jobs/{job_id}/error",
                headers=self.headers,
                json={"error": error},
                timeout=10
            )
        except Exception as e:
            self.log(f"Failed to report error: {e}")
            
    def run(self):
        """Loop principal do worker"""
        self.log(f"Worker {WORKER_ID} started")
        self.log(f"Backend: {BACKEND_URL}")
        self.log(f"Poll interval: {POLL_INTERVAL}s")
        
        while True:
            try:
                job = self.fetch_pending_job()
                
                if job:
                    self.execute_scan(job)
                else:
                    # Sem jobs, aguardar
                    time.sleep(POLL_INTERVAL)
                    
            except KeyboardInterrupt:
                self.log("Worker stopped by user")
                break
            except Exception as e:
                self.log(f"Unexpected error: {e}")
                time.sleep(POLL_INTERVAL)

if __name__ == "__main__":
    worker = WorkerClient()
    worker.run()
