CREATE TABLE `debate_score` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '评分ID',
  `topic_id` INT UNSIGNED NOT NULL COMMENT '关联辩论话题',
  `voter_id` INT UNSIGNED NOT NULL COMMENT '评分者ID',
  `target_stance` TINYINT NOT NULL COMMENT '评分对象：1=正方, 0=反方',
  `criterion_key` VARCHAR(50) NOT NULL COMMENT '评分项标识（对应模板 scoring.criteria[].key）',
  `score` TINYINT UNSIGNED NOT NULL COMMENT '得分（1-10）',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_vote` (`topic_id`, `voter_id`, `target_stance`, `criterion_key`),
  KEY `idx_topic` (`topic_id`),
  KEY `idx_voter` (`voter_id`),
  CONSTRAINT `fk_score_topic` FOREIGN KEY (`topic_id`) REFERENCES `debate_topic` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论评分记录';
