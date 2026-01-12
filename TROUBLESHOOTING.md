# 故障排除指南 (Troubleshooting Guide)

## API 連接問題

### 錯誤：`ERR_CONNECTION_REFUSED` 或 `GET http://localhost:8000/api/captcha/generate net::ERR_CONNECTION_REFUSED`

**原因**：Laravel 後端服務沒有運行在 `localhost:8000`

**解決方案**：

#### 方案 1：啟動 Laravel 開發服務器

在專案根目錄執行：

```bash
php artisan serve
```

這會啟動 Laravel 開發服務器在 `http://localhost:8000`

#### 方案 2：使用 Laragon（如果使用 Laragon）

1. 確保 Laragon 正在運行
2. 檢查 Laragon 的虛擬主機配置
3. 如果使用不同的端口，請更新前端的 `.env` 文件

#### 方案 3：配置正確的 API URL

如果 Laravel 運行在不同的端口或域名，請在 `system/frontend/.env` 文件中設置：

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

或者如果使用 Laragon 的虛擬主機：

```env
VITE_API_BASE_URL=http://scooter-rental.test/api
```

### 檢查步驟

1. **確認 Laravel 服務正在運行**：
   ```bash
   # 在專案根目錄執行
   php artisan serve
   ```

2. **測試 API 端點**：
   在瀏覽器中訪問：`http://localhost:8000/api/captcha/generate`
   應該返回 JSON 響應

3. **檢查前端環境變數**：
   確認 `system/frontend/.env` 文件存在且包含正確的 `VITE_API_BASE_URL`

4. **重新啟動前端開發服務器**：
   修改 `.env` 後需要重啟前端服務器：
   ```bash
   cd system/frontend
   npm run dev
   ```

## CSS 文件 404 錯誤

### 錯誤：`Failed to load resource: the server responded with a status of 404 (index.css)`

**原因**：`index.html` 中引用了不存在的 CSS 文件

**狀態**：已修復 - `index.css` 引用已從 `system/frontend/index.html` 中移除

## CORS 問題

### 錯誤：跨域請求被阻止

**解決方案**：已在 `bootstrap/app.php` 中添加 CORS 中間件配置

如果仍有問題，請檢查：
1. `bootstrap/app.php` 中的 CORS 中間件配置
2. Laravel 版本是否支持內建的 CORS 處理
