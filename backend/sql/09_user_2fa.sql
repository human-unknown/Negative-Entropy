-- 为user表添加双重认证字段
ALTER TABLE `user` ADD COLUMN `two_factor_enabled` TINYINT NOT NULL DEFAULT 0 COMMENT '双重认证：0-关闭 1-开启' AFTER `status`;
