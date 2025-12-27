# 變更記錄 (Change Log)

## 2025-12-27 21:50:00 - 統一 PartnersPage 所有輸入框的 placeholder 樣式

### Frontend Changes
- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 統一所有輸入框使用 `inputClasses`，移除 `.replace()` 方法
  - 確保所有輸入框的 placeholder 樣式與電話輸入框一致
  - 更新以下輸入框：
    - 合作商名稱：使用統一的 `inputClasses`
    - 合作商地址：使用統一的 `inputClasses`
    - 合作商統編：使用統一的 `inputClasses`
    - 商店主管：使用統一的 `inputClasses`（添加空的 placeholder）
  - 所有輸入框現在都使用相同的 placeholder 樣式：`placeholder:text-gray-400 dark:placeholder:text-gray-500`

### Features
- 所有輸入框的 placeholder 在 dark 模式下都有統一的顏色（淺灰色）
- 移除了不一致的 `.replace()` 方法，使用統一的樣式類別
- 確保所有輸入框的視覺效果一致

## 2025-12-27 21:45:00 - 修正所有上傳照片區域的文字在 dark 模式下的可見性

### Frontend Changes
- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 更新上傳照片區域的樣式：
    - 邊框：添加 `dark:border-gray-600`
    - 背景：添加 `dark:bg-gray-700/30` 和 `dark:hover:bg-gray-700/50`
    - 圖標容器：添加 `dark:bg-gray-800`
    - 圖標：添加 `dark:text-gray-500`
    - 主要文字：「拖放檔案，或者 點擊瀏覽」添加 `dark:text-gray-300`
    - 次要文字：「建議比例 16:9, 最高支援 10MB JPG/PNG」添加 `dark:text-gray-500`
    - 連結文字：「點擊瀏覽」添加 `dark:text-orange-400`
- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 更新上傳照片區域的樣式：
    - 邊框：添加 `dark:border-gray-600` 和 `dark:hover:border-orange-500`
    - 背景：添加 `dark:bg-gray-700/30` 和 `dark:hover:bg-gray-700/50`
    - 圖標容器：添加 `dark:bg-gray-800`
    - 圖標：添加 `dark:text-gray-500`
    - 主要文字：「點擊或拖放照片至此」添加 `dark:text-gray-300`
    - 次要文字：「建議解析度 1280x720 以上的清晰照片」添加 `dark:text-gray-500`
- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 更新上傳照片區域的樣式：
    - 邊框：添加 `dark:border-gray-600` 和 `dark:hover:border-orange-500`
    - 背景：添加 `dark:bg-gray-700/30` 和 `dark:hover:bg-gray-700/50`
    - 圖標容器：添加 `dark:bg-gray-800`
    - 圖標：添加 `dark:text-gray-500`
    - 主要文字：「點擊上傳或拍攝照片」添加 `dark:text-gray-300`
    - 次要文字：「支援格式: JPG, PNG, PDF」添加 `dark:text-gray-500`
- **StoresPage.tsx** (`system/backend/pages/StoresPage.tsx`)
  - 已有正確的 dark 模式樣式（無需修改）

### Features
- 所有上傳照片區域的文字在 dark 模式下都有清楚的顏色
- 主要文字使用 `dark:text-gray-300`（淺灰色）
- 次要文字使用 `dark:text-gray-500`（中灰色）
- 連結文字使用 `dark:text-orange-400`（橙色）
- 所有上傳區域的背景和邊框在 dark 模式下都有適當的樣式

## 2025-12-27 21:40:00 - 修正所有搜尋輸入框的 placeholder 在 dark 模式下的可見性

### Frontend Changes
- **所有頁面的搜尋輸入框** (`system/backend/pages/*.tsx`)
  - **AccessoriesPage.tsx**: 更新搜尋輸入框的 placeholder 樣式，確保在 dark 模式下清楚可見
  - **PartnersPage.tsx**: 更新搜尋輸入框的 placeholder 樣式，確保在 dark 模式下清楚可見
  - **StoresPage.tsx**: 更新搜尋輸入框的 placeholder 樣式，確保在 dark 模式下清楚可見
  - **FinesPage.tsx**: 更新搜尋輸入框的 placeholder 樣式，確保在 dark 模式下清楚可見
  - **ScootersPage.tsx**: 已有正確的 placeholder 樣式（無需修改）
  - **OrdersPage.tsx**: 已有正確的 placeholder 樣式（無需修改）
  - **AdminsPage.tsx**: 已有正確的 placeholder 樣式（無需修改）
  - 統一所有搜尋輸入框使用 `dark:placeholder:text-gray-500` 樣式，確保 placeholder 文字在 dark 模式下清楚可見

### Features
- 所有搜尋輸入框的 placeholder 文字在 dark 模式下都有適當的顏色（淺灰色），在深灰色背景上清楚可見
- 統一了所有搜尋輸入框的樣式，使用完整的 className 而不是 `.replace()` 方法

## 2025-12-27 21:35:00 - 更新付款方式選項並統一所有頁面的 dark 模式樣式

### Frontend Changes
- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 更新付款方式選項：添加「匯款」、「刷卡」、「行動支付」
  - 排列順序：現金、月結、日結、匯款、刷卡、行動支付
- **types.ts** (`system/backend/types.ts`)
  - 更新 `PaymentMethod` enum，添加 `TRANSFER = '匯款'`, `CARD = '刷卡'`, `MOBILE = '行動支付'`
- **所有頁面** (`system/backend/pages/*.tsx`)
  - **PartnersPage.tsx**: 更新所有 input 和 label 的 dark 模式樣式
  - **StoresPage.tsx**: 已有 dark 模式樣式（無需修改）
  - **ScootersPage.tsx**: 
    - 更新所有 input 和 label 的 dark 模式樣式
    - 為所有 select 元素添加 dark 模式樣式和下拉箭頭圖標
  - **AccessoriesPage.tsx**: 
    - 更新所有 input 和 label 的 dark 模式樣式
    - 為所有 select 元素添加 dark 模式樣式和下拉箭頭圖標
  - **FinesPage.tsx**: 
    - 更新所有 input 和 label 的 dark 模式樣式
    - 為所有 select 元素添加 dark 模式樣式和下拉箭頭圖標
  - 統一所有頁面的 `inputClasses` 和 `selectClasses` 樣式
  - 所有 label 添加 `dark:text-gray-400` 樣式
  - 所有 select 元素添加 `ChevronDown` 圖標和 `selectClasses` 樣式
  - 所有 option 元素添加 `bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` 樣式

### Backend Changes
- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 更新 `payment_method` 驗證規則：`'nullable|in:現金,月結,日結,匯款,刷卡,行動支付'`
  - 在 `store` 和 `update` 方法中更新驗證規則

### Features
- 付款方式現在包含 6 個選項，按指定順序排列
- 所有頁面的輸入框和選單在 dark 模式下都有清楚的樣式
- 所有選單都有統一的下拉箭頭圖標
- 所有 label 在 dark 模式下都有適當的文字顏色

## 2025-12-27 07:40:00 - 改善 dark 模式下的選單和按鈕可見性，統一所有輸入框樣式

### Frontend Changes
- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 改善 dark 模式下的選單（select）樣式：
    - 創建專用的 `selectClasses` 樣式，確保選項在 dark 模式下清楚可見
    - 為所有 `<option>` 元素添加 `bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100` 樣式
    - 添加自定義下拉箭頭圖標（ChevronDown），因為使用了 `appearance-none`
    - 所有 select 元素使用 `relative` 容器包裹，以便定位下拉箭頭
  - 改善取消按鈕在 dark 模式下的可見性：
    - 添加背景色 `bg-white dark:bg-gray-700`
    - 添加邊框 `border border-gray-200 dark:border-gray-600`
    - 改善文字顏色 `text-gray-600 dark:text-gray-300`
    - 改善 hover 狀態 `hover:bg-gray-50 dark:hover:bg-gray-600`
  - 統一所有 label 的 dark 模式樣式：
    - 所有 label 都添加 `dark:text-gray-400` 樣式，確保在 dark 模式下清楚可見
  - 改善底部區域的 dark 模式樣式：
    - 添加 `dark:border-gray-700` 和 `dark:bg-gray-800/50` 樣式

### Features
- 所有選單在 dark 模式下都有清楚的背景色和文字顏色
- 取消按鈕在 dark 模式下有明顯的背景和邊框，更容易識別
- 所有輸入框使用統一的 `inputClasses` 樣式
- 所有 label 在 dark 模式下都有適當的文字顏色

## 2025-12-26 22:20:00 - 修改 Excel 匯出格式，按照圖片布局並添加統編欄位

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 Excel 匯出格式，按照圖片中的布局：
    - 第一行：年份和月份（例如：2025年01月）
    - 空一行
    - 第3行：單月總台數和數值
    - 第4行：單月總金額和數值
    - 空一行
    - 第6行：表頭（合作商名稱、統編、台數、金額）
    - 第7行開始：數據行（合作商名稱、統編、台數、金額）
  - 添加統編欄位：
    - 在匯出時獲取合作商列表以匹配統編
    - 根據合作商名稱匹配對應的統編
    - 如果找不到統編，顯示空字串
  - 將 Excel 匯出改為單一工作表（「合作商單月統計」）
  - 設置列寬以改善可讀性
  - 將 `handleExportExcel` 改為異步函數以獲取合作商數據

### Features
- Excel 匯出格式現在完全符合圖片中的布局
- 包含統編欄位，方便識別合作商
- 單一工作表設計，更符合使用習慣

## 2025-12-26 22:05:00 - 修復構建錯誤，移除 exceljs 依賴

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修復構建錯誤：移除 `exceljs` 導入和使用
  - 改回使用 `xlsx` 庫進行 Excel 匯出（更適合瀏覽器環境）
  - 將 `handleExportExcel` 函數改回同步函數（不再需要異步操作）
  - Excel 匯出功能保持不變：
    - 「總體統計」工作表：單月總台數、單月總金額
    - 「合作商統計」工作表：各合作商的名稱、台數和金額明細

### Bug Fixes
- 修復 Vite 構建錯誤：`exceljs` 無法在瀏覽器環境中正確解析
- 解決 Rollup 構建失敗問題

## 2025-12-26 22:03:50 - 移除 Excel 匯出中的柱狀圖

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 移除 Excel 匯出中的柱狀圖功能：
    - 移除圖表容器創建和 Canvas 繪製代碼
    - 移除 html2canvas 截圖功能
    - 移除圖片插入到 Excel 的代碼
    - 移除 html2canvas 導入
  - Excel 匯出現在只包含數據：
    - 「總體統計」工作表：單月總台數、單月總金額
    - 「合作商統計」工作表：各合作商的名稱、台數和金額明細

### Changes
- 簡化 Excel 匯出功能，只匯出數據表格，不包含圖表
- 減少匯出時間和文件大小

## 2025-12-26 21:55:00 - 改進 Excel 匯出柱狀圖，確保雙Y軸數值清晰顯示

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 改進 Excel 匯出中的柱狀圖繪製：
    - 增強Y軸顯示：
      - 左側Y軸：繪製藍色Y軸線，清晰顯示「台數」標題和所有數值刻度
      - 右側Y軸：繪製綠色Y軸線，清晰顯示「金額 (TWD)」標題和所有數值刻度
      - 金額數值格式化：超過1000顯示為「$X.Xk」格式，小於1000顯示為「$X」
    - 柱狀圖高度計算：
      - 台數柱高度根據左側Y軸（maxCount）計算，形成獨立的高度比例
      - 金額柱高度根據右側Y軸（maxAmount）計算，形成獨立的高度比例
      - 兩個系列使用不同的Y軸刻度範圍，確保柱狀圖高度能正確反映各自的數值大小
    - 視覺改進：
      - Y軸標題字體加大（16px）並加粗
      - Y軸數值標籤加粗（12px bold）
      - 增加Y軸線的粗細（2px）和顏色對應

### Features
- Excel 匯出的柱狀圖現在具有清晰的雙Y軸設計：
  - 左側Y軸：藍色，顯示台數的所有數值刻度（0, 1, 2, ...）
  - 右側Y軸：綠色，顯示金額的所有數值刻度（格式化顯示）
  - 柱狀圖高度：
    - 藍色柱（台數）的高度對應左側Y軸的數值範圍
    - 綠色柱（金額）的高度對應右側Y軸的數值範圍
    - 由於使用不同的Y軸刻度，兩個系列會形成不同的高度比例，更準確地反映各自的數值大小

## 2025-12-26 21:50:00 - 改進 Excel 匯出柱狀圖，添加雙Y軸顯示

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 改進 Excel 匯出中的柱狀圖繪製：
    - 添加雙Y軸設計：
      - 左側Y軸：顯示台數（藍色標籤和數值）
      - 右側Y軸：顯示金額（綠色標籤和數值）
    - 柱狀圖顏色：
      - 台數柱：藍色（#3b82f6）
      - 金額柱：綠色（#10b981）
    - 添加網格線和Y軸刻度標籤
    - 改進圖表布局和可讀性
    - 增加 Canvas 尺寸以容納雙Y軸（800x400）

### Features
- Excel 匯出的柱狀圖現在包含完整的雙Y軸設計：
  - 左側Y軸顯示台數的數值範圍（藍色）
  - 右側Y軸顯示金額的數值範圍（綠色）
  - 柱狀圖清晰顯示各合作商的台數和金額對比
  - 圖表包含網格線、圖例和軸標籤，更易於閱讀

## 2025-12-26 21:45:00 - 修復 Excel 匯出功能，使用圖片方式插入柱狀圖

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修復 Excel 匯出失敗問題：
    - 由於 `exceljs` 在瀏覽器環境中不支持直接創建圖表，改用將圖表轉換為圖片的方式
    - 使用 `html2canvas` 庫將圖表轉換為 PNG 圖片
    - 使用 Canvas API 繪製柱狀圖（更準確的數據可視化）
    - 將圖片插入到 Excel 文件的「合作商統計」工作表中
    - 圖片位置設置在數據下方，尺寸為 600x300 像素
  - 改進錯誤處理：如果圖表截圖失敗，仍會匯出不含圖表的 Excel 文件

- **package.json** (`system/backend/package.json`)
  - 添加 `html2canvas` 依賴（版本 1.4.1）用於圖表截圖

### Bug Fixes
- 修復 Excel 匯出失敗的問題
- 解決 `exceljs` 在瀏覽器環境中不支持圖表的限制

### Features
- Excel 匯出現在包含柱狀圖表（以圖片形式）：
  - 總體統計工作表：單月總台數、單月總金額
  - 合作商統計工作表：各合作商的台數和金額明細，並包含柱狀圖表圖片
  - 柱狀圖使用 Canvas API 繪製，包含台數（藍色）和金額（綠色）兩個系列

## 2025-12-26 21:38:31 - Excel 匯出功能加入柱狀圖表

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 將 Excel 匯出功能從 `xlsx` 庫改為使用 `exceljs` 庫
  - 修改 `handleExportExcel` 函數為異步函數：
    - 使用 `exceljs` 創建包含柱狀圖的 Excel 文件
    - 在「合作商統計」工作表中添加柱狀圖表
    - 柱狀圖包含兩個系列：
      - 台數系列（藍色）：顯示各合作商的訂單台數
      - 金額系列（綠色）：顯示各合作商的業績金額
    - 添加隱藏的「金額（數字）」列用於圖表數據引用
    - 圖表位置設置在 E2 單元格，寬度 16，高度 10

- **package.json** (`system/backend/package.json`)
  - 添加 `exceljs` 依賴（版本 4.4.0）

### Features
- Excel 匯出現在包含可視化的柱狀圖表：
  - 總體統計工作表：單月總台數、單月總金額
  - 合作商統計工作表：各合作商的台數和金額明細，並包含柱狀圖表
  - 柱狀圖表可以直觀地展示各合作商的業績對比，方便進行數據分析和報表製作

## 2025-12-26 21:32:56 - Excel 匯出功能加入合作商柱狀圖數據

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `handleExportExcel` 函數：
    - 新增合作商統計數據到 Excel 匯出
    - Excel 文件包含兩個工作表：
      - 「總體統計」工作表：包含單月總台數和單月總金額
      - 「合作商統計」工作表：包含各合作商的名稱、台數和金額（按金額降序排列）
    - 合作商數據來自 `stats.partner_stats`，與柱狀圖顯示的數據一致

### Features
- Excel 匯出現在包含完整的統計數據：
  - 總體統計：單月總台數、單月總金額
  - 合作商統計：各合作商的台數和金額明細，方便進行數據分析和報表製作

## 2025-12-26 - 訂單管理添加 Excel 導出和柱狀圖功能

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 安裝並導入 `xlsx` 和 `recharts` 庫
  - 添加 `Download` 圖標導入
  - 實現 `handleExportExcel` 函數：
    - 將當前月份的訂單數據轉換為 Excel 格式
    - 文件名格式：`export-YYYYMM.xlsx`（例如：`export-202512.xlsx`）
    - 包含所有訂單的詳細資訊（訂單編號、狀態、承租人、預約日期、機車型號、合作商、付款方式、金額等）
  - 添加柱狀圖組件：
    - 使用 `recharts` 的 `BarChart` 顯示合作商業績統計
    - 雙 Y 軸設計：左軸顯示訂單數，右軸顯示金額
    - X 軸顯示合作商名稱，角度 -45 度以便閱讀
    - 藍色柱狀圖表示訂單數，綠色柱狀圖表示金額
  - 添加匯出說明卡片，說明 Excel 導出功能的使用方式
  - 修復類型錯誤：為 `partner_stats` 數據添加類型斷言

- **package.json** (`system/backend/package.json`)
  - 添加 `xlsx` 依賴（版本 0.18.5）
  - 添加 `recharts` 依賴（版本 3.6.0）

### Features
- Excel 導出功能：
  - 點擊「匯出 Excel」按鈕即可下載當前月份的訂單資料
  - 文件名根據選擇的年份和月份動態生成（格式：`export-YYYYMM.xlsx`）
  - 包含完整的訂單資訊，方便進行數據分析和報表製作
- 柱狀圖統計：
  - 直觀顯示各合作商的訂單數量和金額
  - 雙 Y 軸設計，方便同時查看訂單數和金額
  - 響應式設計，適應不同屏幕尺寸
- 用戶體驗：
  - 匯出按鈕位於柱狀圖標題旁邊，方便操作
  - 提供匯出說明，幫助用戶理解功能
  - 當沒有數據時顯示友好的提示訊息

---

## 2025-12-26 16:59:54 - 訂單管理月份選擇顯示有訂單的月份背景色

### Backend Changes
- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 新增 `getMonthsByYear` 方法，接收年份參數，返回該年份中有訂單的月份列表
  - 使用 `MONTH(appointment_date)` 提取月份，並過濾指定年份的訂單
  - 返回不重複的月份數組，按升序排列

- **api.php** (`routes/api.php`)
  - 新增路由 `GET /api/orders/months`，用於查詢指定年份中有訂單的月份

### Frontend Changes
- **api.ts** (`system/backend/lib/api.ts`)
  - 在 `ordersApi` 中添加 `getMonthsByYear` 方法，調用後端 API 獲取指定年份的月份列表

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 添加 `monthsWithOrders` 狀態，用於儲存當前年份中有訂單的月份列表
  - 實現 `fetchMonthsWithOrders` 函數，調用 API 獲取指定年份的月份列表
  - 在 `useEffect` 中，當 `selectedYear` 改變時自動調用 `fetchMonthsWithOrders`
  - 在 `handleYearChange` 中調用 `fetchMonthsWithOrders`，確保年份切換時更新月份列表
  - 在 `AddOrderModal` 的 `onClose` 回調中，當年份改變時也調用 `fetchMonthsWithOrders`
  - 為月份下拉選單的 `<option>` 添加條件樣式：如果該月份有訂單，則顯示淡橘色背景（`#fff7ed`）

### Features
- 當選擇年份時，系統會自動查詢該年份中有訂單的月份
- 月份下拉選單中，有訂單的月份會顯示淡橘色背景，方便用戶快速識別
- 切換年份時，月份背景色會自動更新
- 新增或更新訂單後，如果年份改變，會自動更新月份背景色

---

## 2025-12-26 14:26:13 - 機車配件管理頁面添加操作下拉選單

### Frontend Changes
- **AccessoriesPage.tsx** (`system/backend/pages/AccessoriesPage.tsx`)
  - 導入 `MoreHorizontal` 和 `Edit3` 圖標，並添加 `useRef` hook
  - 添加操作下拉選單的狀態管理：
    - `openDropdownId`: 追蹤當前打開的下拉選單 ID
    - `dropdownPosition`: 儲存下拉選單的位置（top, right）
    - `dropdownRefs`: 用於引用下拉選單 DOM 元素
    - `buttonRefs`: 用於引用觸發按鈕 DOM 元素
  - 實現 `toggleDropdown` 函數：計算下拉選單位置並切換顯示狀態
  - 修改 `handleEdit` 函數：關閉下拉選單後打開編輯模態框
  - 修改 `handleDelete` 函數：關閉下拉選單後執行刪除操作
  - 將操作欄位從兩個獨立按鈕（編輯、刪除）改為 `MoreHorizontal` 圖標按鈕
  - 添加下拉選單的渲染邏輯，使用 `fixed` 定位避免被表格 `overflow` 裁剪
  - 添加滾動監聽器，當頁面滾動時自動關閉下拉選單
  - 下拉選單包含「編輯」和「刪除」選項，樣式與其他管理頁面一致

### Features
- 操作欄位統一使用下拉選單設計，與其他管理頁面保持一致
- 下拉選單使用 `fixed` 定位，確保不會被表格容器裁剪
- 點擊外部區域或滾動頁面時自動關閉下拉選單
- 更好的用戶體驗和視覺一致性

---

## 2025-12-26 14:18:30 - 隱藏會員管理功能

### Frontend Changes
- **constants.tsx** (`system/backend/constants.tsx`)
  - 從「系統」導航菜單中移除「會員管理」子項目
  - 用戶將無法在側邊欄看到會員管理選項

- **App.tsx** (`system/backend/App.tsx`)
  - 移除 `MembersPage` 的導入
  - 移除 `/members` 路由定義
  - 用戶將無法通過路由訪問會員管理頁面

### Features
- 會員管理功能已完全隱藏
- 側邊欄「系統」選單下不再顯示「會員管理」選項
- 無法通過直接輸入 URL 訪問會員管理頁面
- 簡化了管理界面，移除了不需要的功能

---

## 2025-12-26 14:17:29 - 系統管理者編輯模式下 Email 欄位不可編輯

### Frontend Changes
- **AdminsPage.tsx** (`system/backend/pages/AdminsPage.tsx`)
  - 修改 Email 輸入欄位，在編輯模式下設為只讀和禁用
  - 當 `editingAdmin` 不為 null 時，Email 欄位無法編輯
  - 添加視覺樣式：禁用狀態下顯示灰色背景和降低透明度，並顯示「不允許」游標
  - 新增管理者時，Email 欄位可以正常編輯
  - 編輯現有管理者時，Email 欄位為只讀狀態

### Features
- 新增管理者時，Email 可以正常輸入
- 編輯管理者時，Email 欄位不可編輯，防止修改已存在的 Email
- 更好的數據完整性保護
- 清晰的視覺反饋，用戶可以明確知道 Email 欄位不可編輯

---

## 2025-12-26 14:16:33 - 隱藏網站管理功能

### Frontend Changes
- **constants.tsx** (`system/backend/constants.tsx`)
  - 從導航菜單中移除「網站管理」項目及其子項目「首頁輪播圖」
  - 用戶將無法在側邊欄看到網站管理選項

- **App.tsx** (`system/backend/App.tsx`)
  - 移除 `BannersPage` 的導入
  - 移除 `/banners` 路由定義
  - 用戶將無法通過路由訪問首頁輪播圖頁面

### Features
- 網站管理功能已完全隱藏
- 側邊欄不再顯示「網站管理」選項
- 無法通過直接輸入 URL 訪問首頁輪播圖頁面
- 簡化了管理界面，移除了不需要的功能

---

## 2025-12-26 14:15:23 - 系統管理者維護頁面添加操作下拉選單

### Frontend Changes
- **AdminsPage.tsx** (`system/backend/pages/AdminsPage.tsx`)
  - 添加 `MoreHorizontal` 圖標導入
  - 添加 `useRef` hook 導入
  - 新增狀態管理：
    - `openDropdownId`: 追蹤當前打開的下拉選單 ID
    - `dropdownPosition`: 存儲下拉選單的位置
    - `dropdownRefs`: 存儲下拉選單元素的引用
    - `buttonRefs`: 存儲觸發按鈕的引用
  - 新增 `toggleDropdown()` 函數：處理下拉選單的打開/關閉，並計算位置
  - 新增 `handleEdit()` 函數：打開編輯模態框並關閉下拉選單
  - 修改 `handleDelete()` 函數：在刪除後關閉下拉選單
  - 修改表格操作列：將原本的兩個獨立按鈕（編輯、刪除）改為一個 `MoreHorizontal` 按鈕，點擊後顯示下拉選單
  - 特殊處理：對於 `admin@admin.com`，下拉選單只顯示「編輯」選項，不顯示「刪除」選項
  - 添加下拉選單渲染邏輯：使用 `fixed` 定位，避免被表格 `overflow` 裁剪
  - 添加滾動監聽：當頁面滾動時自動關閉下拉選單
  - 添加點擊外部關閉功能：點擊遮罩層可關閉下拉選單
  - 操作列標題改為居中對齊

### Features
- 操作列現在使用下拉選單，與訂單管理、合作商管理和商店管理頁面保持一致
- 下拉選單包含「編輯」和「刪除」兩個選項（對於非預設管理員）
- 對於預設管理員（admin@admin.com），下拉選單只顯示「編輯」選項
- 下拉選單使用固定定位，不會被表格裁剪
- 支援點擊外部和滾動時自動關閉
- 更好的用戶體驗和一致的 UI 設計

---

## 2025-12-26 14:13:48 - 商店管理頁面添加操作下拉選單

### Frontend Changes
- **StoresPage.tsx** (`system/backend/pages/StoresPage.tsx`)
  - 添加 `MoreHorizontal` 圖標導入
  - 添加 `useRef` hook 導入
  - 新增狀態管理：
    - `openDropdownId`: 追蹤當前打開的下拉選單 ID
    - `dropdownPosition`: 存儲下拉選單的位置
    - `dropdownRefs`: 存儲下拉選單元素的引用
    - `buttonRefs`: 存儲觸發按鈕的引用
  - 新增 `toggleDropdown()` 函數：處理下拉選單的打開/關閉，並計算位置
  - 新增 `handleEdit()` 函數：打開編輯模態框並關閉下拉選單
  - 修改 `handleDelete()` 函數：在刪除後關閉下拉選單
  - 修改表格操作列：將原本的兩個獨立按鈕（編輯、刪除）改為一個 `MoreHorizontal` 按鈕，點擊後顯示下拉選單
  - 添加下拉選單渲染邏輯：使用 `fixed` 定位，避免被表格 `overflow` 裁剪
  - 添加滾動監聽：當頁面滾動時自動關閉下拉選單
  - 添加點擊外部關閉功能：點擊遮罩層可關閉下拉選單
  - 操作列標題改為居中對齊

### Features
- 操作列現在使用下拉選單，與訂單管理和合作商管理頁面保持一致
- 下拉選單包含「編輯」和「刪除」兩個選項
- 下拉選單使用固定定位，不會被表格裁剪
- 支援點擊外部和滾動時自動關閉
- 更好的用戶體驗和一致的 UI 設計

---

## 2025-12-26 14:10:18 - 合作商管理頁面添加操作下拉選單

### Frontend Changes
- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 添加 `MoreHorizontal` 圖標導入
  - 添加 `useRef` hook 導入
  - 新增狀態管理：
    - `openDropdownId`: 追蹤當前打開的下拉選單 ID
    - `dropdownPosition`: 存儲下拉選單的位置
    - `dropdownRefs`: 存儲下拉選單元素的引用
    - `buttonRefs`: 存儲觸發按鈕的引用
  - 新增 `toggleDropdown()` 函數：處理下拉選單的打開/關閉，並計算位置
  - 新增 `handleEdit()` 函數：打開編輯模態框並關閉下拉選單
  - 修改 `handleDelete()` 函數：在刪除後關閉下拉選單
  - 修改表格操作列：將原本的兩個獨立按鈕（編輯、刪除）改為一個 `MoreHorizontal` 按鈕，點擊後顯示下拉選單
  - 添加下拉選單渲染邏輯：使用 `fixed` 定位，避免被表格 `overflow` 裁剪
  - 添加滾動監聽：當頁面滾動時自動關閉下拉選單
  - 添加點擊外部關閉功能：點擊遮罩層可關閉下拉選單

### Features
- 操作列現在使用下拉選單，與訂單管理頁面保持一致
- 下拉選單包含「編輯」和「刪除」兩個選項
- 下拉選單使用固定定位，不會被表格裁剪
- 支援點擊外部和滾動時自動關閉
- 更好的用戶體驗和一致的 UI 設計

---

## 2025-12-26 14:05:28 - 通過 API 獲取訂單預約日期的年份列表

### Backend Changes
- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 新增 `getYears()` 方法，從資料庫中查詢所有訂單的預約日期年份
  - 使用 `YEAR(appointment_date)` 提取年份
  - 使用 `distinct()` 去重
  - 按年份升序排序
  - 返回年份數組

- **routes/api.php**
  - 新增路由 `GET /api/orders/years`，對應 `OrderController@getYears`
  - 路由位置在 `/orders/statistics` 之後，避免與 `/{order}` 路由衝突

### Frontend Changes
- **api.ts** (`system/backend/lib/api.ts`)
  - 在 `ordersApi` 中新增 `getYears()` 方法
  - 調用 `/orders/years` API 端點

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 新增 `availableYears` state 來存儲從 API 獲取的年份列表
  - 新增 `fetchYears()` 函數來獲取年份列表
  - 在組件初始化時調用 `fetchYears()`
  - 修改 `getAvailableYears()` 函數，使用 API 返回的年份列表
  - 確保當前選中的年份也在列表中（即使 API 沒有返回）
  - 在新增/更新訂單後，重新獲取年份列表，確保新年份能及時顯示

### Features
- 年份列表現在從資料庫中準確獲取，不會有判斷錯誤
- 當新增或更新訂單時，年份列表會自動更新
- 如果當前選中的年份不在 API 返回的列表中，會自動加入列表
- 更準確和可靠的年份選擇器

---

## 2025-12-26 14:03:14 - 年份選擇器動態顯示訂單預約日期的年份

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `getAvailableYears` 函數，從訂單列表中動態提取所有預約日期的年份
  - 從每個訂單的 `appointment_date` 中提取年份
  - 使用 `Set` 去重，確保年份不重複
  - 確保當前選中的年份也在列表中（即使該年份沒有訂單）
  - 年份按升序排序顯示
  - 如果沒有訂單，至少顯示當前選中的年份

### Features
- 年份選擇器現在動態顯示所有訂單中出現過的年份
- 當訂單列表更新時，年份列表也會自動更新
- 確保當前選中的年份始終在列表中，避免選擇器顯示錯誤

---

## 2025-12-26 14:00:19 - 固定年份選擇器顯示 2025 和 2026

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `getAvailableYears` 函數，固定返回 `[2025, 2026]`
  - 年份選擇器現在固定顯示 2025 和 2026 兩個選項
  - 移除了動態計算到當前年份的邏輯

### Features
- 年份選擇器固定顯示 2025 和 2026
- 簡化了年份選項邏輯

---

## 2025-12-26 13:57:14 - 訂單預約日期自動更新年份選擇器

### Frontend Changes
- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 添加 `onYearChange` prop，用於通知父組件年份改變
  - 在預約日期 `onChange` 處理中，提取年份並調用 `onYearChange` 回調
  - 當用戶選擇預約日期時，自動更新年份選擇器

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 傳遞 `onYearChange` 回調給 `AddOrderModal`
  - 當年份改變時，更新 `selectedYear` 狀態
  - 確保年份選擇器與預約日期同步

### Features
- 當在訂單表單中填寫預約日期時，年份選擇器會自動切換到該日期的年份
- 提升用戶體驗，減少手動切換年份的操作
- 保持年份選擇器與預約日期的一致性

---

## 2025-12-26 13:55:36 - 將合作商的商店主管欄位改為非必填

### Database Changes
- **Migration** (`database/migrations/2025_12_26_135450_make_manager_nullable_in_partners_table.php`)
  - 將 `partners` 表的 `manager` 欄位改為 `nullable`
  - 允許商店主管欄位為空值

### Frontend Changes
- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 移除「商店主管」欄位的必填標記（紅色星號）
  - 移除 `required` 屬性
  - 更新 `Partner` interface，將 `manager` 改為 `string | null`
  - 更新表格顯示：當 `manager` 為空時顯示 `-`
  - 更新表單初始化：當編輯時，如果 `manager` 為 `null`，設為空字串

### Backend Changes
- **PartnerController.php** (`app/Http/Controllers/Api/PartnerController.php`)
  - 在 `store` 和 `update` 方法中，將 `manager` 驗證規則從 `required|string|max:255` 改為 `nullable|string|max:255`
  - 允許建立和更新合作商時不填寫商店主管

### Features
- 商店主管欄位現在為選填
- 前端和後端驗證一致
- 資料庫結構已更新

---

## 2025-12-26 11:48:03 - 為罰單管理頁面添加空狀態說明

### Frontend Changes
- **添加空狀態顯示** (`system/backend/pages/FinesPage.tsx`)
  - 當沒有罰單資料時，顯示友好的提示訊息
  - 使用 `AlertCircle` 圖標
  - 根據是否有搜尋或篩選條件顯示不同的訊息：
    - 有搜尋或篩選條件：顯示「目前沒有符合條件的罰單資料」
    - 沒有搜尋或篩選條件：顯示「目前沒有罰單資料」，並提示用戶點擊「登記新罰單」按鈕
  - 支援深色模式

### 樣式特點
- 居中顯示的圖標和文字
- 清晰的視覺層次
- 友好的用戶引導

### Features
- 更好的用戶體驗
- 明確的狀態提示
- 引導用戶進行操作

---

## 2025-12-26 11:44:15 - 修復新增訂單後列表不刷新的問題

### 問題
- 新增訂單完成後，如果預約日期在當前月份，列表不會自動刷新
- 只有當月份改變時，useEffect 才會觸發刷新

### 解決方案
- **改進 AddOrderModal 的 onClose 回調** (`system/backend/pages/OrdersPage.tsx`)
  - 檢查月份是否改變
  - 如果月份改變了，useEffect 會自動觸發刷新
  - 如果月份沒有改變，手動刷新訂單列表和統計
  - 確保無論如何，新增/更新訂單後列表都會刷新

### 檔案變更
- `system/backend/pages/OrdersPage.tsx`
  - 改進 `onClose` 回調邏輯，確保列表總是會刷新

### 結果
- 新增/更新訂單後，列表會自動刷新
- 更好的用戶體驗

---

## 2025-12-26 11:41:27 - 修復刪除訂單時的日期解析錯誤

### 問題
- 刪除訂單時出現錯誤：`Could not parse '12-01': Failed to parse time string (12-01)`
- 原因：`handleDelete` 函數中使用了 `month: selectedMonth`（數字）而不是 `month: selectedMonthString`（字符串格式 'YYYY-MM'）
- 導致 API 嘗試解析 '12' 而不是 '2025-12'，造成日期解析失敗

### 解決方案
- **修復 handleDelete 函數** (`system/backend/pages/OrdersPage.tsx`)
  - 將 `month: selectedMonth` 改為 `month: selectedMonthString`
  - 改進錯誤處理，針對 404 錯誤（訂單不存在）顯示更友好的提示訊息

### 檔案變更
- `system/backend/pages/OrdersPage.tsx`
  - 修復 `handleDelete` 函數中的月份參數
  - 改進錯誤處理邏輯

### 結果
- 刪除訂單功能現在正常工作
- 不再出現日期解析錯誤
- 更好的錯誤提示訊息

---

## 2025-12-26 11:36:27 - 設置應用程式時區為 Asia/Taipei

### Backend Changes
- **更新 Laravel 時區配置** (`config/app.php`)
  - 將 `timezone` 從 `'UTC'` 改為 `'Asia/Taipei'`

- **更新 AppServiceProvider** (`app/Providers/AppServiceProvider.php`)
  - 在 `boot()` 方法中設置 Carbon 預設時區為 `Asia/Taipei`
  - 設置 PHP 預設時區為 `Asia/Taipei`
  - 設置 Carbon 語言為 `zh_TW`

- **更新 OrderController** (`app/Http/Controllers/Api/OrderController.php`)
  - 在 `index()` 方法中，Carbon 日期解析時明確設置時區為 `Asia/Taipei`
  - 在 `statistics()` 方法中，Carbon 日期解析時明確設置時區為 `Asia/Taipei`

### 影響範圍
- 所有日期和時間處理將使用 Asia/Taipei 時區
- 避免時區轉換導致的日期偏移問題
- 確保日期篩選和統計功能使用正確的時區

---

## 2025-12-26 11:34:51 - 優化月份選擇和訂單篩選邏輯

### 主要變更

1. **固定月份選擇為 1-12 月**
   - 移除動態月份限制邏輯
   - `getAvailableMonths()` 現在固定返回 1-12 月
   - 移除 `handleYearChange` 中的月份限制邏輯

2. **一進入就載入當前月份**
   - 初始化時自動設置為當前年份和月份（已實現）

3. **訂單列表根據預約日期篩選**
   - API 使用 `appointment_date` 欄位進行月份篩選（已實現）
   - 顯示該月份的所有訂單

4. **新增/更新訂單後自動跳轉到預約日期所在月份**
   - 修改 `AddOrderModal` 的 `onClose` 回調，接受 `appointmentDate` 參數
   - 在 `OrdersPage` 中處理新增/更新後的月份跳轉
   - 根據預約日期自動切換到對應的年份和月份

5. **移除自動切換月份邏輯**
   - 移除 `autoSwitchedRef` 相關邏輯
   - 移除首次載入時的自動切換檢查

### 檔案變更

- `system/backend/pages/OrdersPage.tsx`
  - 固定月份選擇為 1-12 月
  - 移除月份限制邏輯
  - 實現新增/更新後的月份跳轉
  - 移除自動切換月份邏輯

- `system/backend/components/AddOrderModal.tsx`
  - 修改 `onClose` 回調，傳遞預約日期
  - 新增/更新訂單時傳遞預約日期給父組件

### Features
- 月份選擇更簡單直觀（固定 1-12 月）
- 新增/更新訂單後自動跳轉到預約日期所在月份
- 更好的用戶體驗

---

## 2025-12-26 11:28:20 - 修改狀態下拉選單背景顏色

### Frontend Changes
- **更新下拉選單背景樣式** (`system/backend/pages/OrdersPage.tsx`)
  - 將下拉選單背景從白色 (`bg-white`) 改為淺灰色 (`bg-gray-50`)
  - 添加 `backdrop-blur-sm` 效果，提供更柔和的視覺效果
  - 深色模式保持 `dark:bg-gray-800`

### 樣式改進
- 更柔和的背景顏色，不再是純白色
- 更好的視覺層次感
- 與整體設計更協調

---

## 2025-12-26 11:26:26 - 修復狀態下拉選單被表格遮擋的問題

### 問題
- 狀態下拉選單使用 `absolute` 定位，在表格的 `overflow-x-auto` 容器中被裁剪
- 下拉選單無法完整顯示，被表格邊界遮擋

### 解決方案
- **改用 fixed 定位** (`system/backend/pages/OrdersPage.tsx`)
  - 將狀態下拉選單從 `absolute` 改為 `fixed` 定位
  - 動態計算按鈕位置（使用 `getBoundingClientRect()`）
  - 添加遮罩層處理點擊外部關閉
  - 滾動時自動關閉下拉選單
  - 確保 z-index 足夠高（z-50）

### 實現細節
- 添加 `statusDropdownPosition` 狀態追蹤下拉選單位置
- 點擊按鈕時計算位置並設置下拉選單
- 使用 `fixed` 定位確保下拉選單不被表格容器裁剪
- 與操作下拉選單使用相同的實現方式

### 結果
- 下拉選單現在可以完整顯示，不會被表格邊界遮擋
- 更好的用戶體驗
- 與操作下拉選單保持一致的行為

---

## 2025-12-26 11:23:41 - 將訂單狀態選擇改為自定義下拉選單

### Frontend Changes
- **替換狀態選擇為自定義下拉選單** (`system/backend/pages/OrdersPage.tsx`)
  - 將原生的 `<select>` 元素替換為自定義下拉選單組件
  - 按鈕顯示當前選中的狀態，帶有對應的顏色背景和邊框
  - 點擊按鈕打開/關閉下拉選單
  - 下拉選單中顯示所有狀態選項
  - 當前選中的選項在選單中高亮顯示（藍色背景）
  - 添加 `ChevronDown` 圖標，打開時旋轉 180 度
  - 點擊外部自動關閉下拉選單
  - 支援深色模式

### 樣式特點
- **按鈕樣式**：
  - 已預訂：橙色背景 (`bg-orange-50 text-orange-700 border-orange-200`)
  - 進行中：藍色背景 (`bg-blue-50 text-blue-700 border-blue-200`)
  - 待接送：黃色背景 (`bg-yellow-50 text-yellow-700 border-yellow-200`)
  - 已完成：綠色背景 (`bg-green-50 text-green-700 border-green-200`)
  - 在合作商：紫色背景 (`bg-purple-50 text-purple-700 border-purple-200`)

- **下拉選單樣式**：
  - 白色背景，圓角邊框
  - 當前選中項：藍色背景高亮
  - 其他選項：懸停時灰色背景
  - 陰影效果，z-index 確保顯示在最上層

### Features
- 更美觀的用戶界面
- 更好的用戶體驗
- 符合設計規範的自定義下拉選單
- 支援深色模式

---

## 2025-12-26 11:05:44 - 修復訂單狀態 Enum Migration

### 問題
- Migration 執行失敗，錯誤：`Data truncated for column 'status'`
- 原因：資料庫中仍有舊狀態值（「預約中」、「已取消」），無法直接修改 enum

### 解決方案
- **修復 Migration** (`database/migrations/2025_12_26_025817_update_orders_status_enum.php`)
  - 步驟 1: 先將 enum 改為包含所有新舊狀態值
  - 步驟 2: 更新現有資料（「預約中」→「已預訂」，「已取消」→「已完成」）
  - 步驟 3: 再將 enum 改為只包含新狀態值
  - 這樣可以安全地遷移資料而不會造成資料截斷

### 結果
- Migration 成功執行
- 所有訂單狀態已正確更新為新狀態值
- 資料庫 enum 已更新為：已預訂、進行中、待接送、已完成、在合作商

---

## 2025-12-26 11:03:33 - 添加訂單狀態專用更新 API

### Backend Changes
- **新增狀態更新端點** (`app/Http/Controllers/Api/OrderController.php`)
  - 添加 `updateStatus` 方法，專門處理訂單狀態更新
  - 端點：`PATCH /api/orders/{order}/status`
  - 只驗證 `status` 字段，不需要其他必填字段
  - 自動更新相關機車狀態（根據訂單狀態）

- **更新 API Routes** (`routes/api.php`)
  - 添加 `PATCH /api/orders/{order}/status` 路由

### Frontend Changes
- **更新 API Client** (`system/backend/lib/api.ts`)
  - 添加 `patch` 方法支援 PATCH 請求
  - 添加 `updateStatus` 方法到 `ordersApi`

- **更新訂單狀態更新邏輯** (`system/backend/pages/OrdersPage.tsx`)
  - 改用 `ordersApi.updateStatus()` 而不是 `ordersApi.update()`
  - 只傳遞狀態值，不需要完整的訂單數據

### Features
- 專門的狀態更新端點，更符合 RESTful 設計
- 只更新狀態時不需要提供其他必填字段
- 自動處理機車狀態更新邏輯
- 更清晰的 API 設計

---

## 2025-12-26 11:00:30 - 訂單管理功能增強

### 主要變更

1. **修復日期選擇器日期差一日的問題**
   - 修復了預約日期選擇時，點選的日期與顯示日期相差一日的問題
   - 改用本地時間格式化（`getFullYear()`, `getMonth()`, `getDate()`），避免時區轉換導致的日期偏移

2. **將預約日期、開始時間、結束時間改為非必選**
   - 前端：移除了預約日期、開始時間、結束時間的必填標記（紅色星號）
   - 後端：將 `appointment_date`、`start_time`、`end_time` 的驗證規則從 `required` 改為 `nullable`
   - 驗證邏輯：如果 `start_time` 和 `end_time` 都存在，仍會驗證結束時間必須在開始時間之後

3. **將狀態改為下拉選單**
   - 訂單列表中的狀態欄位改為可編輯的下拉選單
   - 狀態選項：已預訂、進行中、待接送、已完成、在合作商
   - 每個狀態都有對應的顏色標識（支援深色模式）
   - 狀態變更時會自動更新訂單並重新載入列表

4. **新增訂單時預設狀態為已預訂**
   - 新增訂單時，預設狀態從「預約中」改為「已預訂」
   - 在 `AddOrderModal` 中添加了狀態選擇下拉選單

5. **實現狀態變更時機車狀態自動更新邏輯**
   - 當訂單狀態為「已預訂」、「已完成」、「待接送」時，訂單內選擇的機車狀態一律變為「待出租」
   - 當訂單狀態為「進行中」、「在合作商」時，訂單內選擇的機車狀態為「出租中」
   - 此邏輯同時應用於新增訂單和更新訂單

6. **實現預約日期跨月自動切換功能**
   - 當訂單的預約日期與當前選擇的月份不同時，自動切換到預約日期所在的月份
   - 只在首次載入時檢查（`currentPage === 1`），避免無限循環
   - 使用 `useRef` 追蹤是否已經自動切換過
   - 當搜索條件或頁面改變時，重置自動切換標記

7. **合作商統計使用隨機顏色區分**
   - 各店業績分佈中的合作商標識使用隨機顏色（不重複）
   - 提供 10 種顏色選項，按順序循環使用
   - 支援深色模式

### 資料庫變更

- 創建 migration `2025_12_26_025817_update_orders_status_enum.php`
  - 更新 `orders` 表的 `status` enum 值為：已預訂、進行中、待接送、已完成、在合作商
  - 預設值改為「已預訂」

### 檔案變更

- `system/backend/components/AddOrderModal.tsx`
  - 修復日期選擇器使用本地時間格式化
  - 移除預約日期、開始時間、結束時間的必填標記
  - 添加狀態選擇下拉選單
  - 新增訂單預設狀態為「已預訂」
  - 更新表單驗證邏輯，只驗證總金額為必填

- `system/backend/pages/OrdersPage.tsx`
  - 狀態欄位改為可編輯的下拉選單
  - 實現跨月自動切換邏輯
  - 合作商統計使用隨機顏色
  - 更新狀態顏色樣式（支援深色模式）

- `app/Http/Controllers/Api/OrderController.php`
  - 更新驗證規則：`appointment_date`、`start_time`、`end_time` 改為 `nullable`
  - 更新狀態驗證規則：支援新的狀態選項（已預訂、進行中、待接送、已完成、在合作商）
  - 實現狀態變更時機車狀態自動更新邏輯（在 `store` 和 `update` 方法中）

- `database/migrations/2025_12_26_025817_update_orders_status_enum.php`
  - 新增 migration 更新狀態 enum 值

### 注意事項

- 需要運行 `php artisan migrate` 來應用資料庫變更
- 舊的訂單狀態（預約中、已取消）需要手動更新為新的狀態值

---

## 2025-12-26 09:40:00 - 將訂單管理的月份選擇器改為分開的年和月份選擇

### Frontend Changes
- **改進訂單管理月份選擇器** (`system/backend/pages/OrdersPage.tsx`)
  - 將單一的月份選擇器拆分為年份選擇器和月份選擇器
  - 年份選擇器：從 2025 年開始到當前年份
  - 月份選擇器：根據選擇的年份動態顯示可選月份
    - 2025 年：從 12 月開始
    - 當前年份：到當前月份為止
    - 其他年份：1-12 月
  - 添加 `selectedYear` 和 `selectedMonth` 狀態（分別存儲年份和月份）
  - 添加 `selectedMonthString` 計算屬性，用於 API 調用（格式：YYYY-MM）
  - 添加 `handleYearChange` 函數處理年份變化，自動調整月份範圍
  - 添加 `handleMonthChange` 函數處理月份變化
  - 添加 `getAvailableYears` 函數獲取可選年份列表
  - 添加 `getAvailableMonths` 函數獲取可選月份列表（根據年份動態計算）
  - 更新 `useEffect` 依賴項，確保年份和月份變化時正確更新數據

### Features
- 年份和月份分開選擇，更直觀易用
- 自動限制可選月份範圍（2025年從12月開始，當前年份到當前月份為止）
- 切換年份時自動調整月份選擇，避免選擇無效的月份組合

---

## 2025-12-26 09:35:00 - 為機車管理添加操作下拉菜單

### Frontend Changes
- **添加機車操作下拉菜單** (`system/backend/pages/ScootersPage.tsx`)
  - 將操作按鈕改為下拉菜單，包含編輯和刪除選項
  - 使用 `fixed` 定位避免被表格容器遮擋
  - 動態計算按鈕位置並設置下拉菜單位置
  - 添加遮罩層處理點擊外部關閉
  - 滾動時自動關閉下拉菜單
  - 添加 `handleEdit` 函數，點擊編輯時打開編輯模態框
  - 改進 `handleDelete` 函數，添加確認對話框和錯誤處理
  - 使用 `MoreHorizontal` 圖標替代原有的編輯和刪除按鈕
  - 使用 `Edit3` 圖標替代 `Edit` 圖標
  - 支援深色模式

### Features
- 機車管理支持編輯和刪除操作
- 操作按鈕下拉菜單包含編輯和刪除選項
- 與罰單管理和訂單管理頁面的操作方式保持一致
- 下拉菜單不會被表格或其他元素遮擋

---

## 2025-12-26 09:30:00 - 為罰單管理添加操作下拉菜單

### Frontend Changes
- **添加罰單操作下拉菜單** (`system/backend/pages/FinesPage.tsx`)
  - 將操作按鈕改為下拉菜單，包含編輯和刪除選項
  - 使用 `fixed` 定位避免被表格容器遮擋
  - 動態計算按鈕位置並設置下拉菜單位置
  - 添加遮罩層處理點擊外部關閉
  - 滾動時自動關閉下拉菜單
  - 添加 `handleEdit` 函數，點擊編輯時打開編輯模態框
  - 改進 `handleDelete` 函數，添加確認對話框和錯誤處理
  - 使用 `MoreHorizontal` 圖標替代 `MoreVertical`
  - 支援深色模式

### Features
- 罰單管理支持編輯和刪除操作
- 操作按鈕下拉菜單包含編輯和刪除選項
- 與訂單管理頁面的操作方式保持一致
- 下拉菜單不會被表格或其他元素遮擋

---

## 2025-12-26 09:19:38 - 將所有日期選擇器改為使用 Flatpickr

### Frontend Changes
- **更新罰單管理頁面日期選擇器** (`system/backend/pages/FinesPage.tsx`)
  - 導入 `Flatpickr` 和 `react-flatpickr` 相關模組
  - 導入 `MandarinTraditional` 語言包
  - 將違規日期的原生 `type="date"` input 改為 `Flatpickr` 組件
  - 添加 `dateOptions` 配置（繁體中文、日期格式 Y-m-d）
  - 添加日曆圖標到標籤
  - 支援深色模式樣式

### Features
- 所有日期選擇器現在統一使用 Flatpickr
- 提供更好的用戶體驗和一致的界面風格
- 支援繁體中文界面
- 支援手動輸入日期
- 統一的日期格式（Y-m-d）

---

## 2025-12-26 10:16:40 - 將承租人字段改為非必填

### Backend Changes
- **修改訂單驗證規則** (`app/Http/Controllers/Api/OrderController.php`)
  - `store` 方法：將 `tenant` 從 `required` 改為 `nullable`
  - `update` 方法：將 `tenant` 從 `required` 改為 `nullable`

- **創建數據庫 Migration** (`database/migrations/2025_12_26_010640_make_tenant_nullable_in_orders_table.php`)
  - 將 `orders` 表的 `tenant` 字段改為可為空（nullable）
  - 添加 `down` 方法支持回滾

### Frontend Changes
- **修改表單驗證** (`system/backend/components/AddOrderModal.tsx`)
  - 移除 `tenant` 字段的必填驗證
  - 從表單驗證條件中移除 `formData.tenant` 檢查

- **修改 UI 標籤** (`system/backend/components/AddOrderModal.tsx`)
  - 移除「承租人資訊」標籤後的紅色星號（*）
  - 承租人字段現在顯示為可選字段

### Database Changes
- `orders` 表的 `tenant` 字段現在允許 `NULL` 值
- 需要運行 `php artisan migrate` 來應用此變更

### Features
- 訂單可以創建和更新時不填寫承租人信息
- 承租人字段為可選字段，不影響訂單的創建和更新

---

## 2025-12-26 09:25:00 - 修復編輯訂單時機車顯示問題

### Frontend Changes
- **修復編輯訂單時機車不顯示** (`system/backend/components/AddOrderModal.tsx`)
  - 添加 `fetchScootersByIds` 函數，用於獲取訂單中的機車完整信息（包括已租借的）
  - 修改編輯模式初始化邏輯，確保在設置選中機車 ID 前先獲取機車信息
  - 將訂單中的機車（包括已租借的）加入到可用機車列表中
  - 使用 `Promise.all` 確保異步操作的正確執行順序
  - 編輯模式下現在可以正確顯示已租借的機車、各型號數量和總計

### Features
- 編輯訂單時正確顯示已租借的機車列表
- 顯示各型號的機車數量統計
- 顯示總台數統計
- 與新增訂單的顯示方式保持一致

---

## 2025-12-26 09:15:00 - 修復下拉菜單遮擋問題並更新按鈕文字

### Frontend Changes
- **修復訂單操作下拉菜單被遮擋** (`system/backend/pages/OrdersPage.tsx`)
  - 將下拉菜單從 `absolute` 定位改為 `fixed` 定位
  - 動態計算按鈕位置並設置下拉菜單位置
  - 添加遮罩層處理點擊外部關閉
  - 滾動時自動關閉下拉菜單
  - 使用 `z-50` 確保下拉菜單顯示在最上層

- **更新按鈕文字** (`system/backend/components/AddOrderModal.tsx`)
  - 新增訂單時：按鈕顯示「新增訂單」，提交時顯示「建立中...」
  - 編輯訂單時：按鈕顯示「更新訂單」，提交時顯示「更新中...」
  - 根據 `editingOrder` 狀態動態顯示不同的文字

### Features
- 下拉菜單不再被表格容器遮擋
- 按鈕文字更準確反映當前操作（新增/更新）

---

## 2025-12-26 08:52:14 - 移除聊天功能並添加訂單操作下拉菜單

### Frontend Changes
- **移除聊天功能** (`system/backend/components/DashboardLayout.tsx`)
  - 移除 `AIChatAssistant` 組件的導入和使用
  - 移除右下角聊天按鈕和聊天視窗

- **添加訂單操作下拉菜單** (`system/backend/pages/OrdersPage.tsx`)
  - 添加操作按鈕的下拉菜單功能
  - 實現編輯和刪除訂單功能
  - 添加點擊外部關閉下拉菜單的功能
  - 使用 `useRef` 管理多個下拉菜單的引用
  - 添加確認對話框防止誤刪

- **更新 AddOrderModal 支持編輯** (`system/backend/components/AddOrderModal.tsx`)
  - 添加 `editingOrder` prop 支持編輯模式
  - 編輯模式下自動預填表單數據
  - 從訂單詳情 API 獲取機車 ID 列表
  - 提交時根據是否有 `editingOrder` 決定創建或更新
  - 標題動態顯示「編輯租借訂單」或「新增租借訂單」

### Backend Changes
- **更新 OrderResource** (`app/Http/Resources/OrderResource.php`)
  - 添加 `scooter_ids` 字段，包含訂單的所有機車 ID 列表
  - 用於前端編輯模式下正確載入已選機車

### Features
- 訂單管理支持編輯和刪除操作
- 操作按鈕下拉菜單包含編輯和刪除選項
- 編輯模式下自動載入訂單數據和機車列表
- 刪除前顯示確認對話框

---

## 2025-12-25 10:45:00 - 添加驗證碼圖片與雜訊干擾

### Backend Changes
- **更新 CaptchaController** (`app/Http/Controllers/Api/CaptchaController.php`)
  - 改為生成圖片驗證碼（PNG 格式）
  - 使用 PHP GD 庫生成圖片
  - 添加多種干擾元素：
    - 200 個隨機背景雜訊點
    - 5 條隨機干擾線條
    - 3 條波浪線干擾
    - 50 個字符上的雜訊點
  - 字符隨機旋轉（-15 到 15 度）
  - 字符位置輕微偏移
  - 返回 base64 編碼的圖片數據
  - 圖片尺寸：200x60 像素

### Frontend Changes
- **更新 LoginPage** (`system/backend/pages/LoginPage.tsx`)
  - 驗證碼顯示改為圖片（`<img>` 標籤）
  - 支援點擊圖片刷新驗證碼
  - 圖片高度設為 48px，寬度自動調整
  - 添加 `select-none` 防止選取圖片
  - 添加 `cursor-pointer` 提示可點擊

### Features
- 圖片驗證碼帶有多種雜訊干擾
- 字符隨機旋轉和位置偏移
- 點擊圖片可刷新驗證碼
- Base64 編碼，無需額外圖片存儲
- 支援深色模式

---

## 2025-12-25 10:30:00 - 更新驗證碼為 6 位大寫字母數字（排除 O 和 0）

### Backend Changes
- **更新 CaptchaController** (`app/Http/Controllers/Api/CaptchaController.php`)
  - 改為生成 6 位大寫字母數字驗證碼
  - 排除字母 O 和數字 0（避免混淆）
  - 使用字符集：`ABCDEFGHIJKLMNPQRSTUVWXYZ123456789`
  - 返回 `code` 而非 `question`

- **更新 AuthController** (`app/Http/Controllers/Api/AuthController.php`)
  - 驗證碼答案改為字符串類型（6 位）
  - 驗證時強制轉為大寫並去除空格

### Frontend Changes
- **更新 LoginPage** (`system/backend/pages/LoginPage.tsx`)
  - 驗證碼顯示改為大寫等寬字體，字體更大更清晰
  - 輸入框自動轉為大寫
  - 自動過濾 O 和 0 字符
  - 限制最多輸入 6 位
  - 驗證碼答案改為字符串類型

- **更新 AuthContext** (`system/backend/contexts/AuthContext.tsx`)
  - `login` 方法的 `captchaAnswer` 參數改為 `string` 類型

- **更新 API Client** (`system/backend/lib/api.ts`)
  - `authApi.login` 和 `captchaApi.verify` 的驗證碼參數改為 `string` 類型

### Features
- 6 位大寫字母數字驗證碼
- 排除容易混淆的 O 和 0
- 輸入時自動轉大寫
- 自動過濾無效字符
- 更清晰的驗證碼顯示

---

## 2025-12-25 10:24:45 - 添加登入驗證碼功能

### Backend Changes
- **新增 CaptchaController** (`app/Http/Controllers/Api/CaptchaController.php`)
  - `generate()`: 生成數學驗證碼（兩個 1-10 的數字相加）
  - `verify()`: 驗證驗證碼答案
  - 使用 Laravel Cache 存儲驗證碼答案，5 分鐘過期

- **更新 AuthController** (`app/Http/Controllers/Api/AuthController.php`)
  - 登入時要求驗證 `captcha_id` 和 `captcha_answer`
  - 驗證碼錯誤或過期時返回錯誤訊息

- **API Routes** (`routes/api.php`)
  - `GET /api/captcha/generate` - 生成驗證碼
  - `POST /api/captcha/verify` - 驗證驗證碼

### Frontend Changes
- **更新 LoginPage** (`system/backend/pages/LoginPage.tsx`)
  - 添加驗證碼顯示區域（數學題目）
  - 添加驗證碼答案輸入框
  - 添加重新獲取驗證碼按鈕
  - 登入失敗後自動重新獲取驗證碼
  - 驗證碼載入狀態顯示

- **更新 AuthContext** (`system/backend/contexts/AuthContext.tsx`)
  - `login` 方法添加 `captchaId` 和 `captchaAnswer` 參數

- **更新 API Client** (`system/backend/lib/api.ts`)
  - 添加 `captchaApi` 用於驗證碼相關 API 調用
  - 更新 `authApi.login` 方法以包含驗證碼參數

### Features
- 數學驗證碼：兩個 1-10 的隨機數字相加
- 驗證碼有效期：5 分鐘
- 驗證後自動清除驗證碼
- 登入失敗後自動刷新驗證碼
- 支援深色模式

---

## 2025-12-24 21:30:00

### 新增商店管理功能
- **建立商店管理系統**：
  - 建立 `stores` 資料表 migration
  - 建立 `Store` Model
  - 建立 `StoreController` API Controller（含照片上傳功能）
  - 建立 `StoreResource` API Resource
  - 建立前端 `StoresPage.tsx` 商店管理頁面
  - 在導覽選單中新增「商店管理」項目
- **機車與商店關聯**：
  - 修改 `scooters` 資料表，將 `partner_id` 改為 `store_id`
  - 更新 `Scooter` Model 關聯商店而非合作商
  - 更新 `ScooterController` 使用商店
  - 更新 `ScooterResource` 返回商店資訊
  - 更新 `ScootersPage.tsx` 顯示「所屬商店」而非「所屬合作商」
- **功能區分**：
  - **合作商管理**：用於訂單中的出租合作商（保持不變）
  - **商店管理**：用於機車所屬的分店/商店
  - 機車清單中的「所屬合作商」改為「所屬商店」

## 2025-12-24 21:25:00

### 文字修正
- 將「商店管理」改回「合作商管理」
- 將機車清單中的「所屬商店」改為「所屬合作商」
- 更新所有相關頁面的標題和欄位名稱

## 2025-12-24 21:20:00

### 完善深色模式支援
- 為所有管理頁面加入完整的深色模式樣式支援：
  - **訂單管理頁面**：統計卡片、表格、搜尋欄、分頁器
  - **機車管理頁面**：表格、篩選器、表單
  - **罰單管理頁面**：表格、狀態標籤、表單
  - **機車配件管理頁面**：統計卡片、表格、表單
  - **商店管理頁面**：表格、表單（之前已部分完成）
  - **首頁輪播圖管理頁面**：卡片、上傳區域、表單
- 為 **AddOrderModal** 加入深色模式支援
- 所有白色背景改為深色模式下的 `dark:bg-gray-800`
- 所有文字顏色加入深色模式對應樣式
- 所有邊框加入深色模式對應樣式
- 所有輸入框、按鈕、表格都支援深色模式

## 2025-12-24 21:15:00

### 新增功能
- **商店管理**：將「合作商管理」改名為「商店管理」，更新所有相關文字
- **機車配件管理**：
  - 建立 `accessories` 資料表 migration
  - 建立 `Accessory` Model
  - 建立 `AccessoryController` API Controller
  - 建立 `AccessoryResource` API Resource
  - 更新 `AccessoriesPage.tsx` 連接 API，實作完整的 CRUD 功能
  - 實作統計功能（配件類別、總庫存量、缺貨品項、低庫存預警）
- **深色/淺色模式切換**：
  - 在 `DashboardLayout` 中加入主題切換按鈕
  - 預設為淺色模式（light）
  - 支援深色模式（dark）
  - 主題設定儲存在 localStorage
  - 所有 UI 元件支援深色模式樣式

## 2025-12-24 21:10:00

### 修正合作商管理頁面資料顯示問題
- 修正 `system/backend/pages/PartnersPage.tsx` 中的資料讀取邏輯
- 使用更安全的方式處理 API 回應格式
- 加入空資料狀態的顯示處理

## 2025-12-24 21:05:01

### 概述
將 React 前端的功能轉換為 Laravel API，並實作 PDF 文件中的所有需求，包括訂單管理、合作商管理、機車管理、罰單管理等功能的完整後端 API 和前端整合。

### Laravel 後端變更

#### 資料庫 Migrations
- 建立 `2025_01_15_000001_create_partners_table.php` - 合作商表
- 建立 `2025_01_15_000002_create_scooters_table.php` - 機車表
- 建立 `2025_01_15_000003_create_orders_table.php` - 訂單表
- 建立 `2025_01_15_000004_create_order_scooter_table.php` - 訂單機車關聯表
- 建立 `2025_01_15_000005_create_fines_table.php` - 罰單表

#### Models
- 建立 `app/Models/Partner.php` - 合作商模型，包含與 Scooter 和 Order 的關聯
- 建立 `app/Models/Scooter.php` - 機車模型，包含與 Partner、Order、Fine 的關聯
- 建立 `app/Models/Order.php` - 訂單模型，包含自動生成訂單編號、與 Partner、Scooter、Fine 的關聯
- 建立 `app/Models/Fine.php` - 罰單模型，包含與 Scooter、Order 的關聯

#### Services
- 建立 `app/Services/ImageService.php` - 處理圖片上傳、轉換為 webp 格式、使用 uuid 檔名、刪除舊圖片

#### Controllers
- 建立 `app/Http/Controllers/Api/PartnerController.php` - 合作商 CRUD 和圖片上傳
- 建立 `app/Http/Controllers/Api/ScooterController.php` - 機車 CRUD、可租借機車列表、圖片上傳
- 建立 `app/Http/Controllers/Api/OrderController.php` - 訂單 CRUD、月份分頁（200 筆/頁）、統計功能、自動更新機車狀態
- 建立 `app/Http/Controllers/Api/FineController.php` - 罰單 CRUD、狀態篩選、搜尋、圖片上傳

#### Resources
- 建立 `app/Http/Resources/PartnerResource.php` - 格式化合作商 API 回應
- 建立 `app/Http/Resources/ScooterResource.php` - 格式化機車 API 回應
- 建立 `app/Http/Resources/OrderResource.php` - 格式化訂單 API 回應，包含機車資訊統計
- 建立 `app/Http/Resources/FineResource.php` - 格式化罰單 API 回應

#### API Routes
- 更新 `routes/api.php` - 建立完整的 RESTful API 端點：
  - Orders: GET, POST, PUT, DELETE, GET statistics
  - Partners: GET, POST, PUT, DELETE, POST upload-photo
  - Scooters: GET, GET available, POST, PUT, DELETE, POST upload-photo
  - Fines: GET, POST, PUT, DELETE, POST upload-photo

#### 套件安裝
- 安裝 `intervention/image` 套件用於圖片處理

### React 前端變更

#### API Client
- 建立 `system/backend/lib/api.ts` - 統一的 API 客戶端，包含所有 API 端點的封裝

#### Pages
- 更新 `system/backend/pages/OrdersPage.tsx`:
  - 移除 mock 資料，連接 Laravel API
  - 實作月份分頁（200 筆/頁）
  - 實作統計功能（合作商單月台數、金額）
  - 更新顯示：將「去」改為「來」
  - 顯示所有必要欄位（狀態、承租人、預約日期、租借開始/結束時間、預計還車時間、租借機車、航運公司+船班時間、聯絡電話、合作商、付款方式+金額、備註）

- 更新 `system/backend/pages/PartnersPage.tsx`:
  - 連接 Laravel API
  - 實作圖片上傳功能
  - 更新表單欄位（合作商名稱必填、地址非必填、聯絡電話非必填、統編非必填）
  - 實作 CRUD 功能

- 更新 `system/backend/pages/ScootersPage.tsx`:
  - 連接 Laravel API
  - 實作圖片上傳功能
  - 實作狀態篩選功能
  - 實作搜尋功能
  - 實作 CRUD 功能

- 更新 `system/backend/pages/FinesPage.tsx`:
  - 連接 Laravel API
  - 實作罰單 CRUD 功能
  - 實作圖片上傳功能
  - 實作狀態篩選（未繳費/已處理）
  - 實作搜尋功能（車牌、承租人）

#### Components
- 更新 `system/backend/components/AddOrderModal.tsx`:
  - 連接 Laravel API 取得可租借機車列表
  - 實作訂單建立功能
  - 更新欄位：合作商改為非必選，新增「蘭光」選項
  - 新增欄位：航運公司（下拉選單：泰富、藍白、聯營、大福）、船班時間（來/回）、聯絡電話、付款方式（現金、月結、日結）、預計還車時間、備註

### 功能實作

#### 圖片處理
- 所有圖片上傳自動轉換為 webp 格式
- 使用 uuid 作為檔名
- 儲存路徑：
  - 合作商：`storage/app/public/partners/{uuid}.webp`
  - 機車：`storage/app/public/scooters/{uuid}.webp`
  - 罰單：`storage/app/public/fines/{uuid}.webp`
- 編輯時自動刪除舊圖片

#### 訂單狀態自動更新
- 當訂單狀態變為「已完成」或「已取消」時，自動將相關機車狀態改為「待出租」
- 建立訂單時，自動將選取的機車狀態改為「出租中」
- 更新訂單時，處理機車狀態的變更

#### 統計功能
- 依月份篩選訂單
- 計算各合作商的台數和金額
- 計算總台數和總金額
- 支援彈出視窗顯示詳細統計

#### 訂單分頁
- 每月分頁呈現，每頁最多 200 筆訂單
- 支援月份選擇器
- 支援搜尋功能

### 資料庫配置
- 設定 MySQL 資料庫：scooter-rental
- 使用者：root
- 密碼：空

### 注意事項
- 所有圖片上傳需轉為 webp 格式，使用 uuid 檔名
- 編輯時自動刪除舊圖片
- 訂單分頁為每月 200 筆
- 合作商欄位多數改為非必填（僅名稱和主管為必填）
- 航運顯示「來」而非「去」
- 已建立 storage link 用於圖片存取

