CREATE TABLE `debate_audit_log` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '日志ID',
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '话题ID',
  `auditor_id` BIGINT UNSIGNED NOT NULL COMMENT '审核人ID',
  `audit_status` TINYINT NOT NULL COMMENT '审核结果：1-通过 2-驳回',
  `reason` VARCHAR(500) COMMENT '驳回原因',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '审核时间',
  PRIMARY KEY (`id`),
  KEY `idx_topic_id` (`topic_id`),
  KEY `idx_auditor_id` (`auditor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='话题审核日志表';
