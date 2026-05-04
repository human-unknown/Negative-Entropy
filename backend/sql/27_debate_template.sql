CREATE TABLE `debate_template` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `name` VARCHAR(100) NOT NULL COMMENT '模板名称，如"1v1 标准赛"',
  `type` VARCHAR(50) NOT NULL COMMENT '模板标识，如 standard_1v1',
  `description` VARCHAR(500) DEFAULT '' COMMENT '模板简要说明',
  `config` JSON NOT NULL COMMENT '轮次配置 + 评分标准 JSON',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否可用',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='辩论模板';

INSERT INTO `debate_template` (`name`, `type`, `description`, `config`) VALUES
(
  '1v1 标准赛',
  'standard_1v1',
  '正反各1人，7轮次限时发言，观众评分。适合深度辩论。',
  '{"rounds":[{"order":1,"name":"正方立论","speaker":"pro","durationSec":300,"description":"正方陈述核心论点"},{"order":2,"name":"反方立论","speaker":"con","durationSec":300,"description":"反方陈述核心论点"},{"order":3,"name":"正方反驳","speaker":"pro","durationSec":240,"description":"正方反驳反方论点"},{"order":4,"name":"反方反驳","speaker":"con","durationSec":240,"description":"反方反驳正方论点"},{"order":5,"name":"自由辩论","speaker":"pro","durationSec":180,"description":"双方交替发言，正方先开始"},{"order":6,"name":"反方结辩","speaker":"con","durationSec":180,"description":"反方总结陈词"},{"order":7,"name":"正方结辩","speaker":"pro","durationSec":180,"description":"正方总结陈词"}],"scoring":{"criteria":[{"key":"argument","name":"论点说服力","description":"论点是否清晰、有逻辑、有说服力"},{"key":"evidence","name":"论证质量","description":"论据是否充分、可靠、相关"},{"key":"rebuttal","name":"反驳力度","description":"是否有效回应对方论证，发现逻辑漏洞"},{"key":"expression","name":"表达清晰度","description":"语言表达是否流畅、有条理、有感染力"}],"maxScorePerCriterion":10,"minScorePerCriterion":1}}'
);
