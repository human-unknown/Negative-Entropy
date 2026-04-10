CREATE TABLE `user_punish` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '处罚ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `violation_id` BIGINT UNSIGNED NOT NULL COMMENT '违规ID',
  `type` TINYINT NOT NULL COMMENT '处罚类型：1-警告 2-禁言 3-封号',
  `duration` INT DEFAULT NULL COMMENT '处罚时长（分钟）',
  `expire_at` DATETIME DEFAULT NULL COMMENT '过期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_violation_id` (`violation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户处罚记录表';
