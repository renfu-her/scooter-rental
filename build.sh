echo "=========================================="
echo "開始部署流程..."
echo "=========================================="
echo ""

echo "[1/6] 切換到專案目錄..."
cd ~/htdocs/scooter-rental.ai-tracks.com
echo "✓ 目錄切換完成"
echo ""

echo "[2/6] 更新程式碼 (git pull)..."
git pull
echo "✓ Git 更新完成"
echo ""

echo "[3/6] 清除並快取 Laravel 路由..."
php artisan r:cache
echo "✓ 路由快取完成"
echo ""

echo "[4/6] 清除並快取 Laravel 配置..."
php artisan config:cache
echo "✓ 配置快取完成"
echo ""

echo "[5/6] 構建後端 (React)..."
cd ~/htdocs/scooter-rental.ai-tracks.com/system/backend
pnpm build
echo "✓ 後端構建完成"
echo ""

echo "[6/6] 構建前端 (React)..."
cd ~/htdocs/scooter-rental.ai-tracks.com/system/frontend
pnpm build
echo "✓ 前端構建完成"
echo ""

echo "=========================================="
echo "部署完成！"
echo "=========================================="
