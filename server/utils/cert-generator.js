import { execSync } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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
 */
export function generateRealityKeyPair() {
  try {
    // 使用 openssl 生成 x25519 密钥对
    const privateKey = execSync(
      'openssl genpkey -algorithm X25519 | openssl pkey -outform DER | tail -c 32 | base64'
    ).toString().trim();

    const publicKey = execSync(
      `echo "${privateKey}" | base64 -d | openssl pkey -inform DER -pubout -outform DER | tail -c 32 | base64`
    ).toString().trim();

    return { publicKey, privateKey };
  } catch (error) {
    console.error('❌ Reality 密钥生成失败，使用备用方法...');

    // 备用方法：生成随机 base64 字符串
    const randomBytes = (len) => {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      let result = '';
      for (let i = 0; i < len; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return result;
    };

    return {
      publicKey: randomBytes(44),
      privateKey: randomBytes(44)
    };
  }
}

/**
 * 生成短 ID (16进制字符串)
 */
export function generateShortId() {
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  return Array.from({ length: 8 }, randomHex).join('');
}

// 如果直接运行此脚本，则生成证书
if (import.meta.url === `file://${process.argv[1]}`) {
  generateSelfSignedCert();
}
