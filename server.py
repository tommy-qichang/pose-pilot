#!/usr/bin/env python3
"""
Simple HTTPS server for Pose Pilot development
Requires HTTPS for camera access on mobile devices
"""

import http.server
import ssl
import socketserver
import os
from pathlib import Path

class CORSHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def create_self_signed_cert():
    """Create a self-signed certificate for development"""
    try:
        import subprocess
        
        # Check if cert already exists
        if os.path.exists('server.crt') and os.path.exists('server.key'):
            print("✅ SSL certificate already exists")
            return True
            
        print("🔐 Creating self-signed SSL certificate...")
        
        # Create self-signed certificate
        subprocess.run([
            'openssl', 'req', '-x509', '-newkey', 'rsa:4096', '-keyout', 'server.key',
            '-out', 'server.crt', '-days', '365', '-nodes', '-subj',
            '/C=US/ST=State/L=City/O=Organization/CN=localhost'
        ], check=True, capture_output=True)
        
        print("✅ SSL certificate created successfully")
        return True
        
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ Failed to create SSL certificate")
        print("   Make sure OpenSSL is installed, or use an existing certificate")
        return False

def main():
    PORT = 8443
    
    print("🚀 Starting Pose Pilot HTTPS Server...")
    print(f"📱 Server will run on: https://localhost:{PORT}")
    print("📝 Note: You'll need to accept the self-signed certificate warning")
    
    # Create SSL certificate if needed
    if not create_self_signed_cert():
        print("⚠️  Running without HTTPS - camera may not work on mobile")
        PORT = 8000
        
        with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
            print(f"🌐 HTTP Server running at: http://localhost:{PORT}")
            print("⚠️  Camera access requires HTTPS on mobile devices")
            httpd.serve_forever()
        return
    
    # Setup HTTPS server
    with socketserver.TCPServer(("", PORT), CORSHTTPRequestHandler) as httpd:
        # Create SSL context
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain('server.crt', 'server.key')
        httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
        
        print(f"🔒 HTTPS Server running at: https://localhost:{PORT}")
        print("📱 To test on mobile:")
        print("   1. Find your local IP address")
        print("   2. Access https://YOUR_IP:8443")
        print("   3. Accept the certificate warning")
        print("   4. Allow camera permissions")
        print("\n🛑 Press Ctrl+C to stop the server")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n👋 Server stopped")

if __name__ == "__main__":
    main()