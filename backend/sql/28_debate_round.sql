CREATE TABLE `debate_round` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '轮次ID',
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '关联辩论话题',
  `round_order` TINYINT UNSIGNED NOT NULL COMMENT '轮次序号（从1开始）',
  `round_name` VARCHAR(100) NOT NULL COMMENT '轮次名称',
  `status` ENUM('pending', 'active', 'completed', 'skipped') NOT NULL DEFAULT 'pending' COMMENT '轮次状态',
  `speaker_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '实际发言者ID（超时跳过时为NULL）',
  `content` TEXT DEFAULT NULL COMMENT '发言内容',
  `duration_sec` INT UNSIGNED NOT NULL COMMENT '本轮的限定时间（秒）',
  `used_sec` INT UNSIGNED DEFAULT NULL COMMENT '实际用时（秒）',
  `word_count` INT UNSIGNED DEFAULT NULL COMMENT '字数',
  `sources_count` INT UNSIGNED DEFAULT 0 COMMENT '来源引用数',
  `started_at` DATETIME DEFAULT NULL COMMENT '开始时间',
  `completed_at` DATETIME DEFAULT NULL COMMENT '完成时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (`id`),
  INDEX `idx_round_topic` (`topic_id`),
  INDEX `idx_round_status` (`status`),
  CONSTRAINT `fk_round_topic` FOREIGN KEY (`topic_id`) REFERENCES `debate_topic` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='结构化辩论轮次表';
