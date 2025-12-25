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

```nginx
# CloudPanel Nginx configuration for scooter-rental.ai-tracks.com
# 同時服務 Laravel API 和 React 前端

server {
  listen 80;
  listen [::]:80;
  listen 443 quic;
  listen 443 ssl;
  listen [::]:443 quic;
  listen [::]:443 ssl;
  http2 on;
  http3 off;
  {{ssl_certificate_key}}
  {{ssl_certificate}}
  server_name scooter-rental.ai-tracks.com;
  
  # 根目錄指向 Laravel public 目錄
  # CloudPanel 通常會自動設置，但需要確認路徑正確
  root /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/public;
  index index.html index.php;

  {{nginx_access_log}}
  {{nginx_error_log}}

  if ($scheme != "https") {
    rewrite ^ https://$host$request_uri permanent;
  }

  location ~ /.well-known {
    auth_basic off;
    allow all;
  }

  {{settings}}

  include /etc/nginx/global_settings;

  # React 前端 - /backend 路徑對應到 system/backend
  location /backend {
    alias /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/system/backend;
    index index.html;
    try_files $uri $uri/ /backend/index.html;
    
    # 靜態資源處理
    location ~* \.(css|js|jpg|jpeg|gif|png|ico|gz|svg|svgz|ttf|otf|woff|woff2|eot|mp4|ogg|ogv|webm|webp|zip|swf|map)$ {
      add_header Access-Control-Allow-Origin "*";
      add_header alt-svc 'h3=":443"; ma=86400';
      expires max;
      access_log off;
    }
  }

  # 前端首頁 - / 路徑對應到 system/frontend
  location = / {
    alias /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/system/frontend/index.html;
  }

  # Laravel storage 文件
  location /storage {
    alias /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/storage/app/public;
    try_files $uri =404;
    expires max;
    access_log off;
  }

  # 靜態資源（CSS, JS, 圖片等）- 優先匹配
  location ~* ^.+\.(css|js|jpg|jpeg|gif|png|ico|gz|svg|svgz|ttf|otf|woff|woff2|eot|mp4|ogg|ogv|webm|webp|zip|swf|map)$ {
    add_header Access-Control-Allow-Origin "*";
    add_header alt-svc 'h3=":443"; ma=86400';
    expires max;
    access_log off;
    try_files $uri =404;
  }

  # Laravel PHP 處理（包括 API 路由和 index.php）
  location ~ \.php$ {
    include fastcgi_params;
    fastcgi_intercept_errors on;
    fastcgi_index index.php;
    fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    fastcgi_read_timeout 3600;
    fastcgi_send_timeout 3600;
    fastcgi_param HTTPS "on";
    fastcgi_param SERVER_PORT 443;
    fastcgi_pass 127.0.0.1:{{php_fpm_port}};
    fastcgi_param PHP_VALUE "{{php_settings}}";
  }

  # API 路由和其他需要 Laravel 處理的路由
  location ~ ^/(api|index\.php) {
    try_files $uri $uri/ /index.php?$query_string;
  }

  # 其他請求返回前端首頁
  location / {
    alias /home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/system/frontend/index.html;
  }

  # 禁止訪問隱藏文件
  location ~ /\. {
    deny all;
    access_log off;
    log_not_found off;
  }
}
```

### 重要路徑說明

在 CloudPanel 中，項目路徑通常是：
```
/home/cloudpanel/htdocs/[domain]/
```

請將配置中的路徑替換為實際的 CloudPanel 項目路徑：
- `/home/cloudpanel/htdocs/scooter-rental.ai-tracks.com/` → 替換為您的實際路徑

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
