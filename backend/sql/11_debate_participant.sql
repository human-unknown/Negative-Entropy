CREATE TABLE `debate_participant` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '参与ID',
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '话题ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `stance` TINYINT NOT NULL COMMENT '立场：1-正方 2-反方',
  `joined_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_topic_user` (`topic_id`, `user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论参与者表';
