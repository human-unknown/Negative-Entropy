CREATE TABLE `debate_speech` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '发言ID',
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '话题ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `role` TINYINT NOT NULL COMMENT '角色：1-辩手 2-观众',
  `content` TEXT NOT NULL COMMENT '发言内容',
  `stance` TINYINT NOT NULL COMMENT '立场：1-正方 2-反方',
  `word_count` INT NOT NULL COMMENT '字数',
  `audit_status` TINYINT NOT NULL DEFAULT 0 COMMENT '审核状态：0-待审核 1-通过 2-未通过',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_topic_id` (`topic_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_audit_status` (`audit_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论发言表';
