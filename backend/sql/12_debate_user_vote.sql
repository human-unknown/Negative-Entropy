CREATE TABLE `debate_user_vote` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '话题ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `voted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '投票时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_topic_user` (`topic_id`, `user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户投票记录表（防重复）';
