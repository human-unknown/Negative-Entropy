CREATE TABLE rule_debate_participant (
  id INT PRIMARY KEY AUTO_INCREMENT,
  debate_id INT NOT NULL COMMENT '辩论ID',
  user_id INT NOT NULL COMMENT '用户ID',
  stance ENUM('support', 'oppose') NOT NULL COMMENT '立场：support-支持 oppose-反对',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '参与时间',
  UNIQUE KEY uk_debate_user (debate_id, user_id),
  INDEX idx_debate (debate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则辩论参与记录表';
