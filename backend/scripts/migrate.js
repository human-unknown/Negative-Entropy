/**
 * 数据库迁移脚本 — 按编号顺序执行未运行的 SQL 文件
 *
 * 用法:
 *   node scripts/migrate.js          # 执行所有待迁移文件
 *   node scripts/migrate.js --dry-run # 仅列出待执行的迁移
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'
import pool from '../src/config/database.js'
import logger from '../src/utils/logger.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SQL_DIR = path.resolve(__dirname, '../sql')
const DRY_RUN = process.argv.includes('--dry-run')

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex')
}

/** 获取 SQL 目录下所有 .sql 文件（排除非迁移文件） */
function getMigrationFiles() {
  return fs
    .readdirSync(SQL_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort() // 按文件名排序 = 按编号排序
}

/** 查询已执行的迁移 */
async function getExecutedMigrations(conn) {
  try {
    const [rows] = await conn.query(
      'SELECT filename, checksum, success FROM migration_log ORDER BY id',
    )
    return rows
  } catch {
    // migration_log 表可能还没创建
    return []
  }
}

/** 执行单个 SQL 文件 */
async function executeMigration(conn, filename) {
  const filepath = path.join(SQL_DIR, filename)
  const sql = fs.readFileSync(filepath, 'utf-8')
  const checksum = sha256(sql)

  // 检查是否已执行
  const [existing] = await conn.query(
    'SELECT checksum, success FROM migration_log WHERE filename = ?',
    [filename],
  )

  if (existing.length > 0) {
    const row = existing[0]
    if (!row.success) {
      logger.warn({ filename }, '上次迁移失败，重试执行')
    } else if (row.checksum !== checksum) {
      logger.warn(
        { filename },
        '⚠️  已执行的迁移文件内容已变更！请手动检查。',
      )
      return 'SKIPPED (changed)'
    } else {
      return 'SKIPPED (already done)'
    }
  }

  if (DRY_RUN) {
    return 'PENDING'
  }

  // 执行 SQL
  try {
    await conn.query(sql)
    await conn.query(
      'INSERT INTO migration_log (filename, checksum, success) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE checksum = ?, success = 1',
      [filename, checksum, checksum],
    )
    return 'OK'
  } catch (err) {
    await conn.query(
      'INSERT INTO migration_log (filename, checksum, success, error_message) VALUES (?, ?, 0, ?) ON DUPLICATE KEY UPDATE success = 0, error_message = ?',
      [filename, checksum, err.message, err.message],
    )
    throw err
  }
}

async function main() {
  const files = getMigrationFiles()
  const conn = await pool.getConnection()

  try {
    // 确保 migration_log 表存在（先执行 tracker SQL）
    const trackerPath = path.join(SQL_DIR, '00_migration_tracker.sql')
    if (fs.existsSync(trackerPath)) {
      const trackerSql = fs.readFileSync(trackerPath, 'utf-8')
      await conn.query(trackerSql)
    }

    const executed = await getExecutedMigrations(conn)
    const executedNames = new Set(executed.map((r) => r.filename))

    logger.info({ total: files.length, executed: executed.length }, '数据库迁移')
    if (DRY_RUN) {
      logger.info('--- DRY RUN 模式，不会实际执行 ---')
    }

    let okCount = 0
    let skipCount = 0
    let failCount = 0

    for (const file of files) {
      try {
        const result = await executeMigration(conn, file)
        if (result === 'OK') {
          logger.info({ file }, '✓ 迁移完成')
          okCount++
        } else {
          skipCount++
        }
      } catch (err) {
        logger.error({ file, err: err.message }, '✗ 迁移失败')
        failCount++
      }
    }

    logger.info(
      { ok: okCount, skipped: skipCount, failed: failCount },
      '迁移执行完毕',
    )

    if (failCount > 0) {
      process.exit(1)
    }
  } finally {
    conn.release()
    await pool.end()
  }
}

main().catch((err) => {
  logger.fatal({ err }, '迁移脚本异常退出')
  process.exit(1)
})
