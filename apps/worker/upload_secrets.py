#!/usr/bin/env python3

from types import TracebackType
import contextlib
import re
import subprocess
import sys
from pathlib import Path

def parse_toml_worker_name(toml_path):
    """Extract worker name from wrangler.toml"""
    try:
        with open(toml_path, 'r') as f:
            for line in f:
                if line.startswith('name'):
                    match = re.match(r'name\s*=\s*["\']([^"\']+)["\']', line)
                    if match:
                        return match.group(1)
    except Exception:
        pass
    return None

def parse_env_file(env_path):
    """Parse .env file handling multi-line values."""
    env_vars = {}
    current_key = None
    current_value = ""
    in_multiline = False
    
    with open(env_path, 'r') as f:
        for line in f:
            line = line.rstrip('\n')
            
            # Skip comments and empty lines
            if line.startswith('#') or not line.strip():
                continue
            
            # Check if this is a new KEY=VALUE pair
            if not in_multiline and '=' in line:
                key_match = re.match(r'^([A-Z_]+)=(.*)$', line)
                if key_match:
                    # Save previous key if exists
                    if current_key:
                        env_vars[current_key] = current_value
                    
                    current_key = key_match.group(1)
                    value_part = key_match.group(2)
                    
                    # Check if value is quoted
                    if value_part.startswith('"'):
                        # Remove leading quote
                        value_part = value_part[1:]
                        # Check if it ends with quote (single-line)
                        if value_part.endswith('"'):
                            current_value = value_part[:-1]
                            in_multiline = False
                        else:
                            # Multi-line value
                            current_value = value_part
                            in_multiline = True
                    else:
                        current_value = value_part
                        in_multiline = False
            elif in_multiline:
                # Continuation of multi-line value
                if line.endswith('"'):
                    # End of multi-line value
                    current_value += '\n' + line[:-1]
                    in_multiline = False
                else:
                    current_value += '\n' + line
        
        # Save last key
        if current_key:
            env_vars[current_key] = current_value
    
    return env_vars

def upload_to_cloudflare(env_vars, worker_name, env_config, dry_run=False):
    """Upload secrets to Cloudflare."""
    for key, value in env_vars.items():
        print(f"Setting secret: {key}...", end=" ", flush=True)
        
        if dry_run:
            print(f"\n[DRY-RUN] {len(value)} chars")
            print(f"[DRY-RUN] Value:\n{value}\n")
            continue

        cmd = ['npx', 'wrangler', 'secret', 'put', key, '--name', worker_name] #, '--env', env_config]
        try:
            proc = subprocess.Popen(
                cmd,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            stdout, stderr = proc.communicate(input=value, timeout=60)
            print(stdout.strip())
            if proc.returncode != 0:
                print(f"❌\n  Error: {stderr.strip()}")
            else:
                print(f"✓")
        except subprocess.TimeoutExpired:
            proc.kill()
            print(f"❌ (timeout after 60s)")
        except Exception as e:
            print(f"❌\n  Exception: {e}")

if __name__ == '__main__':
    try:
        import argparse
    
        parser = argparse.ArgumentParser()
        parser.add_argument('--dry-run', action='store_true', help='Print secrets without uploading')
        args = parser.parse_args()

        toml_file = Path('wrangler.toml')
        env_file = Path('.dev.vars')
        
        if not toml_file.exists():
            print(f"Error: {toml_file} not found")
            sys.exit(1)
        
        if not env_file.exists():
            print(f"Error: {env_file} not found")
            sys.exit(1)
        
        # Parse worker name from wrangler.toml
        worker_name = parse_toml_worker_name(toml_file)
        if not worker_name:
            print(f"Error: Could not find 'name' field in {toml_file}")
            sys.exit(1)
        
        print(f"Worker name: {worker_name}")
        print(f"Parsing {env_file}...")
        env_vars = parse_env_file(env_file)
        print(f"Found {len(env_vars)} secrets\n")
        
        print("Uploading to Cloudflare...\n")
        upload_to_cloudflare(env_vars, worker_name, 'production', dry_run=args.dry_run)
        
        print("\n✓ Done!")
    except KeyboardInterrupt:
        print("\nExiting...")
        sys.exit(0)
    except TracebackType as e:
        print(f"Error: {e}")
        sys.exit(1)
