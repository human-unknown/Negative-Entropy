ALTER TABLE `debate_topic`
  ADD COLUMN `template_id` INT UNSIGNED DEFAULT NULL COMMENT '关联的辩论模板ID（NULL=自由辩论）',
  ADD COLUMN `current_round` TINYINT UNSIGNED DEFAULT 0 COMMENT '当前进行到的轮次序号（0=未开始）',
  ADD KEY `idx_template` (`template_id`);
