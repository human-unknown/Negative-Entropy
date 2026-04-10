import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'debate_platform',
  backupDir: './backups',
  maxBackups: 7
}

const backup = async () => {
  try {
    await fs.mkdir(config.backupDir, { recursive: true })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const filename = `${config.database}_${timestamp}.sql`
    const filepath = path.join(config.backupDir, filename)

    const command = `mysqldump -h ${config.host} -u ${config.user} ${config.password ? `-p${config.password}` : ''} ${config.database} > ${filepath}`

    await execAsync(command)
    console.log(`✓ 备份成功: ${filename}`)

    await cleanOldBackups()
  } catch (error) {
    console.error('✗ 备份失败:', error.message)
    throw error
  }
}

const cleanOldBackups = async () => {
  try {
    const files = await fs.readdir(config.backupDir)
    const backups = files
      .filter(f => f.endsWith('.sql'))
      .map(f => ({ name: f, path: path.join(config.backupDir, f) }))
      .sort((a, b) => b.name.localeCompare(a.name))

    if (backups.length > config.maxBackups) {
      for (let i = config.maxBackups; i < backups.length; i++) {
        await fs.unlink(backups[i].path)
        console.log(`✓ 删除旧备份: ${backups[i].name}`)
      }
    }
  } catch (error) {
    console.error('✗ 清理旧备份失败:', error.message)
  }
}

backup()
