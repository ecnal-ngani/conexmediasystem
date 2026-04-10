// Generates self-signed certificates for local HTTPS development
// This enables camera access on mobile devices over the local network

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const certDir = path.join(__dirname, '..', 'certificates');
if (!fs.existsSync(certDir)) fs.mkdirSync(certDir, { recursive: true });

const keyPath = path.join(certDir, 'localhost-key.pem');
const certPath = path.join(certDir, 'localhost.pem');

if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
  console.log('✅ Certificates already exist at:', certDir);
  process.exit(0);
}

// Generate using Node.js built-in crypto (available in Node 15+)
const { generateKeyPairSync, createSign, randomBytes } = require('crypto');
const { X509Certificate } = require('crypto');

// Generate RSA key pair
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// We need openssl for cert generation - check if available
try {
  execSync('openssl version', { stdio: 'pipe' });
  
  // Write private key
  fs.writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  
  // Generate cert using openssl
  const configPath = path.join(certDir, 'openssl.cnf');
  fs.writeFileSync(configPath, `
[req]
default_bits = 2048
prompt = no
default_md = sha256
distinguished_name = dn
x509_extensions = v3_req

[dn]
C = PH
ST = Local
L = Dev
O = CONEX MEDIA
CN = localhost

[v3_req]
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
IP.2 = 0.0.0.0
`);
  
  execSync(`openssl req -x509 -new -key "${keyPath}" -out "${certPath}" -days 365 -config "${configPath}"`, { stdio: 'pipe' });
  fs.unlinkSync(configPath);
  
  console.log('✅ Self-signed certificates generated at:', certDir);
  console.log('   Key:', keyPath);
  console.log('   Cert:', certPath);
} catch (e) {
  // Fallback: use mkcert if openssl isn't available
  console.log('openssl not found, trying alternative...');
  
  // Generate a simple self-signed cert using only Node crypto
  const { createPrivateKey } = require('crypto');
  
  // Write key
  fs.writeFileSync(keyPath, privateKey.export({ type: 'pkcs8', format: 'pem' }));
  
  // For the cert, we need to use a child process approach
  // Write a temp script that generates via TLS
  console.log('⚠️  Could not generate certificates automatically.');
  console.log('   Please install OpenSSL or run the dev server with: npm run dev:http');
  console.log('   Camera will still work on localhost, use the file upload fallback on mobile.');
  process.exit(1);
}
