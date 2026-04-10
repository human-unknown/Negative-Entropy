CREATE TABLE `user_violation` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '违规ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `type` TINYINT NOT NULL COMMENT '违规类型：1-辱骂 2-广告 3-其他',
  `content` TEXT NOT NULL COMMENT '违规内容',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户违规记录表';
