# 部署指南 (Deployment Guide)

## CloudPanel Nginx 配置

### CloudPanel 配置說明

CloudPanel 使用模板系統來管理 nginx 配置。配置文件通常位於：
- `/home/cloudpanel/htdocs/[domain]/nginx.conf`
- 或通過 CloudPanel 界面：網站設置 → Nginx 配置

### 在 CloudPanel 中應用配置

#### 方法一：通過 CloudPanel 界面
1. 登入 CloudPanel
2. 選擇對應的網站
3. 進入「Nginx 配置」或「高級設置」
4. 將以下配置複製到自定義 nginx 配置區域
5. 保存並重載 nginx

#### 方法二：直接編輯配置文件
```bash
# 找到網站的 nginx 配置文件
# 通常在：/home/cloudpanel/htdocs/[domain]/nginx.conf
# 或：/etc/nginx/sites-available/[domain]

# 編輯配置文件
sudo nano /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/nginx.conf

# 重載 nginx
sudo nginx -t && sudo systemctl reload nginx
```

### Nginx 配置（CloudPanel 版本）

**重要**：CloudPanel 使用雙 server block 架構：
- 第一個 server block (80/443)：通過 Varnish 代理到 8080 端口
- 第二個 server block (8080)：處理 PHP-FPM 請求

配置說明：
- `/backend` 和 `/` 在第一個 server block 中直接提供靜態文件（不通過 Varnish）
- `/api` 和其他 PHP 請求通過 Varnish 代理到第二個 server block 的 8080 端口處理

完整配置請參考 `nginx-cloudpanel.conf` 文件。

### 重要路徑說明

在 CloudPanel 中，項目路徑通常是：
```
/home/cloudpanel/htdocs/[domain]/
```

請將配置中的路徑替換為實際的 CloudPanel 項目路徑：
- `/home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/` → 替換為您的實際路徑

### PHP-FPM 配置說明

如果 `{{php_fpm_port}}` 變數無法辨識，CloudPanel 可能需要使用不同的格式：

1. **檢查 CloudPanel 的 PHP 版本設置**：
   - 在 CloudPanel 界面中查看網站設置
   - 確認 PHP 版本（例如：PHP 8.2）

2. **可能的替代方案**：
   ```nginx
   # 方案一：使用 unix socket（如果 CloudPanel 使用 socket）
   fastcgi_pass unix:/var/run/php/php8.2-fpm.sock;
   
   # 方案二：使用固定端口（根據 CloudPanel 的 PHP 版本）
   # PHP 8.2 通常是 9022
   # PHP 8.1 通常是 9021
   # PHP 8.0 通常是 9020
   fastcgi_pass 127.0.0.1:9022;
   
   # 方案三：使用 CloudPanel 的變數（如果有的話）
   # 檢查 CloudPanel 文檔或現有配置中的變數名稱
   ```

3. **如何找到正確的 PHP-FPM 配置**：
   ```bash
   # 查看 CloudPanel 的其他網站配置作為參考
   cat /home/cloudpanel/htdocs/[其他網站]/nginx.conf | grep fastcgi_pass
   
   # 或查看 PHP-FPM 進程
   ps aux | grep php-fpm
   
   # 或查看 PHP-FPM socket 文件
   ls -la /var/run/php/
   ```

### CloudPanel 特殊注意事項

1. **路徑確認**：
   ```bash
   # 確認項目實際路徑
   ls -la /home/cloudpanel/htdocs/
   ```

2. **文件權限**：
   ```bash
   # CloudPanel 通常使用特定用戶，確認權限
   sudo chown -R cloudpanel:cloudpanel /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com
   ```

3. **PHP-FPM 端口**：
   - CloudPanel 的 `{{php_fpm_port}}` 通常是自動設置的
   - 可以在 CloudPanel 界面查看 PHP 版本對應的端口

4. **重載配置**：
   ```bash
   # 測試配置
   sudo nginx -t
   
   # 重載 nginx（CloudPanel 可能會自動處理）
   sudo systemctl reload nginx
   ```

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

## 目錄結構

部署後的目錄結構應該是：

```
/home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/
├── app/                    # Laravel 應用
├── bootstrap/
├── config/
├── database/
├── public/                 # Web 根目錄
│   ├── backend/            # React 構建後的目錄（對應 /backend 路徑，可選）
│   ├── index.php           # Laravel 入口
│   ├── storage/            # Laravel storage link (符號連結)
│   ├── favicon.ico
│   └── robots.txt
├── routes/
├── storage/
└── system/
    ├── frontend/            # 前端首頁
    │   └── index.html       # 首頁 HTML
    └── backend/             # React 後台源碼
```

## 構建 React 前端

### 方式一：開發環境（推薦，無需構建）
- 直接使用 `system/backend` 源碼
- nginx 配置已將 `/backend` 指向 `system/backend`
- 訪問：`https://scooter-rental.ai-tracks.com/backend`
- 無需構建步驟

### 方式二：生產環境（構建優化版本）

1. **解決 pnpm 問題**（如果遇到）：
```bash
pnpm setup
source ~/.bashrc
```

2. **進入項目目錄**：
```bash
cd /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/system/backend
```

3. **安裝依賴**：
```bash
pnpm install
```

4. **構建生產版本**：
```bash
pnpm run build
```

5. **構建輸出**：
   - 構建文件會輸出到 `public/backend/` 目錄
   - 如果使用構建版本，需要修改 nginx 配置中的 `/backend` location，將 `alias` 改為指向 `public/backend`

## 環境變數配置

### React 前端環境變數

在 `system/backend/.env.production` 中設置：
```
VITE_API_BASE_URL=https://scooter-rental.ai-tracks.com/api
```

### Laravel 環境變數

在項目根目錄的 `.env` 中設置：
```env
APP_URL=https://scooter-rental.ai-tracks.com
DB_CONNECTION=mysql
DB_DATABASE=scooter-rental
DB_USERNAME=root
DB_PASSWORD=
```

## Laravel 設置

1. **安裝依賴**：
```bash
cd /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com
composer install --optimize-autoloader --no-dev
```

2. **設置緩存**：
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

3. **創建 storage link**：
```bash
php artisan storage:link
```

4. **設置權限**：
```bash
chmod -R 755 storage bootstrap/cache
chown -R cloudpanel:cloudpanel storage bootstrap/cache
```

## 部署步驟

1. **上傳項目文件**到 CloudPanel 項目目錄

2. **設置 pnpm**（如果需要構建）：
```bash
pnpm setup
source ~/.bashrc
```

3. **安裝依賴**：
```bash
# Laravel
composer install --optimize-autoloader --no-dev

# React（如果需要構建）
cd system/backend
pnpm install
pnpm run build
```

4. **配置 Nginx**：
   - 通過 CloudPanel 界面或直接編輯配置文件
   - 應用上面提供的 nginx 配置
   - 確認路徑正確

5. **設置 Laravel**：
```bash
php artisan config:cache
php artisan route:cache
php artisan storage:link
```

6. **重載 Nginx**：
```bash
sudo nginx -t
sudo systemctl reload nginx
```

## 驗證部署

1. 訪問 `https://scooter-rental.ai-tracks.com/` 應該看到前端首頁
2. 訪問 `https://scooter-rental.ai-tracks.com/backend` 應該看到 React 後台管理系統
3. 訪問 `https://scooter-rental.ai-tracks.com/api/captcha/generate` 應該返回 API 響應
4. 檢查瀏覽器控制台，確保 API 請求正常

## 注意事項

- CloudPanel 的路徑通常是 `/home/cloudpanel/htdocs/[domain]/`
- 確認 nginx 配置中的路徑與實際項目路徑一致
- React 使用 HashRouter，路由格式：`/backend/#/orders`
- API 請求會自動發送到 `/api/*`
- 確保 CORS 設置正確（如果需要）
- 生產環境建議啟用 Laravel 的緩存優化
