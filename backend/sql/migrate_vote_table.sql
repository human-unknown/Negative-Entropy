-- 投票表结构迁移脚本
-- 添加 user_id 和 weight 字段

-- 备份现有数据
CREATE TABLE IF NOT EXISTS debate_vote_backup AS SELECT * FROM debate_vote;

-- 删除旧表
DROP TABLE IF EXISTS debate_vote;

-- 创建新表
CREATE TABLE `debate_vote` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '投票ID',
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '话题ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `stance` TINYINT NOT NULL COMMENT '投票立场：1-正方 2-反方',
  `weight` DECIMAL(3,1) NOT NULL DEFAULT 1.0 COMMENT '投票权重（基于用户等级）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_topic_id` (`topic_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论投票记录表';

-- 如果需要恢复数据（需要手动调整）
-- INSERT INTO debate_vote (topic_id, user_id, stance, weight, created_at)
-- SELECT topic_id, 0, stance, 1.0, created_at FROM debate_vote_backup;
