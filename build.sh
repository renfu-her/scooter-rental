#!/bin/bash

# 檢查參數
if [ "$1" = "production" ]; then
    MODE="production"
    PROJECT_DIR="~/htdocs/languangsmart.com"
    echo "=========================================="
    echo "開始 Production 部署流程..."
    echo "=========================================="
elif [ "$1" = "develop" ]; then
    MODE="develop"
    PROJECT_DIR="~/htdocs/scooter-rental.ai-tracks.com"
    echo "=========================================="
    echo "開始 Develop 部署流程..."
    echo "=========================================="
else
    echo "用法: ./build.sh [production|develop]"
    echo ""
    echo "範例:"
    echo "  ./build.sh production   # 部署到 production 環境"
    echo "  ./build.sh develop      # 部署到 develop 環境"
    exit 1
fi

echo "模式: $MODE"
echo "專案目錄: $PROJECT_DIR"
echo ""

echo "[1/7] 切換到專案目錄..."
cd $PROJECT_DIR
if [ $? -ne 0 ]; then
    echo "✗ 錯誤：無法切換到目錄 $PROJECT_DIR"
    exit 1
fi
echo "✓ 目錄切換完成"
echo ""

echo "[2/7] 更新程式碼 (git pull)..."
git pull --no-edit
if [ $? -ne 0 ]; then
    echo "✗ 警告：Git 更新失敗，繼續執行..."
fi
echo "✓ Git 更新完成"
echo ""

echo "[3/7] 資料庫遷移..."
php artisan migrate
if [ $? -ne 0 ]; then
    echo "✗ 警告：資料庫遷移失敗，繼續執行..."
fi
echo "✓ 資料庫遷移完成"
echo ""

echo "[4/7] 清除並快取 Laravel 路由..."
php artisan route:clear
php artisan route:cache
if [ $? -ne 0 ]; then
    echo "✗ 警告：路由快取失敗，繼續執行..."
fi
echo "✓ 路由快取完成"
echo ""

echo "[5/7] 清除並快取 Laravel 配置..."
php artisan config:clear
php artisan config:cache
if [ $? -ne 0 ]; then
    echo "✗ 警告：配置快取失敗，繼續執行..."
fi
echo "✓ 配置快取完成"
echo ""

echo "[6/7] 構建後端 (React)..."
cd $PROJECT_DIR/system/backend
if [ $? -ne 0 ]; then
    echo "✗ 錯誤：無法進入後端目錄"
    exit 1
fi
pnpm build
if [ $? -ne 0 ]; then
    echo "✗ 警告：後端構建失敗，繼續執行..."
fi
echo "✓ 後端構建完成"
echo ""

echo "[7/7] 構建前端 (React)..."
cd $PROJECT_DIR/system/frontend
if [ $? -ne 0 ]; then
    echo "✗ 錯誤：無法進入前端目錄"
    exit 1
fi
pnpm build
if [ $? -ne 0 ]; then
    echo "✗ 警告：前端構建失敗"
    exit 1
fi
echo "✓ 前端構建完成"
echo ""

echo "=========================================="
echo "$MODE 環境部署完成！"
echo "=========================================="
