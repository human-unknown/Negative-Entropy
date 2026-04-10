CREATE TABLE `report` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '举报ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '举报人ID',
  `target_type` VARCHAR(20) NOT NULL COMMENT '目标类型：user/speech/topic',
  `target_id` BIGINT UNSIGNED NOT NULL COMMENT '目标ID',
  `type` VARCHAR(50) NOT NULL COMMENT '举报类型',
  `reason` TEXT NOT NULL COMMENT '举报理由',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-待审核 1-已处理 2-已驳回',
  `reviewer_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '审核人ID',
  `review_result` TEXT DEFAULT NULL COMMENT '审核结果',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `reviewed_at` DATETIME DEFAULT NULL COMMENT '审核时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target` (`target_type`, `target_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='举报表';
