CREATE TABLE `debate_round` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '轮次ID',
  `topic_id` INT UNSIGNED NOT NULL COMMENT '关联辩论话题',
  `round_order` TINYINT UNSIGNED NOT NULL COMMENT '轮次序号（从1开始）',
  `round_name` VARCHAR(100) NOT NULL COMMENT '轮次名称',
  `speaker_stance` TINYINT NOT NULL COMMENT '应该谁发言：1=正方, 0=反方',
  `speaker_id` INT UNSIGNED DEFAULT NULL COMMENT '实际发言者ID（超时跳过时为NULL）',
  `content` TEXT DEFAULT NULL COMMENT '本轮发言内容',
  `duration_sec` INT UNSIGNED NOT NULL COMMENT '本轮的限定时间（秒）',
  `used_sec` INT UNSIGNED DEFAULT NULL COMMENT '实际用时（秒）',
  `status` ENUM('waiting','active','completed','timeout','skipped') NOT NULL DEFAULT 'waiting' COMMENT '轮次状态',
  `started_at` TIMESTAMP NULL DEFAULT NULL COMMENT '本轮开始时间',
  `ended_at` TIMESTAMP NULL DEFAULT NULL COMMENT '本轮结束时间',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_topic_round` (`topic_id`, `round_order`),
  KEY `idx_speaker` (`speaker_id`),
  CONSTRAINT `fk_round_topic` FOREIGN KEY (`topic_id`) REFERENCES `debate_topic` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论轮次记录';
