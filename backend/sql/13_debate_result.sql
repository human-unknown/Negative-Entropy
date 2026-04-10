CREATE TABLE `debate_result` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '结果ID',
  `topic_id` BIGINT UNSIGNED NOT NULL COMMENT '话题ID',
  `pro_votes` INT NOT NULL DEFAULT 0 COMMENT '正方票数',
  `con_votes` INT NOT NULL DEFAULT 0 COMMENT '反方票数',
  `winner` TINYINT COMMENT '获胜方：1-正方 2-反方 NULL-平票待评审',
  `summary` TEXT COMMENT '总结',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '结算时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_topic_id` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论结果表';
