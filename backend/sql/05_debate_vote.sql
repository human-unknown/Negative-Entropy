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
