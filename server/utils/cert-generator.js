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
 * 使用 sing-box 官方推荐方式生成
 */
export function generateRealityKeyPair() {
  try {
    // 使用 sing-box generate reality-keypair（通过 Docker）
    const output = execSync(
      'docker run --rm ghcr.io/sagernet/sing-box generate reality-keypair',
      { encoding: 'utf-8', timeout: 30000 }
    ).trim();

    const privateMatch = output.match(/PrivateKey:\s*(\S+)/);
    const publicMatch = output.match(/PublicKey:\s*(\S+)/);

    if (privateMatch && publicMatch) {
      console.log('✅ Reality 密钥生成成功 (sing-box)');
      return {
        publicKey: publicMatch[1],
        privateKey: privateMatch[1]
      };
    }

    throw new Error('无法解析 sing-box 输出');
  } catch (error) {
    console.error('❌ sing-box 密钥生成失败:', error.message);
    console.error('请确保 Docker 已安装并运行');
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
