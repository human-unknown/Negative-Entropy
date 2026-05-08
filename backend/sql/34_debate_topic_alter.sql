-- 34_debate_topic_alter.sql
-- debate_topic 新增 post_id 关联，支持帖子衍生辩论

ALTER TABLE debate_topic
  ADD COLUMN post_id BIGINT UNSIGNED NULL AFTER id,
  ADD INDEX idx_post (post_id),
  ADD FOREIGN KEY fk_debate_post (post_id) REFERENCES post(id) ON DELETE SET NULL;
