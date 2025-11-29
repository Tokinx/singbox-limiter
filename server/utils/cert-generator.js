import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CERT_DIR = join(__dirname, '../../certs');

// 确保证书目录存在
if (!existsSync(CERT_DIR)) {
  mkdirSync(CERT_DIR, { recursive: true });
}

/**
 * 生成自签名证书
 * 所有客户端共用一套证书
 */
export function generateSelfSignedCert() {
  const certPath = join(CERT_DIR, 'server.pem');
  const keyPath = join(CERT_DIR, 'server.key');

  // 如果证书已存在，跳过
  if (existsSync(certPath) && existsSync(keyPath)) {
    console.log('✅ 证书已存在，跳过生成');
    return { certPath, keyPath };
  }

  console.log('🔐 正在生成自签名证书...');

  try {
    // 使用 openssl 生成自签名证书
    execSync(`openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 \
      -nodes -keyout "${keyPath}" -out "${certPath}" \
      -subj "/CN=singbox-limiter" \
      -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"`, {
      stdio: 'inherit'
    });

    console.log('✅ 证书生成成功');
    console.log(`   证书路径: ${certPath}`);
    console.log(`   私钥路径: ${keyPath}`);

    return { certPath, keyPath };
  } catch (error) {
    console.error('❌ 证书生成失败:', error.message);
    throw error;
  }
}

/**
 * 生成 Reality 密钥对
 * 使用 Node.js crypto 模块生成 X25519 密钥对
 */
export function generateRealityKeyPair() {
  try {
    // 使用 Node.js crypto 生成 X25519 密钥对
    const keyPair = crypto.generateKeyPairSync('x25519');

    // 导出原始密钥数据
    const privateKeyDer = keyPair.privateKey.export({ type: 'pkcs8', format: 'der' });
    const publicKeyDer = keyPair.publicKey.export({ type: 'spki', format: 'der' });

    // X25519 密钥在 DER 格式中的偏移位置
    // PKCS8 私钥: 前16字节是 header，实际密钥从第16字节开始，长度32字节
    // SPKI 公钥: 前12字节是 header，实际密钥从第12字节开始，长度32字节
    const privateKeyRaw = privateKeyDer.slice(-32);
    const publicKeyRaw = publicKeyDer.slice(-32);

    // 转换为 base64 编码（sing-box 使用标准 base64）
    const privateKey = privateKeyRaw.toString('base64');
    const publicKey = publicKeyRaw.toString('base64');

    console.log('✅ Reality 密钥生成成功 (crypto)');
    return { publicKey, privateKey };
  } catch (error) {
    console.error('❌ Reality 密钥生成失败:', error.message);
    throw error;
  }
}

/**
 * 生成短 ID (16位16进制字符串)
 */
export function generateShortId() {
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  return Array.from({ length: 16 }, randomHex).join('');
}

// 如果直接运行此脚本，则生成证书
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSelfSignedCert();
}
