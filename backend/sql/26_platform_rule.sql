CREATE TABLE `platform_rule` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '规则ID',
  `title` VARCHAR(255) NOT NULL COMMENT '规则标题',
  `content` TEXT NOT NULL COMMENT '规则内容',
  `version` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '当前版本号',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '最后更新时间',
  `is_deleted` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '软删除标记',
  PRIMARY KEY (`id`),
  INDEX `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='平台规则表';

-- 初始数据（对应原内存存储的 3 条默认规则）
INSERT INTO `platform_rule` (`id`, `title`, `content`, `version`, `created_at`)
VALUES
  (1, '辩论发言规则', '每位辩手单次发言字数10-500字，发言间隔60秒', 2, NOW()),
  (2, '投票权重规则', '普通用户权重1.0，进阶用户1.0，资深用户1.5，管理员2.0', 1, NOW()),
  (3, '用户等级规则', '入门(1)、进阶(2)、资深(3)、管理员(4)，通过逻辑测试和辩论考核可升级', 3, NOW());
