-- 33_channel.sql
-- 频道表 - 类似贴吧的"吧"

CREATE TABLE IF NOT EXISTS channel (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(50) NOT NULL UNIQUE,
  slug          VARCHAR(50) NOT NULL UNIQUE,
  description   VARCHAR(500) DEFAULT '',
  icon          VARCHAR(10) DEFAULT '📄',
  sort_order    INT NOT NULL DEFAULT 0,
  post_count    INT UNSIGNED NOT NULL DEFAULT 0,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 预置频道
INSERT INTO channel (name, slug, description, icon, sort_order) VALUES
('科技', 'tech', '技术、科学、AI等理性讨论', '🔬', 1),
('哲学', 'philosophy', '形而上学、伦理学、逻辑学、认知科学', '💭', 2),
('经济', 'economics', '市场、政策、行为经济学', '📊', 3),
('社会', 'society', '公共议题、社会现象分析', '🏛️', 4),
('综合', 'general', '无法归类的严肃讨论', '💬', 99);
