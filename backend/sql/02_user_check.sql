CREATE TABLE `user_check` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '审核记录ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `logic_score` DECIMAL(5,2) DEFAULT NULL COMMENT '逻辑测试分数',
  `debate_score` DECIMAL(5,2) DEFAULT NULL COMMENT 'AI辩论评分',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '审核状态：0-待审核 1-通过 2-未通过',
  `retry_count` INT NOT NULL DEFAULT 0 COMMENT '重试次数',
  `limit_until` DATETIME DEFAULT NULL COMMENT '限制时间（禁止重试截止时间）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户入站审核记录表';
