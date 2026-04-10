CREATE TABLE rule_debate_result (
  id INT PRIMARY KEY AUTO_INCREMENT,
  debate_id INT NOT NULL COMMENT '辩论ID',
  final_decision ENUM('approved', 'rejected') NOT NULL COMMENT '最终决定',
  support_weight DECIMAL(10,2) NOT NULL COMMENT '支持方总权重',
  oppose_weight DECIMAL(10,2) NOT NULL COMMENT '反对方总权重',
  admin_decision ENUM('approved', 'rejected') NOT NULL COMMENT '管理员决定',
  conclusion TEXT NOT NULL COMMENT '最终结论',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '判定时间',
  UNIQUE KEY uk_debate (debate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则辩论判定结果表';
