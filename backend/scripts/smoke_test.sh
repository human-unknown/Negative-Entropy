#!/bin/bash
# 上线前冒烟测试脚本

API_BASE="http://localhost:3000/api"
TOKEN=""
USER_ID=""
DEBATE_ID=""

echo "========== 冒烟测试开始 =========="

# 1. 注册测试
echo -e "\n[1/8] 测试用户注册..."
REGISTER_RESP=$(curl -s -X POST $API_BASE/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"smoketest_user","password":"Test@123456"}')
echo $REGISTER_RESP | grep -q "success" && echo "✓ 注册成功" || echo "✗ 注册失败"

# 2. 登录测试
echo -e "\n[2/8] 测试用户登录..."
LOGIN_RESP=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"smoketest_user","password":"Test@123456"}')
TOKEN=$(echo $LOGIN_RESP | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
USER_ID=$(echo $LOGIN_RESP | grep -o '"id":[0-9]*' | cut -d':' -f2)
[ -n "$TOKEN" ] && echo "✓ 登录成功 (Token: ${TOKEN:0:20}...)" || echo "✗ 登录失败"

# 3. 发布辩论话题
echo -e "\n[3/8] 测试发布辩论话题..."
CREATE_RESP=$(curl -s -X POST $API_BASE/debates \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"冒烟测试辩题","description":"测试描述","duration":60}')
DEBATE_ID=$(echo $CREATE_RESP | grep -o '"id":[0-9]*' | cut -d':' -f2)
[ -n "$DEBATE_ID" ] && echo "✓ 发布成功 (ID: $DEBATE_ID)" || echo "✗ 发布失败"

# 4. 参与辩论
echo -e "\n[4/8] 测试参与辩论..."
JOIN_RESP=$(curl -s -X POST $API_BASE/debates/$DEBATE_ID/join \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"stance":"pro"}')
echo $JOIN_RESP | grep -q "success" && echo "✓ 参与成功" || echo "✗ 参与失败"

# 5. 发表观点
echo -e "\n[5/8] 测试发表观点..."
SPEECH_RESP=$(curl -s -X POST $API_BASE/debates/$DEBATE_ID/speeches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"content":"这是冒烟测试观点"}')
echo $SPEECH_RESP | grep -q "success" && echo "✓ 发表成功" || echo "✗ 发表失败"

# 6. 投票测试
echo -e "\n[6/8] 测试投票功能..."
VOTE_RESP=$(curl -s -X POST $API_BASE/debates/$DEBATE_ID/vote \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"stance":"pro"}')
echo $VOTE_RESP | grep -q "success" && echo "✓ 投票成功" || echo "✗ 投票失败"

# 7. 举报测试
echo -e "\n[7/8] 测试举报功能..."
REPORT_RESP=$(curl -s -X POST $API_BASE/reports \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"targetType":"speech","targetId":1,"reason":"测试举报"}')
echo $REPORT_RESP | grep -q "success" && echo "✓ 举报成功" || echo "✗ 举报失败"

# 8. 管理员登录测试
echo -e "\n[8/8] 测试管理员功能..."
ADMIN_LOGIN=$(curl -s -X POST $API_BASE/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123456"}')
ADMIN_TOKEN=$(echo $ADMIN_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$ADMIN_TOKEN" ] && echo "✓ 管理员登录成功" || echo "✗ 管理员登录失败"

echo -e "\n========== 冒烟测试完成 =========="
