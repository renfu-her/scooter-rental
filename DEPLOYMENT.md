# 部署指南 (Deployment Guide)

## 服務器環境設置

### 解決 pnpm 全局 bin 目錄問題

如果在服務器上遇到 `ERR_PNPM_NO_GLOBAL_BIN_DIR` 錯誤，請執行以下步驟：

#### 方法一：自動設置（推薦）
```bash
# 運行 pnpm setup 自動配置
pnpm setup

# 然後重新載入 shell 配置
source ~/.bashrc
# 或
source ~/.zshrc
```

#### 方法二：手動設置環境變數
```bash
# 設置 PNPM_HOME 環境變數（添加到 ~/.bashrc 或 ~/.zshrc）
export PNPM_HOME="$HOME/.local/share/pnpm"
export PATH="$PNPM_HOME:$PATH"

# 重新載入配置
source ~/.bashrc
```

#### 方法三：設置 pnpm 配置
```bash
# 設置全局 bin 目錄
pnpm config set global-bin-dir ~/.local/share/pnpm

# 或使用絕對路徑
pnpm config set global-bin-dir /home/username/.local/share/pnpm
```

#### 驗證設置
```bash
# 檢查 pnpm 配置
pnpm config get global-bin-dir

# 檢查 PATH 是否包含 pnpm 目錄
echo $PATH | grep pnpm

# 測試 pnpm 命令
pnpm --version
```

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

**注意**：根據 nginx 配置，`/backend` 路徑直接對應到 `system/backend` 目錄，所以有兩種部署方式：

#### 方式一：開發環境（推薦，無需構建）
- 直接使用 `system/backend` 源碼
- nginx 配置已將 `/backend` 指向 `system/backend`
- 訪問：`https://scooter-rental.ai-tracks.com/backend`
- 無需構建步驟

#### 方式二：生產環境（構建優化版本）
1. **解決 pnpm 問題**（如果遇到）：
```bash
pnpm setup
source ~/.bashrc
```

2. 進入 React 前端目錄：
```bash
cd system/backend
```

3. 安裝依賴（如果還沒安裝）：
```bash
pnpm install
```

4. 構建生產版本：
```bash
pnpm run build
```

5. 構建輸出會自動生成到 `public/backend/` 目錄（已配置在 vite.config.ts 中）
   - 構建後，React 的 `index.html` 和 `assets/` 會輸出到 `public/backend/` 目錄
   - 訪問路徑為：`https://scooter-rental.ai-tracks.com/backend`
   - 注意：構建時會清空 `public/backend/` 目錄，確保每次構建都是乾淨的
   - **如果使用構建版本，需要修改 nginx 配置中的 `/backend` location，將 `alias` 改為指向 `public/backend`**

### Nginx 配置要點

1. **根目錄設置**：
   - `root` 指向 Laravel 的 `public` 目錄
   - 這樣可以同時服務 Laravel 和前端文件

2. **路由配置**：
   - `/` → `system/frontend/index.html`（前端首頁）
   - `/backend` → `system/backend`（React 後台管理系統）
   - `/api/*` → Laravel API（PHP-FPM 處理）
   - `/storage/*` → Laravel storage 文件

3. **React 後台路由**：
   - `/backend` 路徑直接對應到 `system/backend` 目錄
   - 支援 React Router 的 HashRouter（路由格式：`/backend/#/orders`）
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

1. **解決 pnpm 問題**（如果遇到）：
```bash
pnpm setup
source ~/.bashrc
```

2. **構建 React 前端**（如果需要）：
```bash
cd system/backend
pnpm install
pnpm run build
```

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
- 如果遇到 pnpm 問題，先運行 `pnpm setup` 進行自動配置
