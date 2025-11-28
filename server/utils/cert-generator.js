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
 * Reality 使用 X25519 密钥，需要 URL-safe Base64 编码（无填充）
 */
export function generateRealityKeyPair() {
  try {
    // 使用 openssl 生成 x25519 密钥对
    const privateKeyRaw = execSync(
      'openssl genpkey -algorithm X25519 | openssl pkey -outform DER | tail -c 32 | base64 | tr -d "\\n"'
    ).toString().trim();

    const publicKeyRaw = execSync(
      `echo "${privateKeyRaw}" | base64 -d | openssl pkey -inform DER -pubout -outform DER | tail -c 32 | base64 | tr -d "\\n"`
    ).toString().trim();

    // 转换为 URL-safe Base64（无填充）
    const toUrlSafeBase64 = (str) => str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return {
      publicKey: toUrlSafeBase64(publicKeyRaw),
      privateKey: toUrlSafeBase64(privateKeyRaw)
    };
  } catch (error) {
    console.error('❌ Reality 密钥生成失败，使用 sing-box generate 方法...');

    try {
      // 尝试使用 sing-box generate reality-keypair
      const output = execSync('sing-box generate reality-keypair 2>/dev/null || docker run --rm ghcr.io/sagernet/sing-box generate reality-keypair')
        .toString().trim();

      const privateMatch = output.match(/PrivateKey:\s*(\S+)/);
      const publicMatch = output.match(/PublicKey:\s*(\S+)/);

      if (privateMatch && publicMatch) {
        return {
          publicKey: publicMatch[1],
          privateKey: privateMatch[1]
        };
      }
    } catch (e) {
      console.error('❌ sing-box generate 也失败，使用 crypto 模块...');
    }

    // 最后备用：使用 Node.js crypto 模块生成 X25519 密钥
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');

    const privBytes = privateKey.export({ type: 'pkcs8', format: 'der' }).slice(-32);
    const pubBytes = publicKey.export({ type: 'spki', format: 'der' }).slice(-32);

    const toUrlSafeBase64Buf = (buf) => buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    return {
      publicKey: toUrlSafeBase64Buf(pubBytes),
      privateKey: toUrlSafeBase64Buf(privBytes)
    };
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
