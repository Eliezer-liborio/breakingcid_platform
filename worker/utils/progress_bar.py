#!/usr/bin/env python3
"""
Progress Bar Utility
"""

import sys
import time

class ProgressBar:
    def __init__(self, total, description="Progress"):
        self.total = total
        self.current = 0
        self.description = description
        self.start_time = time.time()
    
    def update(self, n=1):
        """Update progress by n steps"""
        self.current += n
        progress = self.current / self.total
        bar_length = 40
        filled = int(bar_length * progress)
        
        bar = '█' * filled + '░' * (bar_length - filled)
        percentage = int(progress * 100)
        
        elapsed = time.time() - self.start_time
        if progress > 0:
            eta = elapsed / progress * (1 - progress)
            eta_str = f"ETA: {eta:.1f}s"
        else:
            eta_str = "ETA: N/A"
        
        sys.stdout.write(f'\r{self.description}: |{bar}| {percentage}% ({self.current}/{self.total}) {eta_str}')
        sys.stdout.flush()
        
        if self.current == self.total:
            sys.stdout.write('\n')
    
    def finish(self):
        """Complete the progress bar"""
        self.current = self.total
        self.update(0)

if __name__ == "__main__":
    # Test
    print("Testing progress bar...")
    pb = ProgressBar(100, "Scanning")
    for i in range(100):
        time.sleep(0.05)
        pb.update()
