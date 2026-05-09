CREATE TABLE rule_debate_vote (
  id INT PRIMARY KEY AUTO_INCREMENT,
  debate_id INT NOT NULL COMMENT '辩论ID',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  vote ENUM('support', 'oppose') NOT NULL COMMENT '投票：support-支持 oppose-反对',
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00 COMMENT '投票权重',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '投票时间',
  UNIQUE KEY uk_debate_user (debate_id, user_id),
  INDEX idx_debate (debate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则辩论投票表';
