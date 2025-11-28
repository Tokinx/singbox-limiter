import Database from 'better-sqlite3';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = process.env.DB_PATH || join(__dirname, '../../data/singbox.db');
const dbDir = dirname(dbPath);

// 确保数据目录存在
if (!existsSync(dbDir)) {
  mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// 初始化数据库表结构
export function initDatabase() {
  // 客户端表
  db.exec(`
    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT,
      uuid TEXT UNIQUE NOT NULL,
      flow TEXT DEFAULT 'xtls-rprx-vision',
      limit_bytes INTEGER DEFAULT -1,
      used_bytes INTEGER DEFAULT 0,
      reset_interval TEXT DEFAULT 'monthly',
      reset_day INTEGER DEFAULT 1,
      last_reset_date TEXT,
      expiry_date TEXT,
      active INTEGER DEFAULT 1,
      server_ip TEXT NOT NULL,
      reality_port INTEGER DEFAULT 443,
      hysteria_port INTEGER DEFAULT 8443,
      sni TEXT DEFAULT 'music.apple.com',
      public_key TEXT NOT NULL,
      private_key TEXT NOT NULL,
      short_id TEXT NOT NULL,
      container_name TEXT UNIQUE,
      share_token TEXT UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 流量历史记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS traffic_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL,
      upload_bytes INTEGER DEFAULT 0,
      download_bytes INTEGER DEFAULT 0,
      total_bytes INTEGER DEFAULT 0,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
    )
  `);

  // 流量历史索引
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_traffic_client_time
    ON traffic_history(client_id, timestamp DESC)
  `);

  // 系统设置表
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 审计日志表
  db.exec(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE SET NULL
    )
  `);

  console.log('✅ 数据库初始化完成');
}

// 获取所有客户端
export function getAllClients() {
  const stmt = db.prepare('SELECT * FROM clients ORDER BY created_at DESC');
  return stmt.all();
}

// 根据 ID 获取客户端
export function getClientById(id) {
  const stmt = db.prepare('SELECT * FROM clients WHERE id = ?');
  return stmt.get(id);
}

// 根据 share_token 获取客户端
export function getClientByShareToken(token) {
  const stmt = db.prepare('SELECT * FROM clients WHERE share_token = ?');
  return stmt.get(token);
}

// 创建客户端
export function createClient(client) {
  const stmt = db.prepare(`
    INSERT INTO clients (
      id, name, email, uuid, flow, limit_bytes, reset_interval,
      reset_day, expiry_date, server_ip, reality_port, hysteria_port,
      sni, public_key, private_key, short_id, container_name, share_token
    ) VALUES (
      @id, @name, @email, @uuid, @flow, @limit_bytes, @reset_interval,
      @reset_day, @expiry_date, @server_ip, @reality_port, @hysteria_port,
      @sni, @public_key, @private_key, @short_id, @container_name, @share_token
    )
  `);

  return stmt.run(client);
}

// 更新客户端
export function updateClient(id, updates) {
  const fields = Object.keys(updates)
    .filter(key => updates[key] !== undefined)
    .map(key => `${key} = @${key}`)
    .join(', ');

  if (!fields) return { changes: 0 };

  const stmt = db.prepare(`
    UPDATE clients
    SET ${fields}, updated_at = CURRENT_TIMESTAMP
    WHERE id = @id
  `);

  return stmt.run({ id, ...updates });
}

// 删除客户端
export function deleteClient(id) {
  const stmt = db.prepare('DELETE FROM clients WHERE id = ?');
  return stmt.run(id);
}

// 更新客户端流量使用
export function updateClientTraffic(clientId, uploadBytes, downloadBytes) {
  const totalBytes = uploadBytes + downloadBytes;

  // 更新客户端总流量
  const updateStmt = db.prepare(`
    UPDATE clients
    SET used_bytes = used_bytes + ?
    WHERE id = ?
  `);
  updateStmt.run(totalBytes, clientId);

  // 插入流量历史记录
  const insertStmt = db.prepare(`
    INSERT INTO traffic_history (client_id, upload_bytes, download_bytes, total_bytes)
    VALUES (?, ?, ?, ?)
  `);
  insertStmt.run(clientId, uploadBytes, downloadBytes, totalBytes);
}

// 获取客户端流量历史（最近 N 小时）
export function getClientTrafficHistory(clientId, hours = 24) {
  const stmt = db.prepare(`
    SELECT
      upload_bytes,
      download_bytes,
      total_bytes,
      timestamp
    FROM traffic_history
    WHERE client_id = ?
      AND datetime(timestamp) >= datetime('now', '-' || ? || ' hours')
    ORDER BY timestamp ASC
  `);

  return stmt.all(clientId, hours);
}

// 重置客户端流量
export function resetClientTraffic(clientId) {
  const stmt = db.prepare(`
    UPDATE clients
    SET used_bytes = 0, last_reset_date = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
  return stmt.run(clientId);
}

// 检查需要重置流量的客户端
export function getClientsNeedingReset() {
  const stmt = db.prepare(`
    SELECT * FROM clients
    WHERE reset_interval = 'monthly'
      AND (
        last_reset_date IS NULL
        OR (
          CAST(strftime('%d', 'now') AS INTEGER) = reset_day
          AND date(last_reset_date) < date('now')
        )
      )
  `);
  return stmt.all();
}

// 检查过期的客户端
export function getExpiredClients() {
  const stmt = db.prepare(`
    SELECT * FROM clients
    WHERE expiry_date IS NOT NULL
      AND datetime(expiry_date) < datetime('now')
      AND active = 1
  `);
  return stmt.all();
}

// 检查流量超限的客户端
export function getOverLimitClients() {
  const stmt = db.prepare(`
    SELECT * FROM clients
    WHERE limit_bytes > 0
      AND used_bytes >= limit_bytes
      AND active = 1
  `);
  return stmt.all();
}

// 添加审计日志
export function addAuditLog(clientId, action, details) {
  const stmt = db.prepare(`
    INSERT INTO audit_logs (client_id, action, details)
    VALUES (?, ?, ?)
  `);
  return stmt.run(clientId, action, details);
}

// 获取设置
export function getSetting(key) {
  const stmt = db.prepare('SELECT value FROM settings WHERE key = ?');
  const result = stmt.get(key);
  return result ? result.value : null;
}

// 设置设置
export function setSetting(key, value) {
  const stmt = db.prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(key, value, value);
}

export default db;
