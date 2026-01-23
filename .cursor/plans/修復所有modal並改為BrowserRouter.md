# 修復所有 Modal 殘留問題並將 HashRouter 改為 BrowserRouter

## 問題分析

### 問題 1：新增、編輯的 modal 還有哪些會讓訂單管理擋在前面

在 `OrdersPage.tsx` 中發現以下可能導致畫面卡住的 modal 和 overlay：

1. **AddOrderModal** (`z-50`) - 已處理
2. **StatsModal** (`z-[60]`) - 合作商單月詳細統計
3. **ChartModal** (`z-[60]`) - 合作商業績統計圖表
4. **ConvertBookingModal** (`z-[60]`) - 轉換預約為訂單
5. **備註內容彈窗** (`z-[70]`) - 展開的備註內容
6. **狀態下拉選單 overlay** (`z-40`) - 狀態選擇下拉選單的背景（已通過 state 清理處理）
7. **操作下拉選單 overlay** (`z-40`) - 操作按鈕下拉選單的背景（已通過 state 清理處理）

### 問題 2：URL 路由問題

目前使用 `HashRouter`，URL 格式為 `/#/orders`。用戶希望改為 `BrowserRouter`，URL 格式為 `/orders`。

**需要考慮的問題**：
- 需要更新 nginx 配置，確保所有路由都返回 `index.html`（用於 SPA）
- 需要確保後端 API 路由不會被前端路由攔截
- 需要更新 `api.ts` 中的硬編碼 hash 路由檢查（`window.location.hash !== '#/login'`）

## 解決方案

### 步驟 1：創建共用的 Modal 清理函數

**修改位置**：`OrdersPage.tsx`

創建一個共用的清理函數，在所有 modal 關閉時調用：

```typescript
const cleanupAllModals = () => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      // 查找所有 fixed overlay 元素
      const fixedOverlays = document.querySelectorAll('[class*="fixed inset-0"]');
      fixedOverlays.forEach((element) => {
        const el = element as HTMLElement;
        const zIndex = window.getComputedStyle(el).zIndex;
        const computedZIndex = zIndex ? parseInt(zIndex) : 0;
        if (computedZIndex >= 40) {
          el.style.display = 'none';
          el.style.pointerEvents = 'none';
        }
      });
      
      // 確保 body 沒有被鎖定
      document.body.style.overflow = '';
      document.body.style.pointerEvents = '';
    }, 50);
  });
};
```

### 步驟 2：在所有 Modal 的 onClose 中調用清理函數

**修改位置**：`OrdersPage.tsx`

1. **StatsModal** (約 2758 行)
   ```typescript
   <StatsModal 
     isOpen={isStatsModalOpen} 
     onClose={() => {
       setIsStatsModalOpen(false);
       cleanupAllModals();
     }} 
     stats={stats} 
     currentStore={currentStore} 
   />
   ```

2. **ChartModal** (約 2760 行)
   ```typescript
   <ChartModal 
     isOpen={isChartModalOpen} 
     onClose={() => {
       setIsChartModalOpen(false);
       cleanupAllModals();
     }} 
     stats={stats} 
   />
   ```

3. **ConvertBookingModal** (約 2657 行)
   ```typescript
   <ConvertBookingModal
     isOpen={isConvertModalOpen}
     onClose={() => {
       setIsConvertModalOpen(false);
       setSelectedBooking(null);
       cleanupAllModals();
     }}
     booking={selectedBooking}
     onSuccess={handleConvertSuccess}
   />
   ```

4. **備註內容彈窗** (約 2720-2756 行)
   ```typescript
   onClick={() => {
     setExpandedRemarkId(null);
     cleanupAllModals();
   }}
   ```

### 步驟 3：將 HashRouter 改為 BrowserRouter

**修改位置**：`App.tsx`

1. 更新 import（第 3 行）
   ```typescript
   import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
   ```

2. 更新 Router 組件（第 122 行）
   ```typescript
   <BrowserRouter>
   ```

### 步驟 4：更新 api.ts 中的路由檢查

**修改位置**：`lib/api.ts`

將所有 `window.location.hash !== '#/login'` 改為 `window.location.pathname !== '/login'`

需要修改的位置：
- 第 68 行
- 第 127 行
- 第 164 行
- 第 228 行
- 第 296 行
- 第 331 行
- 第 576 行
- 第 613 行

### 步驟 5：確認 nginx 配置

**檢查位置**：`nginx-cloudpanel.conf`

確認 `/backend` 路徑的配置：
```nginx
location /backend {
  alias /home/ai-tracks-scooter-rental/htdocs/scooter-rental.ai-tracks.com/public/backend;
  index index.html;
  try_files $uri $uri/ /backend/index.html;
}
```

這個配置已經存在，應該可以支持 BrowserRouter。

## 文件修改清單

1. **`system/backend/pages/OrdersPage.tsx`**
   - 創建共用的 `cleanupAllModals` 函數
   - 在 `StatsModal` 的 `onClose` 中調用清理函數
   - 在 `ChartModal` 的 `onClose` 中調用清理函數
   - 在 `ConvertBookingModal` 的 `onClose` 中調用清理函數
   - 在備註內容彈窗的關閉處理中調用清理函數

2. **`system/backend/App.tsx`**
   - 將 `HashRouter` 改為 `BrowserRouter`（第 3 行和第 122 行）

3. **`system/backend/lib/api.ts`**
   - 將所有 `window.location.hash !== '#/login'` 改為 `window.location.pathname !== '/login'`

4. **`nginx-cloudpanel.conf`**（如果需要）
   - 確認 `/backend` 路徑的配置正確

## 測試要點

1. 測試所有 modal（StatsModal, ChartModal, ConvertBookingModal, 備註彈窗）關閉後，是否可以正常點擊其他連結
2. 測試 URL 是否正確顯示為 `/orders` 而不是 `/#/orders`
3. 測試直接訪問 `/orders` 是否正常工作（刷新頁面）
4. 測試所有導航連結是否正常工作
5. 確認 API 路由 (`/api/*`) 不會被前端路由攔截
6. 測試登入重定向是否正常工作
