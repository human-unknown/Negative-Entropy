CREATE TABLE `appeal` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '申诉ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `punish_id` BIGINT UNSIGNED NOT NULL COMMENT '处罚ID',
  `reason` TEXT NOT NULL COMMENT '申诉理由',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-待审核 1-通过 2-驳回',
  `reviewer_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '审核人ID',
  `review_result` TEXT DEFAULT NULL COMMENT '审核结果',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `reviewed_at` DATETIME DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_punish_id` (`punish_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='申诉表';
