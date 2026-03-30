#!/bin/bash
# ============================================================
# IllegalCreed Website 部署脚本（国内服务器）
# 用法: ./scripts/deploy.sh
# ============================================================

set -e

# 服务器配置
SERVER_HOST="47.120.26.143"
SERVER_USER="root"

# 远程路径（VitePress 构建产物直接覆盖网站根目录）
REMOTE_DIR="/var/www/illegal-site"

# 本地路径
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 SSH 连接
check_ssh() {
  log_info "检查 SSH 连接..."
  if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "${SERVER_USER}@${SERVER_HOST}" 'echo ok' &>/dev/null; then
    log_error "无法连接到服务器。请确认 SSH key 已配置。"
    log_warn "提示: ssh-copy-id ${SERVER_USER}@${SERVER_HOST}"
    exit 1
  fi
}

# 构建
build() {
  log_info "构建 VitePress 站点..."
  cd "$PROJECT_ROOT"
  pnpm install
  pnpm docs:build
}

# 部署
deploy() {
  log_info "部署到 ${SERVER_HOST}..."

  # 清理远程目录（保留 SlideStack 子目录）
  ssh "${SERVER_USER}@${SERVER_HOST}" "
    cd ${REMOTE_DIR}
    find . -maxdepth 1 ! -name '.' ! -name 'SlideStack' -exec rm -rf {} +
  "

  # 上传构建产物
  scp -r "${PROJECT_ROOT}/.vitepress/dist/"* "${SERVER_USER}@${SERVER_HOST}:${REMOTE_DIR}/"

  log_info "部署完成 ✓"
}

# 主逻辑
main() {
  echo "========================================"
  echo "  IllegalCreed Website 部署"
  echo "  服务器: ${SERVER_HOST}"
  echo "========================================"
  echo ""

  check_ssh
  build
  deploy

  echo ""
  log_info "部署完成！"
  echo ""
  echo "  网站:   https://illegalscreed.cn"
}

main "$@"
