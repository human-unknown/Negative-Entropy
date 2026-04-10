CREATE TABLE `debate_topic` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '话题ID',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `description` TEXT NOT NULL COMMENT '描述',
  `category` VARCHAR(50) NOT NULL COMMENT '分类',
  `publisher_id` BIGINT UNSIGNED NOT NULL COMMENT '发布人ID',
  `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态：0-未开始 1-进行中 2-已结束',
  `audit_status` TINYINT NOT NULL DEFAULT 0 COMMENT '审核状态：0-待审核 1-通过 2-未通过',
  `pro_limit` INT NOT NULL DEFAULT 5 COMMENT '正方人数上限',
  `con_limit` INT NOT NULL DEFAULT 5 COMMENT '反方人数上限',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_publisher_id` (`publisher_id`),
  KEY `idx_status` (`status`),
  KEY `idx_audit_status` (`audit_status`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论话题表';
