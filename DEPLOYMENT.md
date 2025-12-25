# 部署指南 (Deployment Guide)

## Nginx 配置說明

### 目錄結構

部署後的目錄結構應該是：

```
/path/to/scooter-rental/
├── app/                    # Laravel 應用
├── bootstrap/
├── config/
├── database/
├── public/                 # Web 根目錄
│   ├── backend/            # React 構建後的目錄（對應 /backend 路徑）
│   │   ├── index.html      # React 構建後的 index.html
│   │   ├── assets/         # React 構建的靜態資源
│   │   │   ├── index-*.js
│   │   │   ├── index-*.css
│   │   │   └── ...
│   ├── index.php           # Laravel 入口
│   ├── storage/            # Laravel storage link (符號連結)
│   ├── favicon.ico          # 網站圖標
│   ├── robots.txt           # 搜索引擎爬蟲規則
│   └── ...
├── routes/
├── storage/
└── system/
    ├── frontend/            # 前端首頁
    │   └── index.html       # 首頁 HTML
    └── backend/             # React 後台源碼（開發用）
```

### 構建 React 前端

1. 進入 React 前端目錄：
```bash
cd system/backend
```

2. 安裝依賴（如果還沒安裝）：
```bash
pnpm install
```

3. 構建生產版本：
```bash
pnpm run build
```

4. 構建輸出會自動生成到 `public/backend/` 目錄（已配置在 vite.config.ts 中）
   - 構建後，React 的 `index.html` 和 `assets/` 會輸出到 `public/backend/` 目錄
   - 訪問路徑為：`https://scooter-rental.ai-tracks.com/backend`
   - 注意：構建時會清空 `public/backend/` 目錄，但不會影響 Laravel 的其他文件

### Nginx 配置要點

1. **根目錄設置**：
   - `root` 指向 Laravel 的 `public` 目錄
   - 這樣可以同時服務 Laravel 和 React 文件

2. **API 路由**：
   - `/api/*` 路由轉發到 PHP-FPM 處理 Laravel API
   - 其他 Laravel 路由（如 `/storage/*`）也由 PHP-FPM 處理

3. **React 前端路由**：
   - 所有其他請求（`/`）返回 `index.html`
   - 這樣 React Router 的 HashRouter 可以正常工作
   - 靜態資源（CSS, JS, 圖片）直接從文件系統提供

4. **靜態資源優化**：
   - 設置長期緩存（`expires max`）
   - 關閉訪問日誌以提高性能

### 環境變數配置

確保 React 前端知道 API 的基礎 URL。在構建前設置：

```bash
# 在 system/backend/.env 或構建時設置
VITE_API_BASE_URL=https://scooter-rental.ai-tracks.com/api
```

或者在 `system/backend/.env.production` 中設置：
```
VITE_API_BASE_URL=https://scooter-rental.ai-tracks.com/api
```

### Laravel 配置

1. 確保 `.env` 中的 `APP_URL` 設置正確：
```env
APP_URL=https://scooter-rental.ai-tracks.com
```

2. 確保 storage link 已創建：
```bash
php artisan storage:link
```

3. 確保文件權限正確：
```bash
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### 部署步驟

1. **構建 React 前端**：
```bash
cd system/backend
pnpm install
pnpm run build
```

2. **構建文件已自動輸出**：
   - 構建文件會自動輸出到 `public/backend/` 目錄
   - 無需手動複製

3. **設置 Laravel**：
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan storage:link
```

4. **重載 Nginx**：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 驗證部署

1. 訪問 `https://scooter-rental.ai-tracks.com/` 應該看到前端首頁
2. 訪問 `https://scooter-rental.ai-tracks.com/backend` 應該看到 React 後台管理系統
3. 訪問 `https://scooter-rental.ai-tracks.com/api/captcha/generate` 應該返回 API 響應
4. 檢查瀏覽器控制台，確保 API 請求正常

### 注意事項

- React 前端通過 `/backend` 路徑訪問，完整 URL 為：`https://scooter-rental.ai-tracks.com/backend`
- React 使用 HashRouter，所以路由是 `/backend/#/orders` 格式
- API 請求會自動發送到 `/api/*`
- 確保 CORS 設置正確（如果需要）
- 生產環境建議啟用 Laravel 的緩存優化
- 構建時會清空 `public/backend/` 目錄，確保每次構建都是乾淨的

