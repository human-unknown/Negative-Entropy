/**
 * 旧辩论数据 → 帖子自动生成脚本
 *
 * 用法：node backend/scripts/migrate-debates-to-posts.js [--dry-run]
 *
 * 逻辑：
 * 1. 扫描所有 audit_status=1（审核通过）的 debate_topic
 * 2. 为每个辩论生成对应 post 记录
 * 3. 默认频道归入"综合"
 * 4. 双向关联：post.debate_id ↔ debate_topic.post_id
 * 5. --dry-run 只打印不执行
 */

import mysql from 'mysql2/promise'
import dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../.env') })

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'debate_platform',
}

const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}开始迁移旧辩论数据到帖子表...\n`)

  const pool = mysql.createPool(DB_CONFIG)

  try {
    // 1. 获取"综合"频道ID（默认归入频道）
    const [channels] = await pool.query(
      "SELECT id, slug FROM channel WHERE slug = 'general'"
    )
    if (!channels.length) {
      console.error('❌ 未找到"综合"频道，请先运行 SQL 迁移 33_channel.sql')
      process.exit(1)
    }
    const generalChannelId = channels[0].id

    // 2. 扫描审核通过的辩论
    const [debates] = await pool.query(
      'SELECT id, title, description, publisher_id, category, created_at, audit_status FROM debate_topic WHERE audit_status = 1 ORDER BY id'
    )

    console.log(`找到 ${debates.length} 个审核通过的辩论话题\n`)

    if (DRY_RUN) {
      for (const d of debates) {
        console.log(`  [DRY RUN] 辩论 #${d.id}: "${d.title}" → 将创建帖子，频道=综合`)
      }
      console.log(`\n[DRY RUN] 共 ${debates.length} 条，未执行实际写入`)
      process.exit(0)
    }

    // 3. 逐条创建帖子
    let created = 0
    let skipped = 0
    let errors = 0

    for (const d of debates) {
      try {
        // 检查是否已有帖子关联
        const [existing] = await pool.query(
          'SELECT id FROM post WHERE debate_id = ?',
          [d.id]
        )
        if (existing.length) {
          console.log(`  ⏭ 辩论 #${d.id} 已有帖子 #${existing[0].id}，跳过`)
          skipped++
          continue
        }

        // 创建帖子
        const [result] = await pool.query(
          `INSERT INTO post (channel_id, author_id, title, content, debate_id, audit_status, created_at)
           VALUES (?, ?, ?, ?, ?, 1, ?)`,
          [
            generalChannelId,
            d.publisher_id,
            d.title,
            d.description,
            d.id,
            d.created_at
          ]
        )

        const postId = result.insertId

        // 回写 debate_topic.post_id
        await pool.query(
          'UPDATE debate_topic SET post_id = ? WHERE id = ?',
          [postId, d.id]
        )

        console.log(`  ✅ 辩论 #${d.id}: "${d.title}" → 帖子 #${postId}`)
        created++
      } catch (err) {
        console.error(`  ❌ 辩论 #${d.id} 失败:`, err.message)
        errors++
      }
    }

    console.log(`\n迁移完成：创建 ${created} / 跳过 ${skipped} / 错误 ${errors}`)
  } catch (err) {
    console.error('迁移失败:', err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
