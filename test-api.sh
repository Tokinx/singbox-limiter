#!/bin/bash

# SingBox Limiter API 测试脚本

BASE_URL="http://localhost:3000"
TOKEN=""

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "================================"
echo "  SingBox Limiter API 测试"
echo "================================"
echo ""

# 1. 测试健康检查
echo -e "${YELLOW}[1] 测试健康检查...${NC}"
curl -s "$BASE_URL/health" | jq .
echo ""

# 2. 管理员登录
echo -e "${YELLOW}[2] 管理员登录...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')

echo "$LOGIN_RESPONSE" | jq .

# 提取 Token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token')

if [ "$TOKEN" == "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}登录失败，无法继续测试${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 登录成功，Token: ${TOKEN:0:20}...${NC}"
echo ""

# 3. 获取客户端列表（应该为空）
echo -e "${YELLOW}[3] 获取客户端列表...${NC}"
curl -s "$BASE_URL/api/clients" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 4. 创建测试客户端
echo -e "${YELLOW}[4] 创建测试客户端...${NC}"
CREATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/clients" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试客户端",
    "email": "test@example.com",
    "limitGb": 5,
    "resetDay": 1,
    "realityPort": 20443,
    "hysteriaPort": 20080,
    "sni": "www.google.com"
  }')

echo "$CREATE_RESPONSE" | jq .

CLIENT_ID=$(echo "$CREATE_RESPONSE" | jq -r '.client.id')

if [ "$CLIENT_ID" == "null" ] || [ -z "$CLIENT_ID" ]; then
  echo -e "${RED}创建客户端失败${NC}"
  exit 1
fi

echo -e "${GREEN}✓ 客户端创建成功，ID: $CLIENT_ID${NC}"
echo ""

# 5. 获取客户端详情
echo -e "${YELLOW}[5] 获取客户端详情...${NC}"
curl -s "$BASE_URL/api/clients/$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 6. 获取连接 URL
echo -e "${YELLOW}[6] 获取连接 URL...${NC}"
curl -s "$BASE_URL/api/clients/$CLIENT_ID/urls" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 7. 获取流量历史（应该为空）
echo -e "${YELLOW}[7] 获取流量历史...${NC}"
curl -s "$BASE_URL/api/clients/$CLIENT_ID/traffic?hours=24" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

# 8. 更新客户端配置
echo -e "${YELLOW}[8] 更新客户端配置...${NC}"
curl -s -X PUT "$BASE_URL/api/clients/$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "测试客户端（已修改）",
    "limitGb": 10
  }' | jq .
echo ""

# 9. 获取分享 Token
echo -e "${YELLOW}[9] 测试分享页面...${NC}"
SHARE_TOKEN=$(echo "$CREATE_RESPONSE" | jq -r '.client.share_token')
echo "分享链接: $BASE_URL/api/share/$SHARE_TOKEN"
curl -s "$BASE_URL/api/share/$SHARE_TOKEN" | jq .
echo ""

# 10. 删除测试客户端
echo -e "${YELLOW}[10] 删除测试客户端...${NC}"
curl -s -X DELETE "$BASE_URL/api/clients/$CLIENT_ID" \
  -H "Authorization: Bearer $TOKEN" | jq .
echo ""

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}  所有测试完成！${NC}"
echo -e "${GREEN}================================${NC}"
