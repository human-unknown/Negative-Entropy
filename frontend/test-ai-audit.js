// AI审核流程测试脚本
// 使用方法：在浏览器控制台中运行此脚本

const API_BASE = 'http://localhost:5000/api';

// 测试1：AI直接拒绝（包含违禁词）
async function testAIReject() {
  console.log('=== 测试1：AI直接拒绝（包含违禁词） ===');
  
  // 需要先登录获取token
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('请先登录获取token');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/debate/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: '测试话题包含广告',
        description: '这是一个测试描述',
        category: '科技'
      })
    });

    const result = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应数据:', result);
    
    if (result.data && result.data.punished) {
      console.log('✅ 测试通过：已自动处罚');
    } else {
      console.log('❌ 测试失败：未执行自动处罚');
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 测试2：AI待人工复核
async function testManualReview() {
  console.log('=== 测试2：AI待人工复核 ===');
  
  const token = localStorage.getItem('token');
  if (!token) {
    console.error('请先登录获取token');
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/debate/topics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        title: '测试话题联系方式',
        description: '这是一个测试描述',
        category: '科技'
      })
    });

    const result = await response.json();
    console.log('响应状态:', response.status);
    console.log('响应数据:', result);
    
    if (result.data && result.data.needsManualReview) {
      console.log('✅ 测试通过：已进入人工复核队列');
      console.log('话题ID:', result.data.topicId);
    } else {
      console.log('❌ 测试失败：未触发人工复核');
    }
  } catch (error) {
    console.error('请求失败:', error);
  }
}

// 测试3：查看违规记录（需要管理员权限）
async function checkViolations(userId) {
  console.log('=== 查看违规记录 ===');
  console.log('请在数据库中执行以下SQL：');
  console.log(`
SELECT 
  v.id,
  v.type as violation_type,
  v.content,
  v.created_at,
  p.type as punishment_type,
  p.duration,
  p.expire_at
FROM user_violation v
LEFT JOIN user_punish p ON v.id = p.violation_id
WHERE v.user_id = ${userId}
ORDER BY v.created_at DESC;
  `);
}

// 运行所有测试
async function runAllTests() {
  console.log('开始AI审核流程测试...\n');
  
  await testAIReject();
  console.log('\n等待3秒...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await testManualReview();
  console.log('\n测试完成！');
  console.log('\n请检查：');
  console.log('1. 数据库中的 user_violation 表');
  console.log('2. 数据库中的 user_punish 表');
  console.log('3. 数据库中的 content_review_queue 表');
}

// 导出测试函数
console.log('AI审核流程测试脚本已加载');
console.log('可用函数：');
console.log('- testAIReject(): 测试AI直接拒绝');
console.log('- testManualReview(): 测试人工复核');
console.log('- checkViolations(userId): 查看违规记录');
console.log('- runAllTests(): 运行所有测试');
console.log('\n使用示例：runAllTests()');
