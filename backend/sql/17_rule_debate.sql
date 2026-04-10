CREATE TABLE rule_debate (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT '标题',
  modify_content TEXT NOT NULL COMMENT '修改内容',
  current_status TEXT NOT NULL COMMENT '现状',
  initiator_id INT NOT NULL COMMENT '发起人(管理员)',
  status ENUM('pending', 'ongoing', 'approved', 'rejected') DEFAULT 'pending' COMMENT '状态',
  duration INT NOT NULL COMMENT '辩论时长(小时)',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_initiator (initiator_id),
  INDEX idx_status (status),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='规则辩论表';
