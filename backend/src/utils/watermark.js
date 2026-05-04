import crypto from 'crypto'

/**
 * 隐形水印工具类
 * 用于在内容中嵌入不可见的用户标识，用于溯源追踪
 */
class WatermarkService {
  /**
   * 生成用户唯一水印标识
   * @param {number} userId - 用户ID
   * @param {number} contentId - 内容ID
   * @param {number} timestamp - 时间戳
   * @returns {string} 水印标识
   */
  generateWatermarkId(userId, contentId, timestamp = Date.now()) {
    const data = `${userId}-${contentId}-${timestamp}`
    return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16)
  }

  /**
   * 在文本中嵌入隐形水印
   * 使用零宽字符（Zero-Width Characters）技术
   * @param {string} content - 原始内容
   * @param {number} userId - 用户ID
   * @param {number} contentId - 内容ID
   * @returns {string} 带水印的内容
   */
  embedWatermark(content, userId, contentId) {
    if (!content || content.trim().length === 0) {
      return content
    }

    const watermarkId = this.generateWatermarkId(userId, contentId)
    const watermarkBinary = this.textToBinary(watermarkId)
    const zeroWidthWatermark = this.binaryToZeroWidth(watermarkBinary)

    // 在内容的多个位置插入水印，增加鲁棒性
    const positions = this.calculateInsertPositions(content.length, 3)
    let watermarkedContent = content

    // 从后往前插入，避免位置偏移
    for (let i = positions.length - 1; i >= 0; i--) {
      const pos = positions[i]
      watermarkedContent = 
        watermarkedContent.slice(0, pos) + 
        zeroWidthWatermark + 
        watermarkedContent.slice(pos)
    }

    return watermarkedContent
  }

  /**
   * 从文本中提取隐形水印
   * @param {string} content - 带水印的内容
   * @returns {string|null} 水印标识，如果未找到返回null
   */
  extractWatermark(content) {
    if (!content) {
      return null
    }

    // 提取所有零宽字符
    // 注意: 不使用字符类以避免 no-misleading-character-class 误报
    const zeroWidthChars = content.match(/\u200B|\u200C|\u200D|\uFEFF/g)
    
    if (!zeroWidthChars || zeroWidthChars.length === 0) {
      return null
    }

    try {
      const binary = this.zeroWidthToBinary(zeroWidthChars.join(''))
      const watermarkId = this.binaryToText(binary)
      return watermarkId
    } catch (error) {
      console.error('提取水印失败:', error)
      return null
    }
  }

  /**
   * 移除内容中的水印（用于显示纯净内容）
   * @param {string} content - 带水印的内容
   * @returns {string} 无水印的内容
   */
  removeWatermark(content) {
    if (!content) {
      return content
    }

    // 移除所有零宽字符
    return content.replace(/\u200B|\u200C|\u200D|\uFEFF/g, '')
  }

  /**
   * 验证水印是否属于指定用户
   * @param {string} content - 带水印的内容
   * @param {number} userId - 用户ID
   * @param {number} contentId - 内容ID
   * @returns {boolean} 是否匹配
   */
  verifyWatermark(content, userId, contentId) {
    const extractedId = this.extractWatermark(content)
    if (!extractedId) {
      return false
    }

    const expectedId = this.generateWatermarkId(userId, contentId)
    return extractedId === expectedId
  }

  /**
   * 文本转二进制
   * @private
   */
  textToBinary(text) {
    return text.split('').map(char => {
      return char.charCodeAt(0).toString(2).padStart(8, '0')
    }).join('')
  }

  /**
   * 二进制转文本
   * @private
   */
  binaryToText(binary) {
    const chars = binary.match(/.{8}/g) || []
    return chars.map(byte => String.fromCharCode(parseInt(byte, 2))).join('')
  }

  /**
   * 二进制转零宽字符
   * 使用4种零宽字符编码：
   * 00 -> U+200B (零宽空格)
   * 01 -> U+200C (零宽非连接符)
   * 10 -> U+200D (零宽连接符)
   * 11 -> U+FEFF (零宽非断空格)
   * @private
   */
  binaryToZeroWidth(binary) {
    const zeroWidthChars = {
      '00': '\u200B',
      '01': '\u200C',
      '10': '\u200D',
      '11': '\uFEFF'
    }

    const pairs = binary.match(/.{2}/g) || []
    return pairs.map(pair => zeroWidthChars[pair] || '').join('')
  }

  /**
   * 零宽字符转二进制
   * @private
   */
  zeroWidthToBinary(zeroWidthStr) {
    const charToBinary = {
      '\u200B': '00',
      '\u200C': '01',
      '\u200D': '10',
      '\uFEFF': '11'
    }

    return zeroWidthStr.split('').map(char => charToBinary[char] || '').join('')
  }

  /**
   * 计算水印插入位置
   * @private
   */
  calculateInsertPositions(contentLength, count = 3) {
    if (contentLength < count) {
      return [Math.floor(contentLength / 2)]
    }

    const positions = []
    const step = Math.floor(contentLength / (count + 1))

    for (let i = 1; i <= count; i++) {
      positions.push(step * i)
    }

    return positions
  }

  /**
   * 记录水印到数据库（用于追踪）
   * @param {Object} db - 数据库连接
   * @param {Object} data - 水印数据
   */
  async logWatermark(db, { userId, contentId, contentType, watermarkId }) {
    await db.query(
      `INSERT INTO content_watermark_log 
       (user_id, content_id, content_type, watermark_id, created_at)
       VALUES (?, ?, ?, ?, NOW())`,
      [userId, contentId, contentType, watermarkId]
    )
  }

  /**
   * 根据水印ID查找来源
   * @param {Object} db - 数据库连接
   * @param {string} watermarkId - 水印标识
   * @returns {Object|null} 水印记录
   */
  async traceWatermark(db, watermarkId) {
    const [rows] = await db.query(
      `SELECT 
        cwl.*,
        u.username,
        u.email
       FROM content_watermark_log cwl
       LEFT JOIN user u ON cwl.user_id = u.id
       WHERE cwl.watermark_id = ?
       LIMIT 1`,
      [watermarkId]
    )

    return rows.length > 0 ? rows[0] : null
  }
}

// 创建单例
const watermarkService = new WatermarkService()

export default watermarkService
export { WatermarkService }
