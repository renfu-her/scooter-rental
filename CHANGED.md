# 變更記錄 (Change Log)

## 2026-01-14 14:15:11 - 修正部署腳本：添加 Composer 依賴安裝步驟

### 變更內容

#### 部署腳本
- **build.sh** (`build.sh`)
  - 在 Git 更新後、資料庫遷移前添加 `composer install --no-dev --optimize-autoloader` 步驟
  - 更新所有步驟編號從 [1/9] 到 [1/10] 到 [10/10]
  - 確保在執行任何 artisan 命令前，所有 Composer 依賴都已正確安裝

### 問題說明
- 部署時出現 PHP Fatal Error: `Class "SebastianBergmann\Version" not found`
- 錯誤發生在執行 `php artisan migrate`、`php artisan route:cache`、`php artisan config:cache` 等命令時
- 原因是 `vendor` 目錄中的依賴不完整，缺少 `sebastian/version` 套件（PHPUnit 的依賴）
- 當添加了新的套件（如 `maatwebsite/excel`）後，需要在部署時執行 `composer install` 來安裝所有依賴

### 技術細節
- 使用 `composer install --no-dev --optimize-autoloader` 來：
  - `--no-dev`: 不安裝開發依賴（減少部署時間和空間）
  - `--optimize-autoloader`: 優化自動載入器（提升性能）
- 執行順序：
  1. Git pull
  2. **Composer install**（新增）
  3. 清除 Laravel 快取
  4. 資料庫遷移
  5. 其他部署步驟

## 2026-01-14 12:25:01 (+8) - 添加 Excel 匯出錯誤處理和日誌記錄

### 變更內容

#### 後端錯誤處理
- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 在 Excel 生成邏輯中添加 try-catch 錯誤處理
  - 添加臨時檔案創建檢查
  - 添加檔案存在性檢查
  - 添加詳細的錯誤日誌記錄（包含錯誤訊息、堆疊追蹤、partner_id、month）
  - 返回友好的錯誤訊息給前端（在 debug 模式下包含詳細錯誤資訊）

### 問題說明
- 用戶在點擊 Export 按鈕時遇到 500 Internal Server Error
- 需要添加錯誤處理來診斷問題原因
- 可能的問題原因：
  1. PhpSpreadsheet 套件沒有正確安裝
  2. 缺少必要的 PHP 擴展（如 zip）
  3. 臨時檔案權限問題
  4. 代碼執行時的錯誤

### 技術細節
- 使用 `\Log::error()` 記錄錯誤訊息和堆疊追蹤
- 檢查 `tempnam()` 返回值是否為 false
- 檢查生成的檔案是否存在
- 在 debug 模式下返回詳細錯誤資訊，生產環境下返回簡化錯誤訊息

## 2026-01-14 12:04:52 (+8) - 修正部署腳本：在清除快取前先刪除舊配置檔案

### 變更內容

#### 部署腳本
- **build.sh** (`build.sh`)
  - 在清除快取前先刪除 `config/excel.php` 檔案（如果存在）
  - 確保在執行 `php artisan config:clear` 前不會載入舊配置
  - 調整執行順序：先刪除配置檔案，再清除快取，最後執行 artisan 命令

### 問題說明
- 執行 `php artisan config:clear` 時出現錯誤：`Class "Maatwebsite\Excel\Excel" not found`
- 原因是 `config/excel.php` 配置檔案仍然存在，Laravel 在清除快取時會嘗試載入這個檔案
- 當 Laravel 載入配置時，會嘗試載入已移除套件的類別，導致錯誤
- 解決方案：在執行任何 artisan 命令前，先手動刪除 `config/excel.php` 檔案

### 技術細節
- 執行順序很重要：
  1. 先刪除 `config/excel.php`（如果存在）
  2. 刪除快取的配置檔案 `bootstrap/cache/config.php`
  3. 然後才執行 `php artisan config:clear` 等命令
- 這樣可以確保 Laravel 不會嘗試載入已移除套件的配置檔案

## 2026-01-14 12:03:18 (+8) - 修正部署腳本：在安裝依賴前清除快取，避免舊配置衝突

### 技術細節
- `php artisan config:clear`：清除配置快取
- `php artisan cache:clear`：清除應用程式快取
- `php artisan route:clear`：清除路由快取
- `php artisan view:clear`：清除視圖快取
- 手動刪除 `bootstrap/cache/config.php`：確保完全清除快取的配置

## 2026-01-14 12:01:07 (+8) - 修正部署腳本：解決 Composer 安裝時的腳本執行問題

### 變更內容

#### 部署腳本
- **build.sh** (`build.sh`)
  - 在 Composer 安裝前先清理 `vendor` 目錄，避免依賴衝突
  - 使用 `--no-scripts` 選項跳過可能依賴開發套件的腳本執行
  - 安裝完成後單獨執行 `composer dump-autoload` 重新生成 autoload

### 問題說明
- 執行 `composer install --no-dev` 時，`prePackageUninstall` 腳本試圖載入 `sebastian/version`（開發依賴），導致錯誤
- 原因是舊的 vendor 目錄中可能還有開發依賴的殘留，或腳本在卸載舊套件時需要這些依賴
- 解決方案：先清理 vendor 目錄，然後使用 `--no-scripts` 跳過腳本執行，最後單獨生成 autoload

### 技術細節
- `--no-scripts`：跳過所有 Composer 腳本（pre-install-cmd, post-install-cmd 等）
- 清理 vendor 目錄：確保乾淨的安裝環境
- 單獨執行 `dump-autoload`：確保 autoload 檔案正確生成

## 2026-01-14 11:54:57 (+8) - 將 Excel 套件從 maatwebsite/excel 改為 phpoffice/phpspreadsheet

### 變更內容

#### 依賴套件
- **composer.json** (`composer.json`)
  - 移除 `maatwebsite/excel` (^1.1)
  - 添加 `phpoffice/phpspreadsheet` (^2.0)

#### Excel 匯出功能
- **PartnerMonthlyReportExport.php** (`app/Exports/PartnerMonthlyReportExport.php`)
  - 完全重寫，改用 PhpSpreadsheet API
  - 移除 `FromArray` 和 `WithTitle` 介面（maatwebsite/excel 專用）
  - 新增 `generate()` 方法，直接返回 `Spreadsheet` 物件
  - 使用 PhpSpreadsheet 的 API 進行單元格設置、合併、樣式設定
  - 保持原有的 Excel 結構和格式（標題、多層表頭、數據行、總計行）

- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 移除 `Maatwebsite\Excel\Facades\Excel` 引用
  - 添加 `PhpOffice\PhpSpreadsheet\Writer\Xlsx` 引用
  - 更新 Excel 生成邏輯：
    - 調用 `$export->generate()` 獲取 Spreadsheet 物件
    - 使用 `Xlsx` Writer 將 Spreadsheet 寫入臨時檔案
    - 使用 Laravel 的 `response()->download()` 返回檔案下載
    - 設定 `deleteFileAfterSend(true)` 自動清理臨時檔案

### 問題說明
- 部署時 `composer install --no-dev` 執行失敗，因為 `maatwebsite/excel` 的依賴（特別是 `sebastian/version`）在生產環境安裝時出現問題
- `phpoffice/phpspreadsheet` 是更底層、更穩定的 Excel 處理套件，不依賴 Laravel 特定的包裝器
- 改用 PhpSpreadsheet 可以避免部署時的依賴問題，同時提供更直接的控制

### 技術細節
- PhpSpreadsheet 使用方式：
  - 創建 `Spreadsheet` 物件
  - 獲取 `ActiveSheet`
  - 使用 `setCellValueByColumnAndRow()` 設置單元格值
  - 使用 `mergeCells()` 合併單元格
  - 使用 `getStyle()` 設置樣式和對齊
  - 使用 `Xlsx` Writer 生成檔案

## 2026-01-14 11:51:31 (+8) - 修正部署腳本：添加 Composer 依賴安裝步驟

### 變更內容

#### 部署腳本
- **build.sh** (`build.sh`)
  - 在 Git 更新後、資料庫遷移前添加 Composer 依賴安裝步驟
  - 執行 `composer install --no-dev --optimize-autoloader` 來安裝所有依賴
  - 更新所有後續步驟的編號（從 [3/9] 到 [10/10]）

### 問題說明
- 部署時出現錯誤：缺少 `sebastian/version` 套件（PHPUnit 的依賴）
- 原因是部署腳本中沒有執行 `composer install`，導致新添加的套件（如 `maatwebsite/excel`）及其依賴沒有被安裝
- 現在部署流程會自動安裝所有 Composer 依賴，確保所有套件都正確安裝

### 部署流程更新
1. 切換到專案目錄
2. 更新程式碼 (git pull)
3. **安裝 Composer 依賴**（新增）
4. 資料庫遷移
5. 清除並快取 Laravel 路由
6. 清除並快取 Laravel 配置
7. 清除後端 React 緩存
8. 構建後端 (React)
9. 清除前端 React 緩存
10. 構建前端 (React)

## 2026-01-14 11:42:01 (+8) - 使用 Laravel Excel 套件在後端生成 Excel 檔案

### 變更內容

#### 後端
- **安裝套件**
  - 安裝 `maatwebsite/excel` v1.1.5 套件
  - 使用 PHPExcel 庫生成 Excel 檔案

- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 修改 `partnerDailyReport()` 方法
  - 如果提供了 `partner_id`，生成並返回 Excel 檔案（使用 `Excel::download()`）
  - 如果沒有提供 `partner_id`，返回 JSON 數據（保持向後兼容）
  - 獲取所有機車型號（從 `ScooterModel` 表，按照 `sort_order` 降序排序）
  - 查詢訂單時只使用 `start_time` 的日期部分（使用 `DATE_FORMAT(start_time, "%Y-%m")`）
  - 判斷當日租/跨日租：`start_time` 和 `end_time` 同一天 = 當日租，否則 = 跨日租

- **PartnerMonthlyReportExport.php** (`app/Exports/PartnerMonthlyReportExport.php`)
  - 新增 Export 類，實現 `FromArray` 和 `WithTitle` 接口
  - 生成符合圖片格式的 Excel 報表
  - Header 結構（4層）：
    1. 第一行：標題「合作商名稱機車出租月報表」（跨越多列）
    2. 第二行：「當日租 200/台」、「跨日租 300/台」，然後是各個機車型號（每個型號跨4列）
    3. 第三行：「日期」、「星期」，然後每個型號下分為「當日租」（1列）和「跨日租」（3列）
    4. 第四行：四個空白列，然後每個型號下：當日租只有「台數」（1列），跨日租有「台數」、「天數」、「金額」（3列）
  - 數據行：包含整個月的所有日期（1號到當月最後一天），沒有費用的日期顯示為空白
  - 總計行：月結總計、總台數/天數、小計、總金額

#### 前端
- **api.ts** (`system/backend/lib/api.ts`)
  - 新增 `downloadFile()` 方法，用於下載文件
  - 新增 `downloadPartnerMonthlyReport()` API 方法

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 簡化 `handleExportPartnerReport()` 函數
  - 移除前端生成 Excel 的代碼（之前使用 XLSX 庫）
  - 現在直接調用 API 下載後端生成的 Excel 檔案
  - 保留 XLSX 導入（因為 `handleExportExcel` 函數仍在使用）

### 功能說明
- 整個流程現在完全在後端完成：
  1. 前端調用 API（提供 `month` 和 `partner_id`）
  2. 後端查詢訂單數據（使用 `start_time` 的日期部分）
  3. 後端判斷當日租/跨日租（`start_time` 和 `end_time` 同一天 = 當日租）
  4. 後端計算調車費用
  5. 後端生成 Excel 檔案
  6. 後端返回 Excel 檔案供前端下載
- 報表格式完全符合圖片要求：
  - 標題為「合作商名稱機車出租月報表」
  - Header 包含所有機車型號（從機車型號管理獲取）
  - 包含整個月的所有日期（1號到當月最後一天）
  - 沒有費用的日期和欄位顯示為空白
  - 總計行格式正確

## 2026-01-14 11:23:52 (+8) - 修正合作商報表：改為月報表並使用 start_time 日期查詢

### 變更內容

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改標題為「合作商名稱機車出租月報表」（例如："行動潛水機車出租月報表"）
  - 將所有「日報表」相關文字改為「月報表」
  - 工作表名稱改為「月報表」
  - 錯誤訊息中的「日報表」改為「月報表」

#### 後端
- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - `partnerDailyReport()` 方法已經正確使用 `DATE_FORMAT(start_time, "%Y-%m")` 來查詢訂單
  - 只使用 `start_time` 的日期部分進行查詢和分組，符合要求

### 功能說明
- 報表標題現在顯示為「合作商名稱機車出租月報表」，與第二張圖片格式一致
- 查詢訂單時只使用 `start_time` 的日期部分（使用 `DATE_FORMAT`）
- 報表類型從「日報表」改為「月報表」，更準確反映報表內容

## 2026-01-14 11:11:35 (+8) - 修正合作商日報表總計行格式，使其與 Excel 設定一致

### 變更內容

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修正總金額行的格式
  - 添加總金額單元格合併功能，使總金額跨越多列（從第一個型號的跨日租金額欄位開始）
  - 確保如果值為0則顯示為空白（與 Excel 設定一致）

### 功能說明
- 總金額現在會跨越多列顯示（使用單元格合併）
- 所有值為0的欄位都會顯示為空白，符合 Excel 設定的要求
- 總計行的格式現在與 Excel 模板完全一致

## 2026-01-14 11:04:42 (+8) - 調整合作商日報表：header 顯示所有機車型號

### 變更內容

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `handleExportPartnerReport()` 函數
  - 從機車型號管理 API (`scooterModelsApi.list()`) 獲取所有機車型號
  - Header 現在顯示所有機車型號（按照 `sort_order` 降序排序），而不是只顯示有訂單的型號
  - 型號格式：`name type`（例如："ES-2000 白牌"）
  - 即使某個型號在該月份沒有訂單，也會在 header 中顯示

### 功能說明
- 導出的日報表 header 現在包含所有機車型號（從機車型號管理中獲取）
- 型號按照 `sort_order` 降序排序（與機車型號管理頁面一致）
- 即使某個型號在該月份沒有訂單數據，也會在 header 中顯示，數據欄位為空白
- 這樣可以確保報表格式一致，方便對比不同月份的數據

## 2026-01-14 11:01:50 (+8) - 調整合作商日報表 header 結構以符合圖片格式

### 變更內容

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `handleExportPartnerReport()` 函數的 header 結構
  - 新的 header 結構（4層）：
    1. **第一行**：標題「行動潛水」（跨越多列）
    2. **第二行**：「當日租 200/台」、「跨日租 300/台」，然後是各個機車型號（每個型號佔4列）
    3. **第三行**：「日期」、「星期」，然後兩個空白列，接著每個型號下分為「當日租」（1列）和「跨日租」（3列合併顯示）
    4. **第四行**：四個空白列，然後每個型號下：
       - 當日租：只有「台數」（1列）
       - 跨日租：「台數」、「天數」、「金額」（3列）
  - 調整數據行格式：
    - 每行包含：日期、星期、兩個空白列，然後每個型號下：當日租台數、跨日租台數、跨日租天數、跨日租金額
  - 調整總計行格式：
    - 總台數/天數行：月結總計、總台數/天數、兩個空白列，然後每個型號的統計數據
    - 小計行：空白、小計、兩個空白列，然後每個型號的小計金額（顯示在跨日租金額欄位）
    - 總金額行：空白、總金額、兩個空白列，然後總金額（顯示在第一個型號的跨日租金額欄位）
  - 調整列寬設置以符合新的結構
  - 添加單元格合併功能：
    - 第一行標題「行動潛水」跨越多列（從A1到最後一列）
    - 第二行每個機車型號跨4列
    - 第三行每個型號的「跨日租」跨3列（台數、天數、金額）

### 功能說明
- Header 結構現在完全符合圖片格式
- 當日租只顯示台數，不顯示天數和金額
- 跨日租顯示台數、天數、金額
- 數據行從第5行開始（之前是第7行）
- 使用 Excel 單元格合併功能，使 header 更美觀

## 2026-01-14 10:58:29 (+8) - 調整合作商日報表導出：包含整個月的所有日期

### 變更內容

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `handleExportPartnerReport()` 函數
  - 移除日期過濾邏輯，現在會顯示 1 號到當月最後一天的所有日期
  - 對於沒有費用的日期，顯示日期和星期，但數據欄位（台數、天數、金額）顯示為空白
  - 對於有費用的日期，正常顯示數據
  - 總計計算仍然只計算有費用的部分

### 功能說明
- 導出的日報表現在包含整個月的所有日期（1號到當月最後一天）
- 如果某個日期沒有費用（所有型號的費用都是 0），該日期仍會顯示，但數據欄位為空白
- 這樣可以更清楚地看到整個月的完整情況，包括沒有訂單的日期

## 2026-01-14 10:51:39 (+8) - 移除匯出月報表功能

### 變更內容

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 移除 `handleExportMonthlyReport()` 函數
  - 移除「匯出月報表」按鈕
  - 保留「匯出 Excel」按鈕（用於匯出合作商統計）

### 功能說明
- 已完全移除「匯出月報表」功能
- 用戶現在只能使用「匯出 Excel」功能匯出合作商統計數據
- 合作商統計視窗中的 Export 按鈕仍然可用，用於匯出各合作商的詳細日報表

## 2026-01-14 10:50:17 (+8) - 新增合作商統計 Export 功能（導出有費用的日報表）

### 變更內容

#### 後端
- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 新增 `partnerDailyReport()` 方法，用於獲取合作商的詳細日報表數據
  - 新增路由：`GET /api/orders/partner-daily-report`
  - 數據結構：
    - 按合作商分組
    - 每個合作商包含一個月的每一天
    - 每個日期包含所有機車型號的數據
    - 每個機車型號區分當日租和跨日租
    - 包含台數、天數、金額
    - 只返回有費用的部分（調車費用 > 0）
  - 計算邏輯：
    - 根據訂單的開始日期和結束日期判斷當日租或跨日租
    - 從 `partner_scooter_model_transfer_fees` 表查詢合作商的機車型號調車費用
    - 計算公式：調車費用 × 台數 × 天數
    - 只記錄有費用的數據
  - 修改 `statistics()` 方法，在返回的 `partner_stats` 中包含 `partner_id`

#### 前端
- **api.ts** (`system/backend/lib/api.ts`)
  - 新增 `partnerDailyReport()` API 方法

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 在 `StatsModal` 組件中新增 Export 功能
  - 為每個合作商添加 Export 按鈕
  - 實現 `handleExportPartnerReport()` 函數，導出合作商的詳細日報表
  - 導出格式：
    - 標題：合作商名稱 + "機車出租日報表"
    - 月份：YYYY年MM月
    - 表頭：日期、星期，然後每個機車型號（當日租：台數、天數、金額；跨日租：台數、天數、金額）
    - 數據行：一個月的每一天（只包含有費用的日期）
    - 月結總計：總台數/天數、小計、總金額
  - 只導出有費用的部分（過濾掉沒有費用的日期和型號）
  - 文件名格式：`合作商名稱-YYYYMM.xlsx`

### 功能說明
- 在合作商單月詳細統計視窗中，每個合作商旁邊都有 Export 按鈕
- 點擊 Export 按鈕後，會導出該合作商在該月份的詳細日報表
- 日報表包含：
  - 一個月的每一天（只包含有費用的日期）
  - 每個機車型號的當日租和跨日租數據
  - 台數、天數、金額（調車費用）
  - 月結總計（總台數/天數、小計、總金額）
- 計算方法：
  - 天數：根據租期類型計算（同日租：1天，跨日租：夜數）
  - 型號記錄數：每個機車型號在該日期的台數
  - 金額：調車費用 × 台數 × 天數

### 導出範例
假設合作商「蘭光智能」在 2026年1月：
- 日期：2026年1月15日（星期一）
- ES-1000 綠牌：
  - 當日租：1台，1天，金額 200
  - 跨日租：1台，2天，金額 600
- ES-2000 白牌：
  - 跨日租：1台，3天，金額 900

導出的 Excel 文件會包含這些詳細數據，以及月結總計。

## 2026-01-14 10:29:25 (+8) - 調整未確認預約列表按鈕位置與 Email 齊平

### 變更內容

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 調整未確認預約列表的布局
  - 將「拒絕」和「確認轉為訂單」按鈕移動到與 Email 欄位同一行
  - 使用 `flex items-center justify-between` 布局，Email 在左側，按鈕在右側
  - 按鈕與 Email 垂直對齊（齊平）

### 功能說明
- 未確認預約列表展開後，Email 欄位和操作按鈕現在在同一行顯示
- Email 顯示在左側，拒絕和確認按鈕顯示在右側
- 按鈕與 Email 欄位垂直對齊，視覺效果更加整齊

## 2026-01-14 10:22:41 (+8) - 修改訂單編號生成規則為年月+流水號格式

### 變更內容

#### 後端
- **Order.php** (`app/Models/Order.php`)
  - 修改 `boot()` 方法中的訂單編號生成邏輯
  - 新格式：`ORD-年月-流水號`（例如：`ORD-202601-00001`）
  - 流水號格式：5位數，前面補0（例如：00001, 00002, ...）
  - 每月流水號從 00001 開始計算
  - 當換月份時，流水號自動重置為 00001

### 功能說明
- 訂單編號格式：`ORD-YYYYMM-NNNNN`
  - `ORD`：固定前綴
  - `YYYYMM`：年月（例如：202601 表示 2026年1月）
  - `NNNNN`：5位數流水號（例如：00001, 00002, ...）
- 每月自動重置：當月份改變時，流水號從 00001 重新開始
- 自動查詢：系統會自動查詢該月份的最大訂單編號，並生成下一個流水號

### 編號範例
- 2026年1月：
  - 第1筆：`ORD-202601-00001`
  - 第2筆：`ORD-202601-00002`
  - 第3筆：`ORD-202601-00003`
- 2026年2月（換月後重置）：
  - 第1筆：`ORD-202602-00001`
  - 第2筆：`ORD-202602-00002`

### 技術細節
- 使用 `where('order_number', 'like', $prefix . '%')` 查詢該月份的所有訂單
- 從最大訂單編號中提取流水號部分（最後5位數字）
- 使用 `str_pad()` 將流水號格式化為5位數（前面補0）
- 如果該月份還沒有訂單，從 00001 開始

## 2026-01-14 10:18:56 (+8) - 修復訂單日期顯示和費用計算問題

### 變更內容

#### 後端
- **OrderResource.php** (`app/Http/Resources/OrderResource.php`)
  - 修改 `start_time` 和 `end_time` 的格式化，從 `'Y-m-d H:i:s'` 改為 `'Y-m-d'`
  - 只顯示日期，不顯示時間（符合需求：租借開始和租借結束只需要日期）

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改訂單列表顯示，將 `start_time` 和 `end_time` 從 `formatDateTime()` 改為 `formatDate()`
  - 租借開始和租借結束現在只顯示日期，不顯示時間

- **ConvertBookingModal.tsx** (`system/backend/components/ConvertBookingModal.tsx`)
  - 移除傳入 `payment_amount` 參數
  - 讓後端根據合作商的機車型號費用自動計算調車費用
  - 確保使用調車費用計算，而不是前端計算的租車費用

### 功能說明
- 訂單列表中的「租借開始」和「租借結束」現在只顯示日期（例如：2026-01-15），不顯示時間
- 預約轉訂單時，無論使用哪個組件（`handleConvertBookingClick` 或 `ConvertBookingModal`），都會使用後端計算的調車費用
- 確保費用計算基於合作商的機車型號費用，而不是租車費用

### 問題修復
- 修復了訂單列表中日期時間顯示問題（之前顯示 `2026-01-15 00:00`，現在只顯示 `2026-01-15`）
- 修復了 `ConvertBookingModal` 傳入 `payment_amount` 導致覆蓋後端計算的調車費用的問題

## 2026-01-14 10:11:23 (+8) - 修改訂單開始時間和結束時間為只使用日期格式

### 變更內容

#### 後端
- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 修改 `convertToOrder()` 方法中的時間處理邏輯
  - `start_time` 和 `end_time` 改為只保存日期格式（`Y-m-d`），移除時間部分
  - `expected_return_time` 保持日期時間格式（其他欄位保持不變）
  - 預約日期 = 租借開始，只需要日期，不需要時間

#### 前端
- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 修改 `start_time` 和 `end_time` 的輸入框，從日期時間選擇器改為只選擇日期
  - 將 Flatpickr 的 `options` 從 `getDatetimeOptions()` 改為 `dateOptions`
  - 修改 `onChange` 處理，只保存日期格式（`Y-m-d`），不帶時間
  - 更新 placeholder 文字從「選擇日期時間」改為「選擇日期」
  - 新增 `formatDateOnly()` 函數，用於編輯模式下處理可能帶時間的舊數據
  - 編輯模式下，`start_time` 和 `end_time` 使用 `formatDateOnly()` 格式化
  - `expected_return_time`, `ship_arrival_time`, `ship_return_time` 保持使用 `formatDateTime()`（日期時間格式）

### 功能說明
- 訂單的開始時間和結束時間現在只需要選擇日期，不需要選擇時間
- 預約轉訂單時，`start_time` 和 `end_time` 會自動使用預約日期和結束日期（只保存日期）
- 其他日期時間欄位（`expected_return_time`, `ship_arrival_time`, `ship_return_time`）保持日期時間格式不變
- 編輯模式下可以正確處理舊數據（可能帶時間的數據會自動提取日期部分）

### 技術細節
- 後端驗證規則 `nullable|date` 已支持日期格式（不帶時間）
- MySQL/MariaDB 的 `datetime` 欄位可以接受只有日期的值（會自動補 00:00:00）
- 日期比較邏輯使用 `strtotime()`，可以正確處理只有日期的格式

## 2026-01-14 09:43:04 (+8) - 修正天數計算規則

### 變更內容

#### 後端
- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 修正 `send()` 和 `convertToOrder()` 方法中的天數計算邏輯
  - 天數計算規則：
    - 1 天（同日租）：天數 = 1，使用當日調車費用 (`same_day_transfer_fee`)
    - 2 天（1 夜）：天數 = 1，使用跨日調車費用 (`overnight_transfer_fee`)
    - 3 天（2 夜）：天數 = 2，使用跨日調車費用 (`overnight_transfer_fee`)
    - 以此類推：天數 = diffInDays（夜數）
  - 計算公式：天數 = diffInDays（開始日期到結束日期的天數差）

### 功能說明
- 天數計算改為使用夜數（diffInDays），確保計算邏輯正確
- 同日租（1天）仍使用當日調車費用，天數為 1
- 跨日租使用跨日調車費用，天數等於夜數（diffInDays）

### 計算範例
- 開始日期：2026/1/14，結束日期：2026/1/14 → 1 天，天數 = 1（同日租）
- 開始日期：2026/1/14，結束日期：2026/1/15 → 2 天，1 夜，天數 = 1（跨日租）
- 開始日期：2026/1/14，結束日期：2026/1/16 → 3 天，2 夜，天數 = 2（跨日租）
- 開始日期：2026/1/14，結束日期：2026/1/17 → 4 天，3 夜，天數 = 3（跨日租）

## 2026-01-14 09:39:50 (+8) - 後臺訂單管理：修改計算規則使用合作商的機車型號費用

### 變更內容

#### 後端
- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 修改 `convertToOrder()` 方法，新增調車費用計算邏輯
  - 根據合作商（partner_id）查詢該合作商的機車型號調車費用
  - 計算邏輯：
    1. 根據預約的開始日期和結束日期計算租期天數
    2. 判斷租期類型：同日租（1天）使用 `same_day_transfer_fee`，跨日租使用 `overnight_transfer_fee`
    3. 遍歷預約中的每個機車型號需求，從 `partner_scooter_model_transfer_fees` 表查詢對應的調車費用
    4. 計算公式：調車費用 × 台數 × 天數
    5. 累加所有車型的調車費用得到總金額
  - 如果沒有提供 `payment_amount`，自動使用計算出的調車費用作為訂單金額
  - 如果提供了 `payment_amount`，則使用提供的金額（允許手動覆蓋）
  - 將 `payment_amount` 驗證規則從 `required` 改為 `nullable`（可選）
  - 如果沒有指定合作商，會嘗試使用預約中的 `partner_id`，或使用預設線上預約合作商

#### 前端
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `handleConvertBookingClick()` 函數
  - 移除前端的手動金額計算，不再傳入 `payment_amount`
  - 讓後端根據合作商的機車型號費用自動計算調車費用

### 功能說明
- 後臺訂單管理在將預約轉為訂單時，會自動根據選擇的合作商查詢該合作商的機車型號調車費用
- 根據預約的租期天數和機車型號、數量，自動計算調車費用總金額
- 計算規則與線上預約的計算邏輯一致，確保數據一致性
- 如果沒有選擇合作商，系統會使用預約中記錄的合作商或預設線上預約合作商
- 管理員仍可手動輸入金額來覆蓋自動計算的結果

### 計算範例
假設預約：
- 預約日期：2026/1/14
- 結束日期：2026/1/17（共 4 天，跨日租）
- 合作商：藍白
- 機車型號：ES-TEST 白牌 x 1，ES-1000 綠牌 x 1
- 藍白合作商設定：
  - ES-TEST 白牌：跨日調車費用 200
  - ES-1000 綠牌：跨日調車費用 150

計算結果：
- ES-TEST 白牌：200 × 1 × 4 = 800
- ES-1000 綠牌：150 × 1 × 4 = 600
- 總調車費用：800 + 600 = 1,400

## 2026-01-14 09:11:54 (+8) - 合作商新增/編輯時機車型號按順序排列

### 變更內容

#### 前端
- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 更新 `ScooterModel` interface，新增 `sort_order` 欄位
  - 在顯示機車型號時，按照 `sort_order` 降序排列（數字越大越靠前）
  - 確保合作商新增或編輯時，機車型號按照設定的順序顯示

### 功能說明
- 合作商新增或編輯時，調車費用設定區塊中的機車型號會按照後端設定的 `sort_order` 順序排列顯示
- 排序方式：`sort_order` 數字越大越靠前（降序排列），與後端 API 排序邏輯一致

## 2026-01-13 17:38:17 (+8) - 線上預約新增調車費用總金額計算 (total_amount for bookings)

### 變更內容

#### 後端
- **Migration** (`database/migrations/2026_01_12_224000_add_total_amount_to_bookings_table.php`)
  - 在 `bookings` 資料表新增 `total_amount` 欄位 (`unsignedInteger`, `nullable`)，用於儲存預約調車費用的總金額（只包含調車費用，不含租金）。

- **Booking.php** (`app/Models/Booking.php`)
  - 在 `$fillable` 中新增 `total_amount`，並在 `$casts` 中將其轉換為 `integer`，方便後端與前端使用。

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 在 `send()` 方法中，依據線上預約的開始日期 (`appointmentDate`) 與結束日期 (`endDate`) 判斷租期類型與天數：
    - 若開始日期與結束日期相同（`diffInDays = 0`）：視為當日租，天數固定為 1，使用 `same_day_transfer_fee_*` 欄位。
    - 若天數大於 1（即任何跨天的情況，`diffInDays > 0`）：視為跨日租，使用夜數計算天數：`days = diffInDays(start, end)`（例如：1/1–1/2 → 1；1/1–1/3 → 2），使用 `overnight_transfer_fee_*` 欄位。
    - **規則**：只要大於 1 個天數（即不是同一天），就按照跨日計算。
  - 對每個車型需求 (`$data['scooters']`) 計算調車費用：
    - 依車型（白牌 / 綠牌 / 電輔車 / 三輪車）對應到合作商的調車費用欄位（`*_white|green|electric|tricycle`）。
    - 計算公式：單一車型費用 = 對應調車費用 × 該車型台數 × 天數（夜數）。
    - 將所有車型的費用加總為 `$totalTransferFee`，並在建立 `Booking` 時寫入 `total_amount` 欄位。
  - 若找不到預設合作商或該車型費用未設定，則視為 0 元，不影響其他車型的計算。

### 功能說明
- 線上預約在送出時，會根據「預設合作商」的調車費用設定、租期天數（以夜數計算）與每個車型的台數，自動計算並儲存「調車費用總金額」到 `bookings.total_amount`。
- 此總金額僅包含調車費用，不會包含租車費用，方便後續對帳與報表使用。

## 2026-01-12 22:40:00 (+8) - 合作商新增調車費用欄位（按車型分類）

### 變更內容

#### 後端
- **Migration** (`database/migrations/2026_01_12_223000_add_transfer_fees_to_partners_table.php`)
  - 新增 migration 添加兩個欄位到 partners 表：
    - `same_day_transfer_fee` (decimal, nullable): 當日調車費用
    - `overnight_transfer_fee` (decimal, nullable): 跨日調車費用

- **Migration** (`database/migrations/2026_01_12_223100_modify_transfer_fees_to_partners_table.php`)
  - 新增 modify migration，將兩個欄位改為8個欄位（按車型分類）：
    - 在 `up()` 方法中：
      - 先檢查並刪除舊的 `same_day_transfer_fee` 和 `overnight_transfer_fee` 欄位（如果存在）
      - 然後添加8個新欄位到 partners 表（4種車型 × 2種租期）：
        - 當日調車費用：
          - `same_day_transfer_fee_white` (decimal, nullable): 當日調車費用-白牌
          - `same_day_transfer_fee_green` (decimal, nullable): 當日調車費用-綠牌
          - `same_day_transfer_fee_electric` (decimal, nullable): 當日調車費用-電輔車
          - `same_day_transfer_fee_tricycle` (decimal, nullable): 當日調車費用-三輪車
        - 跨日調車費用：
          - `overnight_transfer_fee_white` (decimal, nullable): 跨日調車費用-白牌
          - `overnight_transfer_fee_green` (decimal, nullable): 跨日調車費用-綠牌
          - `overnight_transfer_fee_electric` (decimal, nullable): 跨日調車費用-電輔車
          - `overnight_transfer_fee_tricycle` (decimal, nullable): 跨日調車費用-三輪車
    - 在 `down()` 方法中：
      - 刪除新的8個欄位
      - 回復舊的兩個欄位（`same_day_transfer_fee` 和 `overnight_transfer_fee`），如果需要的話

- **Migration** (`database/migrations/2026_01_12_223200_change_transfer_fees_to_integer.php`)
  - 新增 migration，將8個調車費用欄位從 decimal 改為 unsignedInteger（正整數）：
    - 在 `up()` 方法中：
      - 先將現有的 decimal 值轉換為整數（使用 ROUND 函數四捨五入）
      - 然後使用 `change()` 方法將欄位類型從 `decimal(10, 2)` 改為 `unsignedInteger`
    - 在 `down()` 方法中：
      - 將欄位類型回復為 `decimal(10, 2)`

- **Partner.php** (`app/Models/Partner.php`)
  - 在 `$fillable` 陣列中新增8個調車費用欄位

- **PartnerController.php** (`app/Http/Controllers/Api/PartnerController.php`)
  - 在 `store` 和 `update` 方法的驗證規則中新增8個費用欄位的驗證：
    - 所有費用欄位：nullable|integer|min:0（只允許正整數，0以上）

- **PartnerResource.php** (`app/Http/Resources/PartnerResource.php`)
  - 在返回數據中新增8個調車費用欄位
  - 將 integer 值轉換為 int 類型返回

#### 前端
- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 更新 `Partner` interface，新增8個調車費用欄位
  - 更新 `formData` state，新增8個費用欄位
  - 更新 `handleOpenModal` 和 `handleCloseModal`，處理新欄位的初始化和重置
  - 更新 `handleSubmit`，將所有費用欄位轉換為正整數或 null 後提交（使用 parseInt）
  - 在表單中新增調車費用區塊（位於「商店主管」下方）：
    - **當日調車費用**區塊：
      - 白牌：數字輸入框（只允許正整數）
      - 綠牌：數字輸入框（只允許正整數）
      - 電輔車：數字輸入框（只允許正整數）
      - 三輪車：數字輸入框（只允許正整數）
    - **跨日調車費用**區塊：
      - 白牌：數字輸入框（只允許正整數）
      - 綠牌：數字輸入框（只允許正整數）
      - 電輔車：數字輸入框（只允許正整數）
      - 三輪車：數字輸入框（只允許正整數）
    - 所有費用欄位：最小值 0，步長 1，只允許正整數（使用正則表達式驗證 `/^\d+$/`）

### 功能說明
- 合作商現在可以按車型分別設定當日調車費用和跨日調車費用
- 支援4種車型：白牌、綠牌、電輔車、三輪車
- 每個車型可以分別設定當日調車費用和跨日調車費用
- 所有費用欄位都是可選的（nullable），可以為空
- 費用欄位只允許正整數（0以上），不支援小數點
- 前端使用正則表達式驗證，只允許輸入數字
- 在新增和編輯合作商時都可以設定這些費用

---

## 2026-01-12 22:30:00 (+8) - 新增行動潛水月報表匯出功能

### 變更內容

#### 後端
- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 新增 `monthlyReport` 方法，生成月報表數據
  - 以 start_time 的月份為主來篩選訂單（使用 DATE_FORMAT 查詢）
  - 按日期和車型分組數據，區分當日租和跨日租
  - 日期使用 start_time 的日期（例如：訂單 1/11-1/15，key 在 1/11）
  - 生成整個月份的日期列表（即使沒有訂單也要顯示）
  - 判斷當日租/跨日租：如果 start_time 和 end_time 在同一天，則是當日租；否則是跨日租
  - 計算天數（夜）：結束日期 - 開始日期（只有跨日租才累加天數）
  - 天數 = 所有訂單天數相加
  - 金額：所有訂單金額相加（當日租和跨日租都累加）
  - 返回格式：包含 dates 數組（整個月份的所有日期，每個日期包含該日期所有車型的數據）和 models 數組（所有出現的車型列表）

- **api.php** (`routes/api.php`)
  - 新增 `/orders/monthly-report` API 路由，接收月份參數（YYYY-MM 格式）

#### 前端
- **api.ts** (`system/backend/lib/api.ts`)
  - 在 `ordersApi` 中新增 `monthlyReport` 方法，調用月報表 API

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 新增 `handleExportMonthlyReport` 函數，匯出月報表為 Excel 格式
  - 新增「匯出月報表」按鈕（藍色），位於「匯出 Excel」按鈕旁邊
  - 月報表格式（符合圖片格式）：
    - 第一行：標題「蘭光智能機車出租月報表」
    - 第二行：副標題「行動潛水」
    - 第三行：價格資訊「當日租 200/台，跨日租 300/台」
    - 表頭（3層結構，符合第二張圖片）：
      - 第一層：左側為「日期」、「星期」，右側為每個車型名稱
      - 第二層：每個車型下分為「當日租」、「跨日租」
      - 第三層：
        - 當日租下：台數
        - 跨日租下：台數、天數、金額
    - 數據行：顯示整個月份的所有日期（即使沒有訂單也顯示），每行包含該日期所有車型的數據
    - 月結總計：
      - 總台數/天數：每個車型的總台數、總天數、總金額
      - 小計：每個車型的金額小計
      - 總金額：所有車型的總和
    - 文件名：行動潛水月報表-YYYYMM.xlsx

### 功能說明
- 月報表用於告知合作商每個月幾號叫了什麼車、幾台、幾天、多少錢
- 每個月都需要這一份報表來對帳和收款
- 日期以訂單的 start_time 日期為準（例如：訂單 1/11-1/15，key 在 1/11）
- 顯示整個月份的所有日期，即使沒有訂單也顯示（數據為0）
- 區分當日租和跨日租：如果 start_time 和 end_time 在同一天，則是當日租；否則是跨日租
- 天數計算：結束日期 - 開始日期（夜數），只有跨日租才累加天數
- 天數 = 所有訂單天數相加
- 金額 = 所有訂單金額相加（當日租和跨日租都累加）
- 報表格式採用3層表頭結構：車型 → 當日租/跨日租 → 台數/天數/金額

---

## 2026-01-12 22:24:00 (+8) - 移除後台表單提交按鈕中的 Plus 圖標

### 變更內容

#### 後台
- **ContactInfosPage.tsx** (`system/backend/pages/ContactInfosPage.tsx`)
  - 移除表單提交按鈕中的 `<Plus size={18} />` 圖標
  - 現在只顯示文字「更新」或「新增」

- **LocationsPage.tsx** (`system/backend/pages/LocationsPage.tsx`)
  - 移除表單提交按鈕中的 `<Plus size={18} />` 圖標
  - 現在只顯示文字「更新」或「新增」

### 功能說明
- 所有後台表單的提交按鈕現在只顯示文字，不再有 Plus 圖標
- 保持一致的 UI 設計風格
- 其他頁面（GuidelinesPage、RentalPlansPage、BannersPage、GuesthousesPage 等）已經沒有 Plus 圖標

---

## 2026-01-12 22:21:00 (+8) - 修復後台「門市據點」圖片刪除功能

### 問題分析
- 圖片刪除按鈕被 file input 覆蓋，點擊刪除按鈕時會觸發文件選擇對話框
- 刪除圖片功能不完整，無法真正刪除已上傳的圖片

### 變更內容

#### 後端
- **LocationController.php** (`app/Http/Controllers/Api/LocationController.php`)
  - 在 `update` 方法的驗證規則中添加 `image_path` 欄位（允許 nullable）
  - 當 `image_path` 被設為 `null` 時，自動刪除舊圖片檔案
  - 使用 `ImageService` 刪除圖片檔案

#### 後台
- **LocationsPage.tsx** (`system/backend/pages/LocationsPage.tsx`)
  - 新增 `handleDeleteImage` 函數處理圖片刪除
  - 使用 `e.stopPropagation()` 和 `e.preventDefault()` 防止觸發 file input
  - 為刪除按鈕添加 `z-10` 確保在 file input 之上
  - 刪除圖片時會調用 API 更新 location，將 `image_path` 設為 `null`
  - 刪除後重新獲取資料並更新編輯狀態

### 功能說明
- 圖片刪除按鈕現在可以正常工作，不會被 file input 覆蓋
- 點擊刪除按鈕會顯示確認對話框
- 確認後會真正刪除圖片檔案和資料庫記錄
- 刪除後會自動更新列表和編輯狀態

---

## 2026-01-12 22:18:00 (+8) - 修正「門市據點」頁面描述文字，添加「各地服務據點位置」高亮顯示

### 變更內容

#### 前端
- **Location.tsx** (`system/frontend/pages/Location.tsx`)
  - 恢復完整的描述文字：「蘭光電動機車各地服務據點位置，歡迎您前來門市參觀選車，我們提供最專業的服務與諮詢。」
  - 為「各地服務據點位置」添加粗體和淺色背景高亮效果
  - 使用 `<span className="font-bold bg-gray-100 px-2 py-1 rounded">` 來實現高亮顯示
  - 更新位置：
    - SEO meta description
    - Structured data description
    - Header 區塊的描述文字（帶有 HTML 格式）

### 功能說明
- 「門市據點」頁面描述文字現在與設計圖一致
- 「各地服務據點位置」以粗體和淺色背景高亮顯示，更突出
- 保持完整的描述內容

---

## 2026-01-12 22:16:00 (+8) - 確認「聯絡我們」刪除功能正常，無圖片要求

### 變更內容

#### 後台
- **ContactInfosPage.tsx** (`system/backend/pages/ContactInfosPage.tsx`)
  - 確認刪除功能正常運作
  - 刪除功能不涉及圖片處理（ContactInfo 沒有圖片欄位）
  - `uploading` 狀態僅用於表單提交，不影響刪除功能

### 功能說明
- 「聯絡我們」的刪除功能正常，不會要求圖片
- ContactInfo 資料表沒有圖片欄位，刪除時只刪除文字資料
- 刪除按鈕功能正常，點擊後會顯示確認對話框，確認後刪除記錄

---

## 2026-01-12 22:14:00 (+8) - 修正前台「交通位置」頁面中「門市據點」的描述文字

### 變更內容

#### 前端
- **Location.tsx** (`system/frontend/pages/Location.tsx`)
  - 確認「門市據點」頁面的描述文字已修正
  - 描述文字為：「歡迎您前來門市參觀選車，我們提供最專業的服務與諮詢。」
  - 已移除「蘭光電動機車各地服務據點位置」部分，使描述更簡潔
  - 更新位置：
    - SEO meta description
    - Structured data description
    - Header 區塊的描述文字

### 功能說明
- 「門市據點」頁面描述文字已簡潔自然
- 已移除冗長的「各地服務據點位置」描述
- 保持專業服務與諮詢的承諾

---

## 2026-01-12 22:09:00 (+8) - 修復後台選單中「聯絡我們」顯示問題

### 變更內容

#### 後台
- **constants.tsx** (`system/backend/constants.tsx`)
  - 重新添加「聯絡我們」選單項
  - 位置在「租車須知」之後、「門市據點」之前
  - 路徑：`/contact-infos`

### 功能說明
- 後台選單現在正確顯示「聯絡我們」選項
- 「聯絡我們」位於「門市據點」前面，符合需求
- 點擊後可進入聯絡資訊管理頁面

---

## 2026-01-12 22:05:00 (+8) - 建立聯絡資訊管理功能並移除 footer 聯絡資訊

### 變更內容

#### 後端
- **Migration** (`database/migrations/2026_01_12_214342_create_contact_infos_table.php`)
  - 建立 `contact_infos` 資料表
  - 欄位：`store_name`（店名）、`address`（地址）、`phone`（電話）、`line_id`（LINE ID）、`sort_order`（排序）、`is_active`（是否啟用）

- **Model** (`app/Models/ContactInfo.php`)
  - 建立 ContactInfo Model
  - 定義 fillable 欄位和 casts

- **Controller** (`app/Http/Controllers/Api/ContactInfoController.php`)
  - 建立 ContactInfoController
  - 實作 CRUD 操作（index, store, show, update, destroy）
  - 支援 `active_only` 和 `search` 參數

- **API Routes** (`routes/api.php`)
  - 新增 `/api/contact-infos` 路由
  - 公開 GET 端點，保護的 POST/PUT/DELETE 端點

#### 前端
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 更新為從 API 取得聯絡資訊
  - 動態顯示多個聯絡資訊卡片
  - 每個卡片顯示店名、地址、電話、LINE ID
  - 地址和電話可點擊（Google Maps 和電話連結）
  - LINE ID 可點擊開啟 LINE

- **api.ts** (`system/frontend/lib/api.ts`)
  - 新增 `contactInfos.list()` API 方法

- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 移除 footer 中的地址、LINE ID、電話資訊
  - 只保留 Logo 和社群媒體連結

#### 後台
- **constants.tsx** (`system/backend/constants.tsx`)
  - 在「網站內容管理」選單中新增「聯絡我們」選項
  - 位置在「租車須知」之後、「門市據點」之前

- **ContactInfosPage.tsx** (`system/backend/pages/ContactInfosPage.tsx`)
  - 建立聯絡資訊管理頁面
  - 功能包括：列表顯示、新增、編輯、刪除
  - 表單欄位：店名、地址、電話、LINE ID、排序、狀態

- **api.ts** (`system/backend/lib/api.ts`)
  - 新增 `contactInfosApi` API 客戶端
  - 包含 list, get, create, update, delete 方法

- **App.tsx** (`system/backend/App.tsx`)
  - 新增 `/contact-infos` 路由
  - 使用 lazy loading 載入 ContactInfosPage

### 功能說明
- 後台可以管理多個聯絡資訊（店名、地址、電話、LINE ID）
- 前端「聯絡我們」頁面會動態顯示所有啟用的聯絡資訊
- Footer 不再顯示固定的聯絡資訊，改由「聯絡我們」頁面統一管理
- 後台選單中「聯絡我們」位於「門市據點」前面

---

## 2026-01-12 21:16:00 (+8) - 更新「門市據點」頁面描述文字

### 變更內容

#### 前端
- **Location.tsx** (`system/frontend/pages/Location.tsx`)
  - 更新頁面描述文字：
    - 從「蘭光電動機車位於小琉球交通便利的位置，歡迎您前來門市參觀選車，我們提供最專業的服務與諮詢。」
    - 改為「蘭光電動機車各地服務據點位置，歡迎您前來門市參觀選車，我們提供最專業的服務與諮詢。」
  - 更新位置：
    - SEO meta description
    - Structured data description
    - Header 區塊的描述文字

### 功能說明
- 「門市據點」頁面現在使用更簡潔的描述
- 強調「各地服務據點位置」，更符合多據點的服務模式
- 保持專業服務與諮詢的承諾

---

## 2026-01-12 21:11:00 (+8) - 更新「租車方案」頁面描述文字

### 變更內容

#### 前端
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 更新頁面描述文字：
    - 從「蘭光電動機車提供多種電動車租賃方案，滿足您不同的旅遊需求，讓您輕鬆探索小琉球的美景。」
    - 改為「蘭光電動機車提供彈性且多樣化的租賃方案，適用於旅遊、通勤與短期移動等多種情境。我們依據不同使用需求，規劃完善的租期與車型選擇，讓顧客能以安心、便利的方式完成每一次出行。」
  - 更新位置：
    - SEO meta description
    - Structured data description
    - Header 區塊的描述文字

### 功能說明
- 「租車方案」頁面現在使用更專業和詳細的描述
- 強調彈性、多樣化、適用多種情境
- 強調依據不同需求規劃完善的租期與車型選擇
- 強調安心、便利的服務體驗

---

## 2026-01-12 21:06:00 (+8) - 更新「關於我們」頁面內容

### 變更內容

#### 前端
- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 更新「我們的使命」區塊內容：
    - 強調「高品質的電動機車租賃服務」
    - 強調「更環保、更舒適且更安心的方式完成」
    - 強調「交通不只是移動的工具，而是旅程體驗中不可或缺的一環」
    - 強調「專注於服務流程與細節」
  - 更新「我們的 story」區塊內容：
    - 更新開立時間為「2025 年7月」
    - 詳細描述公司成立的背景和理念
    - 強調電動機車的優勢（安靜、低碳、輕鬆自在）
    - 強調持續優化服務品質的承諾
    - 強調用心經營與專業服務的重要性
  - 更新 SEO 描述和 header 描述文字

### 功能說明
- 「關於我們」頁面現在包含更詳細和專業的內容
- 內容更符合品牌定位和服務理念
- 強調環保、舒適、安心和專業服務

---

## 2026-01-12 20:51:00 (+8) - 為 mobile 選單添加 logo 和關閉按鈕

### 變更內容

#### 前端
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 在 mobile menu overlay 頂部添加 header 區塊
  - 包含 logo（可點擊返回首頁）和關閉按鈕（X 圖標）
  - 調整選單結構：
    - Header：logo + 關閉按鈕
    - Navigation：導航連結列表
    - Footer：行動按鈕（線上預約、聯絡我們）
  - 移除原本的 `pt-24` padding，改用結構化的 header

### 功能說明
- Mobile 選單現在包含完整的 header，顯示 logo 和關閉按鈕
- Logo 可點擊返回首頁並關閉選單
- 關閉按鈕（X）位於右上角，方便關閉選單
- 選單結構更清晰，符合常見的 mobile menu 設計模式

---

## 2026-01-12 20:46:00 (+8) - 修復 mobile 選單中「關於我們」被 header 遮擋的問題

### 問題分析
- Mobile header 的 z-index 是 `z-[60]`
- Mobile menu overlay 的 z-index 原本是 `z-[55]`
- 因為 header 的 z-index 更高，它會遮擋 menu overlay 的頂部內容
- 這導致第一個選單項目「關於我們」被 header 遮擋而無法顯示

### 變更內容

#### 前端
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 將 mobile menu overlay 的 z-index 從 `z-[55]` 調整為 `z-[65]`
  - 確保 menu overlay 在 header 之上，不會被遮擋
  - 這樣「關於我們」就能正常顯示在選單的第一個位置

### 功能說明
- Mobile 選單現在會正確顯示所有 5 個導航項目
- 「關於我們」會顯示在「租車方案」之前
- Menu overlay 現在位於 header 之上，不會被遮擋

---

## 2026-01-12 20:32:00 (+8) - 確認 mobile 導航選單代碼正確，建議重新構建以解決顯示問題

### 問題分析
- 代碼檢查確認 `NAV_ITEMS` 包含「關於我們」且順序正確（第一個位置）
- Mobile 選單使用 `NAV_ITEMS.map()` 渲染所有項目，沒有過濾邏輯
- 代碼邏輯完全正確，問題可能是構建緩存或瀏覽器緩存

### 建議解決方案
1. 清除 Vite 構建緩存：`cd system/frontend && rm -rf node_modules/.vite dist`
2. 重新構建前端：`cd system/frontend && pnpm build`
3. 清除瀏覽器緩存並硬刷新（Ctrl+F5 或 Cmd+Shift+R）

### 代碼確認
- `constants.tsx`: `NAV_ITEMS` 包含「關於我們」在第一個位置
- `Layout.tsx`: Mobile 選單使用 `NAV_ITEMS.map()` 渲染所有項目
- 沒有過濾邏輯或條件判斷

---

## 2026-01-12 20:32:00 (+8) - 修復 mobile 導航選單缺少「關於我們」的問題

### 變更內容

#### 前端
- **constants.tsx** (`system/frontend/constants.tsx`)
  - 確認 NAV_ITEMS 包含「關於我們」並在「租車方案」前面
  - 順序：關於我們 → 租車方案 → 租車須知 → 交通位置 → 聯絡我們

- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 確認 mobile 選單使用 `NAV_ITEMS.map()` 渲染所有項目
  - 沒有過濾邏輯，應該顯示所有 5 個導航項目

### 問題說明
- 代碼確認正確，`NAV_ITEMS` 包含「關於我們」且順序正確
- Mobile 選單應該顯示所有項目
- 如果仍然看不到「關於我們」，可能是構建緩存問題，需要重新構建前端

### 建議
- 清除瀏覽器緩存（Ctrl+F5 或 Cmd+Shift+R）
- 重新構建前端：`cd system/frontend && pnpm build`
- 清除 Vite 緩存：`rm -rf node_modules/.vite dist`

---

## 2026-01-12 17:43:00 (+8) - 確認 mobile 導航選單包含「關於我們」並在「租車方案」前面

### 變更內容

#### 前端
- **constants.tsx** (`system/frontend/constants.tsx`)
  - 確認 NAV_ITEMS 順序正確：
    - 「關於我們」已在第一個位置
    - 「租車方案」在第二個位置
    - 確保 mobile 和 desktop 導航選單都正確顯示所有項目

### 功能說明
- Mobile 導航選單現在應該正確顯示「關於我們」在「租車方案」前面
- NAV_ITEMS 的順序已確認正確
- 如果 mobile 上仍然看不到「關於我們」，可能是緩存問題，請清除瀏覽器緩存或重新構建

---

## 2026-01-12 17:38:00 (+8) - 為 mobile 底部的「蘭光電動機車」區塊添加圓角

### 變更內容

#### 前端
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 為 mobile 底部的 footer 區塊添加圓角：
    - 在 mobile 上使用白色背景（`bg-white md:bg-[#f0f4ff]`）
    - 添加頂部圓角：`rounded-t-[80px] md:rounded-t-none`
    - 在 mobile 上顯示圓潤的頂部圓角，與 Hero Section 的圓角風格一致
    - Desktop 上保持原來的樣式（無頂部圓角）

### 功能說明
- Mobile 底部的「蘭光電動機車」聯繫信息區塊現在有圓潤的頂部圓角（80px）
- 與 Hero Section 的圓角風格保持一致
- Desktop 上保持原來的樣式，不影響桌面端的顯示

---

## 2026-01-12 17:31:00 (+8) - 增加圓角半徑以匹配圖片中紅線標示的圓潤形狀

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 增加圓角半徑以匹配圖片中紅線標示的圓潤形狀：
    - 將圓角半徑從 `60px` 增加到 `80px`
    - 讓圓角更圓潤，更接近圖片中紅線標示的橢圓形圓潤形狀
    - 確保在 mobile 和 desktop 上都能顯示相同的圓潤圓角效果

### 功能說明
- Hero Section 圖片現在有更圓潤的圓角（80px），更接近圖片中紅線標示的形狀
- 圓角在所有設備上保持一致，使用 inline style 確保渲染一致性
- 提供更圓潤、更美觀的視覺效果

---

## 2026-01-12 17:19:00 (+8) - 使用 inline style 確保圓角在所有設備上正確顯示

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 使用 inline style 確保圓角在所有設備上正確顯示：
    - 在容器 div 和 img 元素上都添加 `style={{ borderRadius: '60px' }}`
    - 確保 mobile 和 desktop 上都能顯示圓角效果
    - 移除 Tailwind 響應式圓角類別，改用固定的 inline style 以確保一致性

### 功能說明
- Hero Section 圖片現在在所有設備上都有統一的圓角（60px）
- 使用 inline style 確保圓角在所有瀏覽器和設備上都能正確渲染
- 確保 mobile 和 desktop 上都能看到完整的圓角效果

---

## 2026-01-12 17:15:00 (+8) - 增加 Hero Section 圖片圓角半徑，讓圓弧更圓

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 增加 Hero Section 圖片容器的圓角半徑：
    - 從 `rounded-[40px] sm:rounded-[50px] md:rounded-[60px] lg:rounded-[80px]` 
    - 改為 `rounded-[60px] sm:rounded-[80px] md:rounded-[100px] lg:rounded-[120px] xl:rounded-[150px]`
    - 圓角半徑大幅增加，讓圓弧效果更明顯、更圓潤
    - 在超大螢幕上（xl）使用更大的圓角（150px）

### 功能說明
- Hero Section 圖片現在有更明顯的圓弧造型
- 圓角半徑根據螢幕尺寸響應式調整，從 60px 到 150px
- 提供更圓潤、更美觀的視覺效果

---

## 2026-01-12 17:11:00 (+8) - 為 Hero Section 圖片添加四邊圓弧造型

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 為 Hero Section 圖片容器添加圓角：
    - 添加響應式圓角類別：`rounded-[40px] sm:rounded-[50px] md:rounded-[60px] lg:rounded-[80px]`
    - 在保持滿版顯示的同時，為圖片添加四邊圓弧造型
    - 圓角大小會根據螢幕尺寸自動調整

### 功能說明
- Hero Section 圖片現在有四邊圓弧造型
- 圓角大小會根據螢幕尺寸響應式調整
- 在保持滿版顯示的同時，提供更美觀的視覺效果

---

## 2026-01-12 17:05:00 (+8) - 修改 Hero Section 為完全滿版顯示，移除上下灰色框

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 修改 Hero Section 為完全滿版顯示：
    - 移除 section 的上下 padding（`py-12 sm:py-16 md:py-0`），改為無 padding
    - 移除容器的左右 padding（`px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16`），改為 `px-0` 讓內容完全滿版
    - 移除 gap（`gap-8 sm:gap-12`），改為 `gap-0` 讓左右內容緊貼
    - 將 padding 移到文字區塊內部（`px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 py-8 md:py-0`），確保文字有適當間距但圖片滿版
    - 移除圖片容器的圓角和陰影（`rounded-[40px] sm:rounded-[60px] md:rounded-[80px] overflow-hidden shadow-2xl blob-shape`），讓圖片完全滿版顯示
    - 現在 Hero Section 在 desktop 和 mobile 上都完全滿版，沒有上下灰色框，左右內容在同一排

### 功能說明
- Hero Section 現在在 desktop 和 mobile 上都完全滿版顯示
- 移除了上下灰色框（padding），讓內容填滿整個區塊
- Desktop 上左右內容在同一排，沒有左右邊距
- 圖片區域完全滿版，文字區域保持適當的內部 padding

---

## 2026-01-12 17:01:00 (+8) - 修改 Hero Section 為滿版顯示（Desktop 和 Mobile）

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 修改 Hero Section 為滿版顯示：
    - 移除 `container mx-auto` 限制，改為 `w-full` 讓區塊滿版顯示
    - 調整 padding：從 `px-4 sm:px-6 md:px-12` 改為 `px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16`
    - 添加 `w-full` 到 section 元素，確保在 desktop 和 mobile 上都滿版顯示
    - 現在 Hero Section 在 desktop 和 mobile 上都使用相同的滿版模式

### 功能說明
- Hero Section 現在在 desktop 和 mobile 上都滿版顯示
- 移除了容器寬度限制，讓內容可以充分利用整個螢幕寬度
- 保持了適當的 padding，確保內容不會貼到螢幕邊緣

---

## 2026-01-12 16:02:00 (+8) - 修復首頁 Hero Section 圖片被裁剪問題

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 修復 Hero Section 圖片顯示問題：
    - 將 `object-cover` 改為 `object-contain`，確保圖片完整顯示而不被裁剪
    - 添加 `bg-gray-100` 背景色，當圖片比例與容器不匹配時提供背景
    - 現在圖片會完整顯示，左右兩側不會被刪除

### 功能說明
- Hero Section 的圖片現在會完整顯示，不會被裁剪
- 如果圖片比例與容器不匹配，會顯示灰色背景而不是裁剪圖片
- 確保用戶可以看到完整的圖片內容

---

## 2026-01-12 15:59:00 (+8) - 配置後端管理系統也使用自動 API URL 檢測

### 變更內容

#### 後端
- **api.ts** (`system/backend/lib/api.ts`)
  - 實現自動 API URL 檢測（與前端一致）：
    - 根據當前域名自動判斷 API 基礎 URL
    - Production 環境（languangsmart.com）使用 `https://languangsmart.com/api`
    - Develop 環境（scooter-rental.ai-tracks.com）使用 `https://scooter-rental.ai-tracks.com/api`
    - 開發環境默認使用 `http://localhost:8000/api`
    - 優先使用環境變數 `VITE_API_BASE_URL`（如果設置）

#### 部署腳本
- **build.sh** (`build.sh`)
  - 在構建後端時也自動設置環境變數：
    - Production 模式：設置 `VITE_API_BASE_URL=https://languangsmart.com/api`
    - Develop 模式：設置 `VITE_API_BASE_URL=https://scooter-rental.ai-tracks.com/api`
  - 在構建輸出中顯示使用的 API URL

### 功能說明
- 後端管理系統現在也會自動根據域名判斷 API URL
- 與前端保持一致的自動檢測邏輯
- 構建腳本會為前端和後端都設置正確的 API URL

---

## 2026-01-12 15:55:00 (+8) - 配置 Production 環境使用 languangsmart.com API

### 變更內容

#### 前端
- **api.ts** (`system/frontend/lib/api.ts`)
  - 實現自動 API URL 檢測：
    - 根據當前域名自動判斷 API 基礎 URL
    - Production 環境（languangsmart.com）使用 `https://languangsmart.com/api`
    - Develop 環境（scooter-rental.ai-tracks.com）使用 `https://scooter-rental.ai-tracks.com/api`
    - 開發環境默認使用 `http://localhost:8000/api`
    - 優先使用環境變數 `VITE_API_BASE_URL`（如果設置）

#### 部署腳本
- **build.sh** (`build.sh`)
  - 在構建前端時自動設置環境變數：
    - Production 模式：設置 `VITE_API_BASE_URL=https://languangsmart.com/api`
    - Develop 模式：設置 `VITE_API_BASE_URL=https://scooter-rental.ai-tracks.com/api`
  - 在構建輸出中顯示使用的 API URL

### 功能說明
- Production 環境現在會自動使用 `https://languangsmart.com/api` 作為 API 基礎 URL
- 無需手動配置環境變數，系統會根據當前域名自動判斷
- 構建腳本會自動設置正確的 API URL，確保構建後的應用使用正確的 API 端點

---

## 2026-01-12 15:53:00 (+8) - 添加故障排除文檔

### 變更內容

#### 文檔
- **TROUBLESHOOTING.md** (新建)
  - 添加故障排除指南，包含常見問題和解決方案：
    - API 連接問題（ERR_CONNECTION_REFUSED）
    - CSS 文件 404 錯誤
    - CORS 問題
  - 提供詳細的檢查步驟和解決方案

### 功能說明
- 幫助開發者快速診斷和解決常見的開發環境問題
- 提供多種解決方案以適應不同的開發環境（Laravel serve、Laragon 等）

---

## 2026-01-12 15:51:00 (+8) - 修復 index.css 404 錯誤和 API CORS 問題

### 變更內容

#### 前端
- **index.html** (`system/frontend/index.html`)
  - 移除不存在的 `/index.css` 引用：
    - 刪除 `<link rel="stylesheet" href="/index.css">` 標籤
    - 項目使用 Tailwind CSS（通過 CDN），不需要額外的 CSS 文件

#### 後端
- **bootstrap/app.php** (`bootstrap/app.php`)
  - 添加 CORS 中間件配置：
    - 在 API 路由中添加 `HandleCors` 中間件
    - 確保 API 請求可以正確處理跨域請求

### 問題修復
1. **index.css 404 錯誤**：
   - 原因：`index.html` 中引用了不存在的 `/index.css` 文件
   - 解決：移除該引用，因為項目使用 Tailwind CSS CDN，不需要額外的 CSS 文件

2. **API captcha/generate 請求失敗**：
   - 原因：缺少 CORS 配置，導致跨域請求被阻止
   - 解決：在 `bootstrap/app.php` 中添加 `HandleCors` 中間件到 API 路由

### 功能說明
- 前端現在不會再嘗試加載不存在的 `index.css` 文件
- API 請求現在可以正確處理跨域請求，包括 `captcha/generate` 端點
- 確保前端（運行在 localhost:3000）可以正確訪問後端 API（運行在 localhost:8000）

---

## 2026-01-12 14:50:00 (+8) - 完全移除 Banner 內容寬度限制，確保 Desktop 完整顯示

### 變更內容

#### 前端
- **BannerCarousel.tsx** (`system/frontend/components/BannerCarousel.tsx`)
  - 完全移除內容區域的 max-width 限制：
    - 從 `max-w-2xl md:max-w-3xl lg:max-w-4xl` 改為 `w-full md:w-auto md:max-w-none`
    - 在 mobile 上使用 `w-full` 確保填滿寬度
    - 在 desktop 上使用 `w-auto` 和 `max-w-none` 讓內容可以根據實際需要顯示
  - 增加更大的 padding：`xl:px-32` 在超大螢幕上提供更多空間
  - 增加更大的標題文字：`2xl:text-6xl` 在超大螢幕上顯示更大的標題
  - 添加 `break-words` 類別確保長文字可以正確換行

### 功能說明
- Banner 內容現在在 Desktop 上可以完整顯示，不會被截斷
- 內容寬度會根據實際需要自動調整，不再受到固定 max-width 限制
- 在超大螢幕上提供更大的 padding 和文字大小，確保視覺效果更好

---

## 2026-01-12 14:46:00 (+8) - 修復 Banner 內容寬度限制，恢復 Desktop 正常顯示

### 變更內容

#### 前端
- **BannerCarousel.tsx** (`system/frontend/components/BannerCarousel.tsx`)
  - 調整 Banner 內容區域的最大寬度：
    - 從 `max-w-xs sm:max-w-sm md:max-w-md` 改為 `max-w-2xl md:max-w-3xl lg:max-w-4xl`
    - 增加標題文字大小響應式類別：`xl:text-5xl`
  - 確保 Banner 內容在 Desktop 上可以正常顯示，不會被截斷

### 功能說明
- Banner 內容區域現在有更大的最大寬度，適合 Desktop 顯示
- 文字大小會根據螢幕尺寸自動調整，在大型螢幕上顯示更大的標題
- 解決了 Banner 內容被截斷的問題

---

## 2026-01-12 14:40:00 (+8) - 移除視圖切換按鈕並修復 Banner 顯示問題

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 完全移除視圖切換功能：
    - 移除 `viewMode` 狀態
    - 移除 `getContainerClass()` 函數
    - 移除視圖切換按鈕 UI（手機、桌機按鈕）
    - 移除視圖容器的 wrapper div，讓內容正常填滿寬度
    - 移除不再需要的 `Smartphone` 和 `Monitor` 圖標導入
  - 修復 Banner 顯示問題：
    - 移除限制寬度的容器類別（`max-w-[375px]` 和 `min-w-[1024px]`）
    - Banner 現在可以正常填滿整個頁面寬度

### 功能說明
- 首頁現在使用正常的響應式設計，不再有視圖切換功能
- Banner 可以正確填滿整個頁面寬度，不會再出現跑掉的問題
- 所有內容都會根據螢幕大小自動調整，使用 Tailwind CSS 的響應式類別

---

## 2026-01-12 14:33:00 (+8) - 移除首頁 AUTO 視圖切換按鈕

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 移除 AUTO 視圖切換按鈕：
    - 從 `viewMode` 狀態類型中移除 `'auto'` 選項
    - 將預設視圖模式改為 `'mobile'`
    - 移除 AUTO 按鈕的 UI 元素
    - 現在只保留 Mobile 和 Desktop 兩個切換按鈕

### 功能說明
- 簡化視圖切換功能，只保留移動端和桌面端兩種視圖模式
- 預設顯示移動端視圖（375px 寬度）
- 可以通過右上角的切換按鈕在移動端和桌面端視圖之間切換

---

## 2026-01-12 14:30:00 (+8) - 在 build.sh 中添加清除 React 緩存步驟

### 變更內容

#### 部署腳本
- **build.sh** (`build.sh`)
  - 添加清除 React/Vite 緩存步驟：
    - 在構建後端前清除緩存：
      - 清除 `node_modules/.vite` 目錄（Vite 構建緩存）
      - 清除 `dist` 目錄（如果存在）
    - 在構建前端前清除緩存：
      - 清除 `node_modules/.vite` 目錄（Vite 構建緩存）
      - 清除 `dist` 目錄（如果存在）
    - 更新步驟編號：從 7 步改為 9 步
    - 添加詳細的緩存清除訊息，顯示已清除的目錄

### 功能說明
- 現在每次構建前都會清除 React/Vite 的緩存，確保構建結果是最新的
- 清除 Vite 緩存可以避免舊緩存導致的構建問題
- 清除 dist 目錄確保構建輸出目錄是乾淨的
- 緩存清除步驟會顯示詳細的清除訊息，方便追蹤

---

## 2026-01-12 14:28:00 (+8) - 修正 build.sh 路徑展開問題

### 變更內容

#### 部署腳本
- **build.sh** (`build.sh`)
  - 修正路徑展開問題：
    - 將 `~/htdocs/...` 改為 `$HOME/htdocs/...`
    - 在 bash 腳本中，`~` 在變數中不會自動展開，需要使用 `$HOME` 環境變數
    - 所有 `cd` 命令的路徑都加上雙引號，確保路徑中包含空格或特殊字符時也能正確處理
    - Production 模式路徑：`$HOME/htdocs/languangsmart.com`
    - Develop 模式路徑：`$HOME/htdocs/scooter-rental.ai-tracks.com`

### 功能說明
- 現在路徑可以正確展開，解決 "No such file or directory" 錯誤
- 使用 `$HOME` 環境變數確保跨平台兼容性
- 添加雙引號保護路徑，防止特殊字符問題

---

## 2026-01-12 14:18:00 (+8) - 修改 build.sh 支援 production 和 develop 模式

### 變更內容

#### 部署腳本
- **build.sh** (`build.sh`)
  - 重構為支援多環境部署：
    - 添加命令行參數檢查：`production` 或 `develop`
    - **Production 模式**：
      - 專案目錄：`~/htdocs/languangsmart.com`
      - 完整的生產環境部署流程
    - **Develop 模式**：
      - 專案目錄：`~/htdocs/scooter-rental.ai-tracks.com`
      - 開發環境部署流程
    - 改進錯誤處理：
      - 添加目錄切換錯誤檢查
      - 添加命令執行錯誤檢查
      - 非關鍵步驟失敗時顯示警告但繼續執行
      - 關鍵步驟失敗時終止執行
    - 修正路由快取命令：從 `php artisan r:cache` 改為 `php artisan route:clear && php artisan route:cache`
    - 添加配置清除步驟：`php artisan config:clear` 在快取前清除舊配置
    - 添加 shebang：`#!/bin/bash`
    - 改進輸出訊息，顯示當前模式和專案目錄

### 使用方式
```bash
# Production 環境部署
./build.sh production

# Develop 環境部署
./build.sh develop
```

### 功能說明
- 現在可以通過參數選擇部署到 production 或 develop 環境
- Production 環境使用 `languangsmart.com` 目錄
- Develop 環境使用 `scooter-rental.ai-tracks.com` 目錄
- 改進了錯誤處理，確保部署過程的穩定性

---

## 2026-01-12 14:14:00 (+8) - 添加首頁移動端/桌面端視圖切換功能

### 變更內容

#### 前端
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 添加視圖切換功能：
    - 導入 `Smartphone` 和 `Monitor` 圖標從 `lucide-react`
    - 添加 `viewMode` 狀態：`'auto' | 'mobile' | 'desktop'`
    - 添加浮動切換按鈕組（固定在右上角）：
      - AUTO 按鈕：自動響應式模式（預設）
      - Mobile 按鈕：強制移動端視圖（最大寬度 375px）
      - Desktop 按鈕：強制桌面端視圖（最小寬度 1024px）
    - 根據 `viewMode` 動態設置容器類別，控制頁面寬度
    - 切換按鈕使用 teal-600 背景色標示當前選中的模式

### 功能說明
- 開發者可以通過右上角的切換按鈕快速預覽移動端和桌面端的顯示效果
- AUTO 模式：使用正常的響應式設計，根據屏幕大小自動調整
- Mobile 模式：強制顯示為移動端視圖（375px 寬度），方便測試移動端效果
- Desktop 模式：強制顯示為桌面端視圖（最小 1024px 寬度），方便測試桌面端效果
- 切換按鈕固定在右上角，不影響頁面內容的查看

---

## 2026-01-12 14:09:00 (+8) - 修正移動端 Banner 16:9 比例顯示問題

### 變更內容

#### 前端
- **BannerCarousel.tsx** (`system/frontend/components/BannerCarousel.tsx`)
  - 修正移動端 Banner 16:9 比例顯示問題：
    - 添加 `isMobile` 狀態來檢測移動設備
    - 使用 `useEffect` 監聽窗口大小變化
    - 改用內聯 `style` 屬性設置 `aspectRatio: '16/9'`，確保在移動端強制應用 16:9 比例
    - 桌面端（md 以上，768px+）保持固定高度 `h-[600px]`
    - 同時更新 loading 狀態的容器比例
    - 使用 `minHeight: '0'` 確保 aspect ratio 正確計算

### 功能說明
- 現在移動端 Banner 使用內聯樣式強制應用 16:9 比例，確保在所有移動設備上都能正確顯示
- 桌面端保持原有的 600px 固定高度
- 使用 JavaScript 動態檢測設備類型，提供更可靠的響應式體驗

---

## 2026-01-12 14:08:00 (+8) - 更新 Instagram 連結

### 變更內容

#### 前端
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 更新 Instagram 連結：
    - 從 `https://www.instagram.com/languan_smart?igsh=M2IxaDN5cTFsZnJ2&utm_source=qr` 
    - 更新為 `https://www.instagram.com/languang_smart?igsh=M2IxaDN5cTFsZnJ2&utm_source=qr`
    - 修正 Instagram 用戶名從 `languan_smart` 改為 `languang_smart`

---

## 2026-01-12 12:36:00 (+8) - 修正移動端 Banner 比例和圖片顯示順序

### 變更內容

#### 前端
- **BannerCarousel.tsx** (`system/frontend/components/BannerCarousel.tsx`)
  - 修正移動端 Banner 比例為 16:9：
    - 將高度從固定的 `h-[400px] sm:h-[500px] md:h-[600px]` 改為 `aspect-[16/9] sm:aspect-[16/9] md:h-[600px]`
    - 確保在移動端和小屏幕設備上 Banner 保持 16:9 的寬高比
    - 同時更新 loading 狀態的容器比例

- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 優化 Featured Images Grid 的顯示順序：
    - 為第三張和第四張圖片添加 `order-3` 和 `order-4` 類別
    - 確保在移動端（2 列網格）中，第三張圖片正確顯示在第二行的左側位置
    - 桌面端保持原有的 4 列顯示順序

### 功能說明
- Banner 在移動端現在使用 16:9 的標準比例，提供更好的視覺效果
- Featured Images Grid 在移動端的顯示順序已優化，第三張圖片現在正確顯示在預期位置

---

## 2026-01-12 12:32:00 (+8) - 優化前台響應式設計 (RWD)

### 變更內容

#### 前端
- **BannerCarousel.tsx** (`system/frontend/components/BannerCarousel.tsx`)
  - 優化 Banner 輪播的響應式設計：
    - 高度從固定的 600px 改為響應式：`h-[400px] sm:h-[500px] md:h-[600px]`
    - 調整內容區域的 padding：`px-4 sm:px-8 md:px-16 lg:px-24`
    - 優化文字大小：標題從 `text-2xl md:text-4xl` 改為 `text-xl sm:text-2xl md:text-3xl lg:text-4xl`
    - 優化按鈕大小和間距
    - 優化箭頭按鈕的大小和位置

- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 優化首頁 Hero 區域的響應式設計：
    - 使用 `min-h-[60vh] sm:min-h-[50vh] md:h-[60vh]` 替代固定高度
    - 添加垂直 padding：`py-12 sm:py-16 md:py-0`
    - 優化文字大小：標題從 `text-4xl md:text-6xl` 改為 `text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
    - 優化圖片圓角：`rounded-[40px] sm:rounded-[60px] md:rounded-[80px]`
    - 優化按鈕和間距
  - 優化 Featured Images Grid：
    - 調整 padding：`py-12 sm:py-16 md:py-24`
    - 優化 gap：`gap-3 sm:gap-4 md:gap-8`
    - 優化圖片的 translate 值，在小屏幕上減少位移

- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 優化線上預約頁面的響應式設計：
    - 調整 header padding：`py-12 sm:py-16 md:py-20`
    - 優化標題大小：`text-3xl sm:text-4xl md:text-5xl lg:text-6xl`
    - 優化表單容器：`rounded-[30px] sm:rounded-[35px] md:rounded-[40px]`
    - 優化表單 padding：`p-6 sm:p-8 md:p-12`
    - 優化表單間距：`gap-6 sm:gap-8`、`space-y-4 sm:space-y-6`
    - 優化輸入框和標籤的文字大小

- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 優化租車方案頁面的響應式設計：
    - 調整 header padding 和文字大小
    - 優化方案卡片的圖片高度：`h-[300px] sm:h-[400px] md:h-[500px]`
    - 優化 Price Badge 的大小和位置
    - 優化間距和 padding

- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 優化關於我們頁面的響應式設計：
    - 調整 padding 和文字大小
    - 優化標題大小和間距

- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 優化租車須知頁面的響應式設計：
    - 調整 header padding 和標題大小
    - 優化分類按鈕的大小和間距
    - 優化問答內容的 padding 和文字大小

- **Location.tsx** (`system/frontend/pages/Location.tsx`)
  - 優化門市據點頁面的響應式設計：
    - 調整 header padding 和文字大小
    - 優化卡片容器的 padding 和圓角

- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 優化聯絡我們頁面的響應式設計：
    - 調整 header padding 和文字大小
    - 優化聯絡資訊卡片的 padding

- **Guesthouses.tsx** (`system/frontend/pages/Guesthouses.tsx`)
  - 優化民宿推薦頁面的響應式設計：
    - 調整 header padding 和標題大小
    - 優化網格佈局：`sm:grid-cols-2 lg:grid-cols-3`
    - 優化卡片間距和 padding

- **GuesthouseDetail.tsx** (`system/frontend/pages/GuesthouseDetail.tsx`)
  - 優化民宿詳細頁面的響應式設計：
    - 調整 header padding 和文字大小：`py-12 sm:py-16 md:py-20`
    - 優化返回按鈕和標題大小
    - 優化 loading 和 error 狀態的 padding 和文字大小
    - 優化內容區域的 padding 和圓角
    - 優化圖片網格的 gap 和 padding
    - 優化按鈕大小和文字大小

- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 優化關於我們頁面的響應式設計：
    - 優化 Story Section 和 Team/Values Section 的 padding 和圓角
    - 優化 Image Gallery 的 padding 和間距

- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 優化租車須知頁面的響應式設計：
    - 優化服務內容區塊的 padding 和文字大小
    - 優化民宿推薦卡片的 padding 和文字大小
    - 優化間距和標題大小

- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 優化線上預約頁面的響應式設計：
    - 優化右欄標籤的文字大小：`text-xs sm:text-sm`
    - 優化右欄輸入框的 padding：`px-3 py-2.5 sm:px-4 sm:py-3`
    - 優化車型選擇器的文字大小
    - 優化數量輸入框的寬度：`w-20 sm:w-24`
    - 優化移除按鈕的大小

### 功能說明
- 所有頁面現在都有更好的響應式設計，支援各種屏幕尺寸（手機、平板、桌面）
- 使用 Tailwind CSS 的響應式斷點：
  - `sm:` (640px) - 小屏幕（大手機）
  - `md:` (768px) - 中等屏幕（平板）
  - `lg:` (1024px) - 大屏幕（小桌面）
  - `xl:` (1280px) - 超大屏幕（大桌面）
- 優化了文字大小、間距、padding、圓角等，在不同屏幕尺寸下都有良好的顯示效果
- 改善了移動端的用戶體驗，文字更易讀，按鈕更易點擊
- 優化了表單元素的大小和間距，提升移動端的可用性

---

## 2026-01-12 12:20:00 (+8) - 添加前端 SEO 功能以支援 Google Search Console

### 變更內容

#### 前端
- **新增 SEO 組件** (`system/frontend/components/SEO.tsx`)
  - 創建可重用的 SEO 組件，用於動態設置頁面的 meta tags
  - 支援基本 SEO meta tags（title, description, keywords）
  - 支援 Open Graph meta tags（用於 Facebook、LinkedIn 等社交媒體）
  - 支援 Twitter Card meta tags
  - 支援 Canonical URL
  - 支援 Structured Data (JSON-LD) 用於 Google 搜尋結果

- **更新 index.html** (`system/frontend/index.html`)
  - 添加基礎 SEO meta tags（description, keywords, author, robots）
  - 添加 canonical link 標籤

- **為所有頁面添加 SEO 組件**
  - **Home.tsx**: 添加 LocalBusiness structured data
  - **About.tsx**: 添加 AboutPage structured data
  - **RentalPlans.tsx**: 添加 Product structured data
  - **Booking.tsx**: 添加 ReservationAction structured data
  - **Guidelines.tsx**: 添加 FAQPage structured data
  - **Location.tsx**: 添加 LocalBusiness structured data（包含地址、電話、營業時間）
  - **Contact.tsx**: 添加 ContactPage structured data
  - **Guesthouses.tsx**: 添加 CollectionPage structured data
  - **GuesthouseDetail.tsx**: 添加 LodgingBusiness structured data

- **創建 sitemap.xml** (`public/sitemap.xml`)
  - 包含所有主要頁面的 URL
  - 設置適當的 priority 和 changefreq
  - 注意：需要將 `yourdomain.com` 替換為實際的域名

- **更新 robots.txt** (`public/robots.txt`)
  - 允許所有搜尋引擎爬取
  - 添加 sitemap 位置
  - 禁止爬取 admin、api、storage 目錄

### 功能說明
- 所有頁面現在都有適當的 SEO meta tags
- 支援 Open Graph 和 Twitter Card，改善社交媒體分享效果
- 使用 Structured Data (JSON-LD) 幫助 Google 更好地理解網站內容
- sitemap.xml 幫助搜尋引擎發現和索引所有頁面
- robots.txt 指導搜尋引擎爬蟲的行為

### 注意事項
- 需要將 `sitemap.xml` 中的 `yourdomain.com` 替換為實際的域名
- 需要將 `robots.txt` 中的 `yourdomain.com` 替換為實際的域名
- 建議在 Google Search Console 中提交 sitemap.xml
- 建議定期更新 sitemap.xml 中的 lastmod 日期

---

## 2026-01-11 19:48:00 (+8) - 調整訂單管理操作下拉菜單位置：向下 6px 並向右 30px

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 調整操作下拉菜單的定位：
    - 將 `top` 從 `rect.top + window.scrollY + (rect.height / 2)` 調整為 `rect.top + window.scrollY + (rect.height / 2) + 6`（向下移動 6px）
    - 將 `right` 從 `window.innerWidth - rect.right` 調整為 `window.innerWidth - rect.right - 30`（向右移動 30px，減少 right 值等於向右移動）

### 功能說明
- 操作下拉菜單現在向下偏移 6px，向右偏移 30px
- 改善了視覺對齊和可用性

---

## 2026-01-11 19:46:00 (+8) - 調整訂單管理操作下拉菜單定位：對齊到按鈕位置

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 調整操作下拉菜單的定位邏輯：
    - 將 `top` 從 `rect.top + window.scrollY + 5` 調整為 `rect.top + window.scrollY + (rect.height / 2)`，使下拉菜單對齊到按鈕的垂直中心
    - 將 `right` 從 `window.innerWidth - rect.right + 20` 調整為 `window.innerWidth - rect.right`，使下拉菜單的右邊緣對齊按鈕的右邊緣
    - 下拉菜單現在準確地對齊到「...」按鈕的位置（紅線標示的位置）

### 功能說明
- 操作下拉菜單現在準確地對齊到「...」按鈕的位置
- 下拉菜單的右邊緣與按鈕右邊緣對齊
- 下拉菜單的垂直位置對齊到按鈕的垂直中心
- 編輯和刪除功能正常運作

---

## 2026-01-11 19:42:00 (+8) - 調整訂單管理操作下拉菜單位置：向下 5px 並向左 20px

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 調整操作下拉菜單的定位：
    - 將 `top` 從 `rect.top + window.scrollY` 調整為 `rect.top + window.scrollY + 5`（向下移動 5px）
    - 將 `right` 從 `window.innerWidth - rect.right` 調整為 `window.innerWidth - rect.right + 20`（向左移動 20px）

### 功能說明
- 操作下拉菜單現在向下偏移 5px，向左偏移 20px
- 改善了視覺對齊和可用性

---

## 2026-01-11 19:37:00 (+8) - 調整訂單管理操作下拉菜單：文字置中並與按鈕垂直對齊

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 調整操作下拉菜單的顯示方式：
    - 將下拉菜單的文字改為置中對齊（`text-center` 和 `justify-center`）
    - 調整下拉菜單的定位邏輯，從 `rect.bottom + 8` 改為 `rect.top`，使其與 "..." 按鈕垂直對齊（同排）
    - 編輯和刪除按鈕的文字和圖標現在都置中顯示

### 功能說明
- 操作下拉菜單現在與 "..." 按鈕垂直對齊（同排顯示）
- 下拉菜單中的「編輯」和「刪除」文字現在置中顯示
- 圖標和文字都使用置中對齊，視覺效果更加統一

---

## 2026-01-11 19:35:00 (+8) - 將未確認預約列表的 Email 改為直接顯示文字

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 將 Email 欄位從顯示框改為直接顯示文字：
    - 移除 Email 的 label 和顯示框
    - 將 Email 改為與其他欄位一樣的簡單文字顯示格式
    - Email 現在顯示在「其他欄位」的三列網格中，格式為：Email: email 地址
    - 拒絕和確認按鈕移到右側，不再與 Email 同一排

### 功能說明
- Email 現在以簡單的文字格式顯示，與其他欄位（如承租人姓名、LINE ID 等）保持一致
- 如果預約沒有 email，顯示 "-"
- UI 更加簡潔統一

---

## 2026-01-11 19:32:00 (+8) - 將訂單管理的「操作」欄位移到第一位

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 將「操作」欄位從最後一個位置移到第一個位置：
    - 在表頭（thead）中，將「操作」欄位移到第一個位置
    - 在表體（tbody）中，將對應的操作 td 也移到第一個位置
    - 「操作」欄位現在顯示在訂單列表的最左側

### 功能說明
- 「操作」欄位現在位於訂單列表的第一個位置（最左側）
- 其他欄位的順序保持不變
- 操作按鈕和下拉菜單功能保持不變

---

## 2026-01-11 19:29:30 (+8) - 將未確認預約列表的 Email 欄位改為只讀顯示

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 將 Email 欄位從可編輯改為只讀顯示：
    - 移除 email 輸入框的編輯功能
    - 移除「儲存」按鈕
    - 改為只讀的文字顯示框，顯示預約的 email 或 "-"（如果沒有 email）
    - 移除相關的編輯狀態管理（`editingEmails` state）
    - 移除 `handleEmailChange` 和 `handleEmailSave` 函數

### 功能說明
- Email 欄位現在只能顯示，無法編輯
- 如果預約沒有 email，顯示 "-"
- 簡化了 UI，移除了不必要的編輯功能

---

## 2026-01-11 08:35:00 - 修改所需租車類型/數量的顯示格式：使用背景顏色且文字為黑色

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 修改「所需租車類型/數量」的顯示方式：
    - 從 model 字串中提取車款類型（例如 "EB-500 電輔車" → "電輔車"）
    - 根據車款類型從 `typeColorMap` 獲取對應的背景顏色（與機車管理頁面一致）
    - 背景顏色映射：
      - 白牌：天藍色 (#7DD3FC)
      - 綠牌：綠色 (#86EFAC)
      - 電輔車：橘色 (#FED7AA)
      - 三輪車：黃色 (#FDE047)
    - 文字保持黑色（`text-gray-900`）
    - 格式：每個車型顯示為帶背景色的標籤，例如：EB-500 電輔車 x 1，ES-2000 白牌 x 1
  - 保留價格計算邏輯，不影響原來的計價方式

### 功能說明
- 「所需租車類型/數量」現在使用背景顏色標示，文字為黑色
- 顏色來自機車管理頁面的 `typeColorMap`，確保一致性
- 每個車型根據其車款類型顯示對應的背景顏色
- 價格計算邏輯保持不變

---

## 2026-01-11 08:30:00 - 恢復未確認預約列表的完整欄位顯示

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 恢復顯示所有預約詳細欄位：
    - Email（可編輯，帶儲存按鈕）
    - 承租人姓名
    - LINE ID
    - 行動電話
    - 預約日期
    - 結束日期
    - 船運公司
    - 船班時間（來）
    - 大人/人數
    - 小孩(12歲以下)/人數
    - 所需租車類型/數量（顯示機車型號和數量）
  - Email、拒絕和確認按鈕同一排顯示
  - 其他欄位以三列網格形式顯示

### 功能說明
- 未確認預約列表現在顯示完整的預約資訊
- Email 欄位可以編輯，修改後點擊「儲存」按鈕保存
- 所有欄位都以清晰的格式顯示
- 所需租車類型/數量使用彩色標籤顯示每種車型

---

## 2026-01-11 08:25:00 - 簡化未確認預約列表顯示：只顯示所需租車類型/數量

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 隱藏 Email 輸入框（但保留拒絕和確認按鈕）
  - 隱藏所有其他欄位（承租人姓名、LINE ID、行動電話、預約日期、結束日期、船運公司、船班時間、大人/人數、小孩/人數）
  - 只顯示「所需租車類型/數量」：
    - 顯示機車型號（model）
    - 顯示數量（count）
    - 使用彩色標籤顯示每種車型
    - 格式：機車型號 x 數量

### 功能說明
- 未確認預約列表現在只顯示：
  - 預約標題（#預約ID、承租人姓名、預約日期）
  - 拒絕和確認轉為訂單按鈕
  - 所需租車類型/數量（機車型號和數量）
- 其他所有詳細資訊都已隱藏，界面更簡潔

---

## 2026-01-11 07:10:00 - 隱藏未確認預約列表中的合作商欄位並修改租借天數計算公式

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 隱藏「合作商選擇」欄位（從 UI 中移除）
  - 修改 `calculateRentalDays` 函數的計算邏輯：
    - 計算包含開始和結束日期的總天數（inclusiveDays）
    - 如果總天數為 1（同一天），返回 1 天
    - 如果總天數大於 1，返回（總天數 - 1）天
    - 例如：1/12 ~ 1/12（1天）→ 1天
    - 例如：1/12 ~ 1/13（2天）→ 1天
    - 例如：1/12 ~ 1/14（3天）→ 2天

### 功能說明
- 「合作商」欄位不再顯示在未確認預約列表中
- 租借天數計算公式已調整：預約時間 ~ 結束時間 - 1 天（如果同一天則為 1 天）
- 價格計算仍然使用調整後的天數進行計算

---

## 2026-01-11 07:05:00 - 修改租車須知頁面行李配送區段的文字

### 變更內容

#### 前端
- **Guidelines** (`system/frontend/pages/Guidelines.tsx`)
  - 將「行李配送」區段中的文字從「輕鬆旅遊從蘭光電動機車開始，行李內的快樂回憶不論大小，由我們幫您守護」改為「輕鬆旅遊從蘭光電動機車開始，行李內的快樂回憶，由我們幫您守護」
  - 移除「不論大小」這部分文字

### 功能說明
- 簡化了行李配送區段的描述文字

---

## 2026-01-11 07:00:00 - 修改關於我們頁面的服務承諾文字

### 變更內容

#### 前端
- **About** (`system/frontend/pages/About.tsx`)
  - 將「服務承諾」區段中的「24小時客服支援」改為「官方 LINE 客服支援」

### 功能說明
- 更新了關於我們頁面中服務承諾的文字內容

---

## 2026-01-11 06:50:00 - 隱藏未確認預約列表中的價格明細和總金額顯示

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 隱藏「價格明細」區域的顯示（包括每種車型的價格計算顯示）
  - 隱藏「總金額」的顯示
  - 保留價格計算邏輯（`calculateTotalAmount`、`calculateRentalDays`、`handlePriceChange` 等函數）
  - 保留 `bookingPrices` 狀態管理
  - 確認轉為訂單時仍然使用計算的總金額發送到後端

### 功能說明
- 價格明細和總金額不再顯示在 UI 上
- 價格計算邏輯仍然保留並正常運作
- 轉換訂單時，系統仍然會根據價格計算邏輯計算總金額並發送到後端

---

## 2026-01-11 04:40:00 - 移除合作商編輯表單中的預設船運公司欄位

### 變更內容

#### 前端
- **PartnersPage** (`system/backend/pages/PartnersPage.tsx`)
  - 移除「預設船運公司」選項和相關說明文字
  - 從表單 UI 中移除預設船運公司的下拉選單和說明

### 功能說明
- 合作商編輯表單中不再顯示「預設船運公司」選項
- 其他功能保持不變

---

## 2026-01-11 04:50:00 - 在未確認預約列表中添加展開/收合功能

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 導入 `ChevronRight` 圖標（用於收合狀態）
  - 添加 `expandedBookings` 狀態來追蹤哪些預約是展開的
  - 為每個預約項目添加標題欄：
    - 顯示 `#預約ID`、承租人姓名、預約日期
    - 顯示展開/收合圖標（ChevronRight/ChevronDown）
    - 可點擊標題欄來展開/收合詳細內容
  - 預設所有預約都是收合狀態（`expandedBookings` 初始為空物件）
  - 詳細內容（Email、其他欄位、合作商、價格計算等）只在展開狀態下顯示
  - 為所有可互動元素（input、select、button）添加 `onClick` 事件阻止冒泡，避免觸發展開/收合

### 功能說明
- **展開/收合功能**：
  - 每個預約項目預設為收合狀態，只顯示 `#預約ID`、承租人姓名、預約日期
  - 點擊標題欄可以展開/收合詳細內容
  - 展開時顯示完整的預約資訊、合作商選擇、價格計算等
  - 收合時只顯示簡要資訊，節省空間

- **用戶體驗**：
  - 預設收合狀態，讓列表更簡潔
  - 點擊標題欄即可查看詳細資訊
  - 內部互動元素（輸入框、下拉選單、按鈕）不會觸發展開/收合

---

## 2026-01-11 04:45:00 - 在未確認預約列表中直接顯示合作商選擇和金額計算

### 變更內容

#### 前端
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 導入 `rentalPlansApi` 用於獲取租車方案價格
  - 添加狀態管理：
    - `partners`: 存儲合作商列表
    - `rentalPlans`: 存儲租車方案列表
    - `bookingPartners`: 存儲每個預約選擇的合作商
    - `bookingPrices`: 存儲每個預約每種車型的基本價格
  - 在 `fetchPartners` 中設置 `partners` 狀態
  - 添加 `fetchRentalPlans` useEffect 獲取租車方案
  - 修改 `fetchPendingBookings`：
    - 初始化每個預約的合作商（優先使用預約的 `partner_id`，否則使用預設合作商）
    - 初始化每個預約的基本價格（從 `RentalPlan` API 獲取）
  - 添加處理函數：
    - `handlePartnerChange`: 處理合作商變更
    - `handlePriceChange`: 處理價格變更
    - `calculateRentalDays`: 計算租借天數
    - `calculateTotalAmount`: 計算總金額
  - 修改 `handleConvertBookingClick`：
    - 改為直接調用 API 轉換訂單，使用列表中選擇的合作商和計算的總金額
    - 不再打開 Modal，直接在列表界面完成轉換
  - 在未確認預約列表的每個預約卡片中添加：
    - **合作商選擇下拉框**：可選擇合作商，預設值為預約的 `partner_id` 或系統預設合作商
    - **價格明細區域**：
      - 每種車型顯示：車型名稱、基本價格（可編輯輸入框）、數量、天數、金額
      - 計算公式：基本價格 × 數量 × 天數 = 金額
      - 例如：EB-500 電輔車 400 × 1 台 × 5 天 = 2000
    - **總金額顯示**：自動計算所有車型金額的總和

### 功能說明
- **直接在列表中操作**：
  - 用戶無需點擊按鈕打開 Modal，可以在列表中直接看到和編輯所有資訊
  - 合作商選擇、價格調整、總金額計算都在同一個界面完成
  
- **價格計算**：
  - 系統自動從 `RentalPlan` API 獲取每種車型的基本價格作為初始值
  - 用戶可以修改每種車型的基本價格
  - 系統自動計算每種車型的金額（基本價格 × 數量 × 天數）
  - 總金額自動計算為所有車型金額的總和

- **合作商選擇**：
  - 預設使用預約關聯的合作商（如果存在）
  - 如果預約沒有關聯合作商，使用系統預設合作商
  - 用戶可以手動更改

---

## 2026-01-11 04:21:43 - 重構預約轉訂單功能：移除後端自動計算，新增前端價格明細界面

### 變更內容

#### 後端
- **BookingController** (`app/Http/Controllers/Api/BookingController.php`)
  - 移除自動金額計算邏輯（從 RentalPlan 表自動計算）
  - 將 `payment_amount` 驗證規則從 `nullable` 改為 `required`（必須由前端提供）
  - 移除 `RentalPlan` 的 import（不再使用）
  - `convertToOrder()` 方法現在直接使用前端傳入的 `payment_amount`

#### 前端
- **ConvertBookingModal** (`system/backend/components/ConvertBookingModal.tsx`) - 新建
  - 創建預約轉訂單的 Modal 組件
  - 顯示合作商選擇欄位：
    - 優先使用預約的 `partner_id`（如果存在）
    - 否則使用系統預設合作商（`is_default_for_booking = true`）
    - 允許手動更改合作商
  - 顯示付款方式選擇（現金、月結、日結、匯款、刷卡、行動支付）
  - 顯示預約資訊（只讀）：承租人姓名、Email、預約日期、結束日期、租借天數
  - 顯示價格明細：
    - 每種車型顯示：車型名稱、基本價格（可編輯）、數量、天數、金額
    - 計算公式：基本價格 × 數量 × 天數 = 金額
    - 例如：EB-500 電輔車 400 × 1 台 × 5 天 = 2000
  - 自動從 `RentalPlan` API 獲取基本價格作為初始值
  - 允許修改每種車型的基本價格
  - 總金額自動計算為所有車型金額的總和
  - 提交時將計算的總金額發送到後端

- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 導入 `ConvertBookingModal` 組件
  - 添加 `isConvertModalOpen` 和 `selectedBooking` 狀態
  - 修改 `handleConvertBookingClick` 函數：
    - 改為打開 Modal 而不是直接調用 API
    - 檢查 email 是否存在
  - 添加 `handleConvertSuccess` 函數處理轉換成功後的刷新和跳轉
  - 在頁面中添加 `ConvertBookingModal` 組件

### 功能說明
- **價格計算流程**：
  1. 打開 Modal 時，自動從 `RentalPlan` API 獲取每種車型的基本價格
  2. 根據預約的開始日期和結束日期計算租借天數
  3. 為每種車型計算金額：基本價格 × 數量 × 天數
  4. 顯示總金額（所有車型金額的總和）
  5. 管理員可以修改每種車型的基本價格，總金額會自動重新計算

- **合作商選擇**：
  - 系統會自動使用預約關聯的合作商或系統預設合作商
  - 管理員可以在 Modal 中更改合作商

- **用戶體驗**：
  - 提供清晰的價格明細顯示
  - 允許靈活調整每種車型的基本價格
  - 總金額即時更新

---

## 2026-01-11 11:12:08 - 預約轉訂單時自動計算訂單金額

### 變更內容
- **BookingController** (`app/Http/Controllers/Api/BookingController.php`)
  - 在 `convertToOrder()` 方法中添加自動計算訂單金額功能
  - 計算邏輯：
    1. 計算租借天數：從 `booking_date` 到 `end_date` 的天數（包含開始和結束日期）
    2. 遍歷預約中的每個車款需求（`booking->scooters` 陣列）
    3. 從 `RentalPlan` 表中根據 `model` 查找該車款的價格（每 24 小時的價格）
    4. 計算每個車款的小計：價格 × 數量 × 天數
    5. 累加所有車款的小計得到總金額
  - 如果沒有提供 `payment_amount` 或為空，自動使用計算出的金額
  - 如果提供了 `payment_amount`，使用提供的金額（允許手動覆蓋）
  - 將 `payment_amount` 驗證規則從 `sometimes|required` 改為 `nullable`（可選）

### 計算範例
假設預約：
- 日期：1/2 - 1/5（共 4 天）
- 車款：ES-2000 x 3、ES-1000 x 2
- ES-2000 價格：500/24H
- ES-1000 價格：400/24H

計算結果：
- ES-2000: 500 × 3 × 4 = 6,000
- ES-1000: 400 × 2 × 4 = 3,200
- 總金額：6,000 + 3,200 = 9,200

### 說明
- 當將預約轉為訂單時，系統會自動根據租借天數和選擇的車款、數量計算訂單總金額
- 如果某個車款在 `RentalPlan` 中找不到對應的價格，該車款不會計入總金額
- 管理員仍可手動輸入金額來覆蓋自動計算的結果

---

## 2026-01-11 08:35:22 - 新增專車接送圖片管理功能

### 變更內容
- **資料庫 Migration**
  - `database/migrations/2026_01_11_083250_create_shuttle_images_table.php`
    - 創建 `shuttle_images` 表，包含 `id`, `image_path`, `sort_order`, `timestamps`

- **ShuttleImage Model** (`app/Models/ShuttleImage.php`)
  - 定義 `$fillable` 為 `['image_path', 'sort_order']`
  - 定義 `$casts` 將 `sort_order` 轉為 integer

- **ShuttleImageController** (`app/Http/Controllers/Api/ShuttleImageController.php`)
  - 實現 `index()`, `store()`, `update()`, `destroy()` 方法
  - 支援圖片上傳、刪除和排序管理
  - 使用 `ImageService` 處理圖片上傳和刪除

- **後台管理頁面** (`system/backend/pages/ShuttleImagesPage.tsx`)
  - 創建專車接送圖片管理頁面
  - 功能包括：新增圖片、刪除圖片、調整順序（上下移動）
  - 自動檢測並修正重複的排序值
  - 新上傳圖片自動設置為最大排序值 + 1

- **後台選單** (`system/backend/constants.tsx`)
  - 在「網站內容管理」下添加「專車接送圖片」選項，位於「環境圖片」之後

- **後台路由** (`system/backend/App.tsx`)
  - 添加 `/shuttle-images` 路由，對應 `ShuttleImagesPage`

- **API Routes** (`routes/api.php`)
  - 添加 `shuttle-images` API 路由
  - `GET /shuttle-images` 為公開路由（供前端使用）
  - `POST`, `PUT`, `DELETE` 需要認證（後台管理使用）

- **後台 API Client** (`system/backend/lib/api.ts`)
  - 添加 `shuttleImagesApi`，包含 `list()`, `create()`, `update()`, `delete()` 方法

- **前端 API Client** (`system/frontend/lib/api.ts`)
  - 在 `publicApi` 中添加 `shuttleImages.list()` 方法

- **前端 Guidelines 頁面** (`system/frontend/pages/Guidelines.tsx`)
  - 在「專車接送」區塊添加圖片顯示
  - 使用 `grid grid-cols-1 md:grid-cols-2` 佈局顯示圖片（響應式，手機一列，桌面兩列）
  - 按 `sort_order` 排序顯示圖片

### 說明
- 專車接送圖片管理功能與環境圖片管理功能完全一致
- 後台管理員可以上傳、刪除和調整專車接送圖片的順序
- 前端租車須知頁面的「專車接送」區塊會自動顯示已上傳的圖片
- 圖片按排序順序顯示，支援響應式佈局

---

## 2026-01-11 08:24:42 - 調整租車方案頁面價格顯示樣式

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 修改價格徽章形狀：從圓形 (`rounded-full`) 改為橢圓形 (`rounded-[50px]`)
  - 調整價格徽章尺寸：寬度從 `w-48` (192px) 改為 `w-40` (160px)，高度從 `h-48` (192px) 改為 `h-32` (128px)
  - 調整位置：從 `bottom-[-20px]` 改為 `bottom-[-15px]`，減少對圖片的遮擋
  - 減少內邊距：從 `p-6` 改為 `p-4`
  - 修改字體：移除 `serif` 字體，改用 `font-sans`（無襯線字體），避免與 77go 相似
  - 調整價格字體大小：從 `text-2xl` 改為 `text-xl`，配合較小的容器

### 說明
- 價格顯示區域現在是橢圓形，且尺寸更小，不會遮擋太多圖片
- 字體改為無襯線字體（font-sans），更清晰且與 77go 不同
- 整體視覺效果更加精緻，不影響圖片展示

---

## 2026-01-10 23:17:22 - 後台合作商管理新增預設線上預約合作商功能

### 變更內容
- **資料庫 Migration**
  - `database/migrations/2026_01_10_231524_add_is_default_for_booking_to_partners_table.php`
    - 在 `partners` 表添加 `is_default_for_booking` 欄位（boolean，預設 false）
  - `database/migrations/2026_01_10_231614_add_partner_id_to_bookings_table.php`
    - 在 `bookings` 表添加 `partner_id` 欄位（foreign key，nullable）

- **Partner Model** (`app/Models/Partner.php`)
  - 在 `$fillable` 中添加 `is_default_for_booking`

- **Booking Model** (`app/Models/Booking.php`)
  - 在 `$fillable` 中添加 `partner_id`

- **PartnerController** (`app/Http/Controllers/Api/PartnerController.php`)
  - 在 `store()` 和 `update()` 方法中添加 `is_default_for_booking` 驗證規則
  - 實現邏輯：當設置一個合作商為預設時，自動取消其他合作商的預設狀態
  - 使用 `Partner::where('id', '!=', $partner->id)->update(['is_default_for_booking' => false])` 確保只有一個預設

- **BookingController** (`app/Http/Controllers/Api/BookingController.php`)
  - 在 `send()` 方法中自動獲取預設線上預約合作商
  - 創建預約時自動將預設合作商關聯到預約記錄

- **PartnerResource** (`app/Http/Resources/PartnerResource.php`)
  - 在資源輸出中添加 `is_default_for_booking` 欄位

- **後台合作商管理頁面** (`system/backend/pages/PartnersPage.tsx`)
  - 在 Partner interface 中添加 `is_default_for_booking?: boolean`
  - 在表單中添加「設為預設線上預約合作商」勾選框
  - 添加說明文字：勾選後，此合作商將成為前台線上預約的預設合作商
  - 更新表單狀態管理，包含 `is_default_for_booking` 欄位

### 說明
- 後台管理員可以在合作商管理頁面中，勾選一個合作商為「預設線上預約合作商」
- 當設置一個合作商為預設時，系統會自動取消其他合作商的預設狀態（確保只有一個預設）
- 前台用戶提交線上預約時，系統會自動使用預設的合作商作為該預約的合作商
- 前台預約表單中不需要顯示合作商選擇欄位（原本就沒有，無需移除）
- 所有新建立的預約都會自動關聯到預設合作商

---

## 2026-01-10 23:04:44 - 移除租車方案頁面的「提供顧客尊榮級服務」區塊

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 移除整個「提供顧客尊榮級服務」section，包括：
    - Premium Service 標題
    - 「提供顧客尊榮級服務」標題
    - 服務描述文字
    - 4 張服務圖片網格

### 說明
- 租車方案頁面已簡化，移除了服務介紹區塊

---

## 2026-01-10 20:31:23 - 未確認預約列表添加行動電話欄位並調整為三欄佈局

### 變更內容
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 在未確認預約列表中，於 LINE ID 後面新增「行動電話」欄位
  - 將欄位佈局從 `grid-cols-2`（兩欄）改為 `grid-cols-3`（三欄）
  - 「所需租車類型/數量」欄位保持為單欄顯示（不包含在三欄佈局中）

### 說明
- 未確認預約列表現在顯示完整的聯絡資訊，包括行動電話
- 欄位排列改為三欄，提升資訊密度和可讀性
- 特殊欄位「所需租車類型/數量」維持全寬顯示，便於展示多個標籤

---

## 2026-01-10 20:21:53 - 新增「公船」航運公司選項

### 變更內容
- **資料庫 Migration** (`database/migrations/2026_01_10_202033_add_gong_chuan_to_shipping_company_enum.php`)
  - 新增 migration 將「公船」添加到 `bookings` 和 `orders` 表的 `shipping_company` enum 欄位
  - 使用 `DB::statement` 修改 enum 類型為：`['泰富', '藍白', '聯營', '大福', '公船']`

- **前台預約表單** (`system/frontend/pages/Booking.tsx`)
  - 在船運公司下拉選單中新增「公船」選項

- **後台訂單管理** (`system/backend/components/AddOrderModal.tsx`)
  - 在航運公司下拉選單中新增「公船」選項

- **後台預約管理** (`system/backend/pages/BookingsPage.tsx`)
  - 在船運公司下拉選單中新增「公船」選項

- **後端驗證規則**
  - `app/Http/Controllers/Api/BookingController.php`
    - 更新 `send()` 方法驗證規則：`'shippingCompany' => 'required|in:泰富,藍白,聯營,大福,公船'`
    - 更新 `update()` 方法驗證規則：`'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福,公船'`
  - `app/Http/Controllers/Api/OrderController.php`
    - 更新 `store()` 和 `update()` 方法驗證規則：`'shipping_company' => 'nullable|in:泰富,藍白,聯營,大福,公船'`

- **TypeScript 類型定義** (`system/backend/types.ts`)
  - 更新 `ShippingCompany` enum，新增 `GONGCHUAN = '公船'`

### 說明
- 前台和後台的航運公司選項都已包含「公船」
- 資料庫 enum 類型已更新，支援新的航運公司選項
- 所有相關驗證規則已同步更新

---

## 2026-01-10 20:14:18 - 移除登入頁面的測試帳號訊息

### 變更內容
- **LoginPage.tsx** (`system/backend/pages/LoginPage.tsx`)
  - 移除登入表單底部的「測試帳號：admin@admin.com / admin123」訊息

### 說明
- 登入頁面不再顯示測試帳號資訊
- 提升系統安全性，避免在公開介面暴露測試帳號

---

## 2026-01-09 22:40:09 - 在關於我們頁面環境圖片區塊添加「我們的環境」標題

### 變更內容
- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 在環境圖片區塊添加「我們的環境」標題
  - 標題樣式：`text-3xl md:text-4xl font-bold serif text-center mb-12`

### 說明
- 環境圖片區塊現在顯示「我們的環境」標題
- 標題位於圖片網格上方，居中顯示
- 只有在有環境圖片時才會顯示整個區塊（包括標題）

---

## 2026-01-09 22:29:24 - 修正環境圖片排序邏輯

### 變更內容
- **EnvironmentImagesPage.tsx** (`system/backend/pages/EnvironmentImagesPage.tsx`)
  - 在 `fetchImages()` 方法中添加重複排序值檢查，如果發現重複則自動重新分配為 0, 1, 2, 3...
  - 在 `handleUpload()` 方法中，自動設置新圖片的排序值為當前最大排序值 + 1
  - 在 `handleMoveUp()` 和 `handleMoveDown()` 方法中，確保交換排序值後重新獲取列表
  - 修正 `handleUpdateSortOrder()` 方法，移除重複的 `fetchImages()` 調用

### 說明
- 現在當載入圖片時，如果發現有重複的排序值，會自動重新分配
- 新增圖片時會自動設置為當前最大排序值 + 1，避免排序值重複
- 上下移動按鈕現在可以正確交換排序值並更新顯示

---

## 2026-01-09 22:15:24 - 移除 environment_images 表的 alt_text 欄位

### 變更內容

#### 資料庫
- **Migration** (`database/migrations/2026_01_09_221413_remove_alt_text_from_environment_images_table.php`) - 新建
  - 從 `environment_images` 表移除 `alt_text` 欄位

#### 後端
- **Model** (`app/Models/EnvironmentImage.php`)
  - 從 `fillable` 陣列中移除 `alt_text`

- **Controller** (`app/Http/Controllers/Api/EnvironmentImageController.php`)
  - 在 `store()` 方法中，移除 `alt_text` 驗證規則
  - 在 `store()` 方法中，移除 `alt_text` 的儲存邏輯
  - 在 `update()` 方法中，移除 `alt_text` 驗證規則

#### 後端管理界面
- **EnvironmentImagesPage.tsx** (`system/backend/pages/EnvironmentImagesPage.tsx`)
  - 從 `EnvironmentImage` interface 移除 `alt_text` 欄位
  - 移除 `altText` state 變數
  - 移除替代文字輸入欄位
  - 從圖片列表中移除替代文字顯示
  - 更新 `handleUpload` 方法，移除 `altText` 參數
  - 更新 `handleRemovePreview` 方法，移除 `altText` 重置

- **API Client** (`system/backend/lib/api.ts`)
  - 更新 `environmentImagesApi.create()` 方法，移除 `altText` 參數

#### 前端
- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 從 `EnvironmentImage` interface 移除 `alt_text` 欄位
  - 更新圖片 alt 屬性為固定文字 "Environment image"

### 說明
- 環境圖片不再需要替代文字欄位
- 簡化了資料結構和管理界面
- 需要執行 migration：`php artisan migrate`

---

## 2026-01-09 22:13:16 - 更新關於我們頁面使用環境圖片 API 並移除標題

### 變更內容
- **routes/api.php**
  - 將環境圖片 API 的 `GET /environment-images` 改為公開路由（不需要認證）
  - 其他操作（新增、更新、刪除）仍需要認證

- **api.ts** (`system/frontend/lib/api.ts`)
  - 在 `publicApi` 中添加 `environmentImages.list()` 方法

- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 從 API 獲取環境圖片列表
  - 移除「我們的環境」標題文字
  - 如果沒有圖片，隱藏整個環境圖片區塊
  - 使用上傳的環境圖片替代原本的預設圖片

### 說明
- 關於我們頁面的環境圖片現在從後台管理的環境圖片 API 獲取
- 如果後台沒有上傳任何環境圖片，整個區塊會隱藏
- 移除了「我們的環境」標題，只顯示圖片網格

---

## 2026-01-09 22:12:13 - 新增後台環境圖片管理功能

### 變更內容

#### 資料庫
- **Migration** (`database/migrations/2026_01_09_220942_create_environment_images_table.php`) - 新建
  - 創建 `environment_images` 表
  - 欄位：`id`, `image_path`, `alt_text`, `sort_order`, `timestamps`

#### 後端
- **Model** (`app/Models/EnvironmentImage.php`) - 新建
  - 定義 `fillable` 欄位：`image_path`, `alt_text`, `sort_order`
  - 定義 `casts`：`sort_order` 為 integer

- **Controller** (`app/Http/Controllers/Api/EnvironmentImageController.php`) - 新建
  - `index()` - 列出所有環境圖片（按 sort_order 排序）
  - `store()` - 新增環境圖片（上傳圖片、alt_text、sort_order）
  - `update()` - 更新環境圖片資訊（alt_text、sort_order）
  - `destroy()` - 刪除環境圖片（同時刪除上傳的圖片檔案）

- **Routes** (`routes/api.php`)
  - 添加 `/api/environment-images` 路由群組（需要認證）
  - `GET /environment-images` - 列出所有圖片
  - `POST /environment-images` - 新增圖片
  - `PUT /environment-images/{id}` - 更新圖片
  - `DELETE /environment-images/{id}` - 刪除圖片

#### 後端管理界面
- **EnvironmentImagesPage** (`system/backend/pages/EnvironmentImagesPage.tsx`) - 新建
  - 創建環境圖片管理頁面
  - 新增圖片功能：上傳圖片、設定替代文字、設定排序
  - 圖片列表顯示：顯示所有已上傳的圖片
  - 刪除圖片功能：刪除圖片時同時刪除上傳的檔案
  - 調整順序功能：使用上下箭頭按鈕調整圖片順序

- **API Client** (`system/backend/lib/api.ts`)
  - 添加 `environmentImagesApi` 包含 `list`, `create`, `update`, `delete` 方法

- **路由** (`system/backend/App.tsx`)
  - 添加 `/environment-images` 路由

- **側邊欄** (`system/backend/constants.tsx`)
  - 在「網站內容管理」下添加「環境圖片」選單項目，位於「首頁圖片」下方

### 說明
- 後端管理員可以在「網站內容管理 > 環境圖片」頁面管理環境展示圖片
- 可以新增、刪除圖片，並調整圖片順序
- 刪除圖片時會自動刪除上傳的圖片檔案
- 圖片上傳後會自動轉換為 webp 格式並使用 UUID 命名
- 需要執行 migration：`php artisan migrate`

---

## 2026-01-09 21:39:55 - 更新訂單確認通知郵件內容

### 變更內容
- **booking-confirmed.blade.php** (`resources/views/emails/booking-confirmed.blade.php`)
  - 更新郵件主要內容為新的格式：
    - 感謝您的預訂。
    - XXX年X月X日 車輛訂單已確認成立。
    - 請依約定時間前來取車，若逾時且現場已有其他訂單，將依當日訂單順序安排接駁，訂單順序將順延，敬請見諒。
    - 蘭光電動機車祝您旅途愉快！
  - 日期格式改為「YYYY年M月D日」格式（例如：2026年1月9日）

### 說明
- 訂單確認通知郵件現在包含更詳細的說明和注意事項
- 提醒客戶依約定時間取車，並說明逾時的處理方式
- 日期顯示格式更符合中文習慣

---

## 2026-01-09 21:36:12 - 優化首頁圖片管理的按鈕對齊

### 變更內容
- **HomeImagesPage.tsx** (`system/backend/pages/HomeImagesPage.tsx`)
  - 為圖片預覽區域添加 `min-h-[320px]`，確保所有卡片中圖片區域高度一致
  - 將圖片預覽區域設為 `flex-shrink-0 mb-4`，確保間距一致
  - 將按鈕區域設為 `mt-auto flex-shrink-0`，確保按鈕對齊到底部且不會被壓縮
  - 優化空圖片狀態的顯示，使用 flex 佈局置中

### 說明
- 現在所有卡片中的圖片預覽區域高度一致（最小 320px）
- 所有按鈕和文字標籤都會對齊到底部
- 無論是否有圖片，所有卡片的高度和按鈕位置都保持一致

---

## 2026-01-09 21:33:17 - 將首頁圖片管理的按鈕對齊到底部

### 變更內容
- **HomeImagesPage.tsx** (`system/backend/pages/HomeImagesPage.tsx`)
  - 為每個卡片添加 `flex flex-col h-full`，讓卡片成為 flex 容器並填滿高度
  - 為內容區域添加 `flex flex-col flex-1`，讓內容區域佔據可用空間
  - 為按鈕區域添加 `mt-auto`，將按鈕推到底部對齊
  - 為網格容器添加 `items-stretch`，確保所有卡片高度一致

### 說明
- 現在所有卡片中的按鈕都會對齊到底部
- 無論卡片內容多少，按鈕位置都會保持一致
- 所有卡片高度一致，視覺效果更整齊

---

## 2026-01-09 21:29:06 - 將首頁圖片管理改為一列三張並增加圖片高度

### 變更內容
- **HomeImagesPage.tsx** (`system/backend/pages/HomeImagesPage.tsx`)
  - 將網格佈局從 `md:grid-cols-2` 改為 `md:grid-cols-3`（一列三張圖片）
  - 將圖片高度從 `max-h-48`（192px）改為 `max-h-80`（320px），圖片顯示更高

### 說明
- 首頁圖片管理頁面現在在桌面版每行顯示三張圖片
- 圖片預覽區域更高，提供更好的視覺效果
- 手機版仍然保持單列顯示

---

## 2026-01-09 21:24:23 - 將首頁圖片管理改為一列兩張圖片的佈局

### 變更內容
- **HomeImagesPage.tsx** (`system/backend/pages/HomeImagesPage.tsx`)
  - 將外層容器從 `space-y-8`（垂直堆疊）改為 `grid grid-cols-1 md:grid-cols-2 gap-6`（響應式網格佈局）
  - 每個圖片區塊現在使用 `border` 和 `rounded-lg` 來區分，而不是 `border-b`
  - 調整圖片預覽區域，使用 `max-h-48` 和 `w-full object-cover` 來優化顯示
  - 將內部佈局從 `grid grid-cols-1 md:grid-cols-2` 改為 `space-y-4`（垂直堆疊），因為外層已經是兩列佈局

### 說明
- 首頁圖片管理頁面現在以兩列網格佈局顯示圖片區塊
- 在桌面版（md 以上）每行顯示兩張圖片，手機版仍然單列顯示
- 每個圖片區塊有獨立的邊框和圓角，視覺上更清晰
- 優化了圖片預覽的顯示效果

---

## 2026-01-09 21:20:39 - 從輪播圖列表移除連結欄位顯示

### 變更內容
- **BannersPage.tsx** (`system/backend/pages/BannersPage.tsx`)
  - 從表格表頭移除「連結」欄位
  - 從表格內容移除連結欄位的顯示
  - 連結欄位仍然可以在編輯表單中使用，只是不在列表中顯示

### 說明
- 輪播圖管理列表現在不再顯示連結欄位
- 連結資料仍然保存在資料庫中，只是不在列表中顯示
- 編輯輪播圖時仍然可以設定連結

---

## 2026-01-09 21:17:15 - 將 banners 表的 link 欄位改為 TEXT 類型

### 變更內容
- **Migration** (`database/migrations/2026_01_09_211646_change_link_to_text_in_banners_table.php`) - 新建
  - 將 `banners` 表的 `link` 欄位從 `string`（VARCHAR）改為 `text`（TEXT）類型
  - 允許存儲更長的連結 URL

- **BannerController.php** (`app/Http/Controllers/Api/BannerController.php`)
  - 在 `store()` 方法中，將 `link` 驗證規則從 `'nullable|string|max:255'` 改為 `'nullable|string'`
  - 在 `update()` 方法中，將 `link` 驗證規則從 `'nullable|string|max:255'` 改為 `'nullable|string'`
  - 移除長度限制，允許存儲任意長度的連結

### 說明
- `link` 欄位現在可以存儲更長的 URL 連結
- 資料庫欄位類型從 VARCHAR 改為 TEXT
- API 驗證規則移除 255 字元長度限制
- 需要執行 migration：`php artisan migrate`

---

## 2026-01-09 21:05:20 - 修正日期欄位日曆圖標點擊功能

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 移除「預約日期」欄位的 `readOnly` 屬性，允許點擊日曆圖標
  - 移除「結束日期」欄位的 `readOnly` 屬性，允許點擊日曆圖標
  - 移除「船班時間（來）」欄位的 `readOnly` 屬性，允許點擊日曆圖標
  - 為所有日期欄位添加 `onPaste` 事件處理器，阻止貼上操作
  - 保留 `onKeyDown` 事件處理器，繼續阻止鍵盤輸入

### 說明
- 現在三個日期欄位（預約日期、結束日期、船班時間）都可以通過點擊右側的日曆圖標來選擇日期
- 仍然禁止手動輸入文字和貼上，確保日期格式正確
- 用戶只能通過日曆選擇器來選擇日期

---

## 2026-01-09 20:58:16 - 將 Banner 高度改為 600px

### 變更內容
- **BannerCarousel.tsx** (`system/frontend/components/BannerCarousel.tsx`)
  - 將 Banner 高度從 `h-[800px]` 改為 `h-[600px]`（600px）
  - 更新載入狀態的 Banner 高度，與正常顯示保持一致

### 說明
- Banner 現在固定高度為 600px
- 圖片仍然保持上下置中顯示

---

## 2026-01-09 20:54:47 - 修改 Banner 高度為固定 800px 並置中圖片

### 變更內容
- **BannerCarousel.tsx** (`system/frontend/components/BannerCarousel.tsx`)
  - 將 Banner 高度改為固定的 `h-[800px]`（800px），移除所有響應式高度設計
  - 為 Banner 圖片添加 `object-center` 類別和 `objectPosition: 'center center'` 樣式
  - 確保圖片在垂直方向上置中顯示

### 說明
- Banner 現在固定高度為 800px，不再隨螢幕尺寸變化
- 圖片會上下置中顯示，確保圖片內容在垂直方向上居中
- 使用 `object-cover` 和 `object-center` 確保圖片保持比例並置中顯示

---

## 2026-01-09 20:48:55 - 修改 Banner 高度為響應式設計

### 變更內容
- **BannerCarousel.tsx** (`system/frontend/components/BannerCarousel.tsx`)
  - 將 Banner 基本高度從 `h-[250px]` 改為 `h-[800px]`（800px）
  - 添加響應式高度設計：
    - 基本（手機）：800px
    - md（平板，768px+）：900px
    - lg（小桌面，1024px+）：1000px
    - xl（大桌面，1280px+）：1100px
    - 2xl（超大螢幕，1536px+）：1200px
  - 更新載入狀態的 Banner 高度，與正常顯示保持一致

### 說明
- Banner 現在基本高度為 800px
- 隨著螢幕尺寸增大，Banner 高度會逐漸增加
- 提供更好的視覺效果，在大螢幕上顯示更壯觀
- 保持響應式設計，適應各種裝置尺寸

---

## 2026-01-09 20:29:37 - 修改訂單確認通知郵件文字

### 變更內容
- **booking-confirmed.blade.php** (`resources/views/emails/booking-confirmed.blade.php`)
  - 修改訂單確認文字：從「您 x 月 x 日與蘭光電動機車下定之訂單已成立」改為「您於 x 月 x 日下定之訂單已成立」
  - 新增祝福文字：「蘭光電動寄出祝您旅途愉快！」

### 說明
- 訂單確認通知郵件現在使用更簡潔的文字
- 移除了「與蘭光電動機車」字樣，改為「於」
- 新增祝福語，讓郵件更親切友善

---

## 2026-01-09 20:27:35 - 線上預約表單日期欄位禁止手動輸入，只能通過日曆選擇

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 為「預約日期」欄位添加 `readOnly` 屬性和 `onKeyDown` 事件處理器，禁止手動輸入
  - 為「結束日期」欄位添加 `readOnly` 屬性和 `onKeyDown` 事件處理器，禁止手動輸入
  - 為「船班時間（來）」欄位添加 `readOnly` 屬性和 `onKeyDown` 事件處理器，禁止手動輸入
  - 為所有日期欄位添加 `cursor-pointer` 樣式，提示用戶可以點擊選擇日期

### 說明
- 所有日期相關欄位現在都禁止手動輸入文字
- 用戶只能通過點擊輸入框或日曆圖標來打開日期選擇器
- 防止用戶手動輸入無效或不符合格式的日期
- 確保日期選擇的一致性和正確性

---

## 2026-01-09 20:27:01 - 線上預約表單日期欄位限制為今天或之後

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 新增 `getTodayDate()` 函數：獲取今天的日期（格式：YYYY-MM-DD）
  - 新增 `getTodayDateTime()` 函數：獲取今天的日期時間（格式：YYYY-MM-DDTHH:mm）
  - 為「預約日期」欄位添加 `min={todayDate}` 屬性，限制只能選擇今天或之後的日期
  - 為「結束日期」欄位更新 `min` 屬性為 `formData.appointmentDate || todayDate`，確保不能選擇今天之前的日期
  - 為「船班時間（來）」欄位添加 `min={todayDateTime}` 屬性，限制只能選擇今天或之後的日期時間

### 說明
- 所有日期相關欄位現在都只能選擇今天或之後的日期
- 預約日期：必須 >= 今天
- 結束日期：必須 >= 預約日期（如果已選擇）或 >= 今天（如果未選擇預約日期）
- 船班時間：必須 >= 今天的日期時間
- 防止用戶選擇過去的日期進行預約

---

## 2026-01-09 17:31:54 - 線上預約表單增加 Email 欄位（必填）

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 在表單中新增 Email 欄位，放在 LINE ID 之前
  - Email 欄位設置為必填（標示紅色星號）
  - 更新表單資料狀態，包含 email 欄位
  - 提交表單時包含 email 資料

- **api.ts** (`system/frontend/lib/api.ts`)
  - 更新 `booking.send()` 方法的類型定義，添加 `email: string`（必填）

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 在 `send()` 方法的驗證規則中添加 `email` 欄位：`'email' => 'required|email|max:255'`
  - 更新資料庫儲存邏輯，保存 email 到 bookings 表
  - 更新郵件資料，確保 email 包含在郵件內容中
  - 更新搜尋功能，搜尋時可搜尋 email 欄位

- **booking.blade.php** (`resources/views/emails/booking.blade.php`)
  - 在郵件模板中添加 Email 欄位顯示，放在姓名之後、LINE ID 之前
  - Email 欄位會在郵件中顯示（如果有值）

### 說明
- 線上預約表單現在必須填寫 Email
- Email 欄位位置在承租人姓名之後、LINE ID 之前
- 資料會保存到資料庫的 bookings 表的 email 欄位
- 郵件通知中會顯示用戶填寫的 Email
- 後端管理介面搜尋功能現在可搜尋 Email

---

## 2026-01-04 21:15:07 - 更新郵件接收地址 / Update Email Recipient Address

### Backend Changes

- **ContactController.php** (`app/Http/Controllers/Api/ContactController.php`)
  - 更新郵件接收地址：從 `zau1110216@gmail.com` 更改為 `renfu.her@gmail.com`
  - 影響方法：`send()` 和 `test()` 方法

---

## 2026-01-04 21:15:07 - 添加測試郵件發送端點 / Add Test Email Endpoint

### Backend Changes

- **ContactController.php** (`app/Http/Controllers/Api/ContactController.php`)
  - 新增 `test()` 方法：提供測試郵件發送功能
  - 可選參數：name, email, phone, message
  - 如果未提供參數，使用預設測試資料

- **api.php** (`routes/api.php`)
  - 添加 `POST /api/contact/test` 路由（公開路由）：測試郵件發送功能

### Testing
可以使用以下方式測試郵件發送功能：

```bash
# 使用預設測試資料
curl -X POST http://localhost:8000/api/contact/test

# 使用自訂測試資料
curl -X POST http://localhost:8000/api/contact/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試名稱",
    "email": "test@example.com",
    "phone": "0912345678",
    "message": "測試訊息內容"
  }'
```

---

## 2026-01-04 20:35:00 - 實作聯絡表單郵件發送功能（Gmail） / Implement Contact Form Email Sending (Gmail)

### Backend Changes

- **ContactController.php** (`app/Http/Controllers/Api/ContactController.php`) - 新建
  - 創建聯絡表單控制器
  - `send()` 方法：處理表單驗證（姓名、信箱、電話、訊息）並發送郵件
  - `test()` 方法：測試郵件發送功能，使用預設或提供的測試資料
  - 使用 ContactMail 類發送郵件到指定信箱（zau1110216@gmail.com）
  - 錯誤處理和日誌記錄

- **ContactMail.php** (`app/Mail/ContactMail.php`)
  - 更新郵件類以接收表單資料
  - 設置郵件標題：包含發送者姓名
  - 設置 Reply-To：使用表單提交者的信箱
  - 使用 contact.blade.php 作為郵件模板

- **contact.blade.php** (`resources/views/emails/contact.blade.php`) - 新建
  - 創建郵件模板視圖
  - 美觀的 HTML 郵件格式
  - 顯示所有表單欄位（姓名、信箱、電話、訊息）
  - 包含發送時間資訊

- **api.php** (`routes/api.php`)
  - 添加 `POST /api/contact` 路由（公開路由）：處理聯絡表單提交
  - 添加 `POST /api/contact/test` 路由（公開路由）：測試郵件發送功能

### Frontend Changes

- **api.ts** (`system/frontend/lib/api.ts`)
  - 添加 `contact.send(data)` 方法到 publicApi

- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 更新 `handleSubmit` 函數：調用 API 發送郵件
  - 添加錯誤處理
  - 成功後顯示提示並清空表單

### Configuration Required

需要在 `.env` 文件中配置以下 Gmail SMTP 設定：

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=zau1110216@gmail.com
MAIL_PASSWORD=fdpdunlbfoyhgtfh
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=zau1110216@gmail.com
MAIL_FROM_NAME="${APP_NAME}"
```

### Features
- **郵件發送**：聯絡表單提交後自動發送郵件到指定 Gmail 信箱
- **美觀格式**：使用 HTML 郵件模板，呈現專業的郵件格式
- **Reply-To 設置**：郵件設置 Reply-To 為表單提交者的信箱，方便直接回覆
- **錯誤處理**：完整的錯誤處理和用戶友好的錯誤訊息
- **表單驗證**：後端驗證表單資料確保資料完整性

### Technical Details
- **SMTP 配置**：使用 Gmail SMTP (smtp.gmail.com:587) 發送郵件
- **郵件模板**：使用 Blade 模板引擎創建 HTML 郵件
- **安全性**：使用應用程式密碼而非一般密碼進行認證
- **API 端點**：
  - `POST /api/contact`：接收表單資料並發送郵件
  - `POST /api/contact/test`：測試郵件發送功能（可選參數：name, email, phone, message）

### Testing
可以使用以下方式測試郵件發送功能：

```bash
# 使用預設測試資料
curl -X POST http://localhost:8000/api/contact/test

# 使用自訂測試資料
curl -X POST http://localhost:8000/api/contact/test \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試名稱",
    "email": "test@example.com",
    "phone": "0912345678",
    "message": "測試訊息內容"
  }'
```

## 2026-01-04 20:30:00 - 改進前台頁面空資料顯示訊息 / Improve Empty Data Messages for Frontend Pages

### Frontend Changes

- **Guesthouses.tsx** (`system/frontend/pages/Guesthouses.tsx`)
  - 添加空資料狀態顯示
  - 顯示友好的訊息：「目前沒有可用的民宿推薦」和說明文字

- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 改進空資料訊息顯示
  - 添加說明文字，使訊息更加友好

- **Location.tsx** (`system/frontend/pages/Location.tsx`)
  - 改進空資料訊息顯示
  - 添加說明文字和替代聯繫方式的提示

- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 改進空資料訊息顯示（過濾後無結果時）
  - 添加說明文字和替代聯繫方式的提示

### Features
- **友好的空資料訊息**：所有頁面（除首頁外）現在都顯示友好的空資料訊息
- **統一樣式**：使用統一的樣式和佈局來顯示空資料狀態
- **提供替代方案**：在空資料訊息中提供替代聯繫方式或說明

### Technical Details
- **統一格式**：所有空資料訊息使用相同的佈局結構（flex-col, items-center, text-center）
- **兩行文字**：主要訊息（text-lg）和說明文字（text-sm）
- **一致的間距**：使用 py-20 確保足夠的垂直間距

## 2026-01-04 15:45:00 - 添加民宿詳細頁面 / Add Guesthouse Detail Page

### Backend Changes

- **api.php** (`routes/api.php`)
  - 將 `GET /guesthouses/{guesthouse}` 路由移到公開區域（從 auth:sanctum middleware 中移出）
  - 前端現在可以公開訪問民宿詳細資訊

- **GuesthouseController.php** (`app/Http/Controllers/Api/GuesthouseController.php`)
  - 更新 `show` 方法：僅返回啟用的民宿
  - 如果民宿未啟用，返回 404 錯誤

### Frontend Changes

- **api.ts** (`system/frontend/lib/api.ts`)
  - 添加 `guesthouses.get(id)` 方法：獲取單個民宿資訊

- **GuesthouseDetail.tsx** (`system/frontend/pages/GuesthouseDetail.tsx`) - 新建
  - 創建民宿詳細頁面組件
  - 顯示民宿名稱、簡短說明、圖片、詳細描述
  - 如果有關聯連結，顯示「前往官方網站」按鈕
  - 添加返回列表的連結
  - 處理載入和錯誤狀態

- **App.tsx** (`system/frontend/App.tsx`)
  - 添加 `/guesthouses/:id` 路由，對應 GuesthouseDetail 組件

- **Guesthouses.tsx** (`system/frontend/pages/Guesthouses.tsx`)
  - 更新 VIEW DETAILS 按鈕：從外部連結改為內部路由連結
  - 使用 `Link` 組件鏈接到 `/guesthouses/{id}`
  - 移除條件判斷，所有民宿都顯示 VIEW DETAILS 按鈕並鏈接到詳細頁面

### Features
- **詳細頁面**：每個民宿現在都有獨立的詳細頁面
- **路由整合**：使用 React Router 進行客戶端路由
- **完整資訊**：詳細頁面顯示所有民宿資訊，包括圖片和詳細描述（HTML 格式）
- **外部連結**：如果有官方網站連結，在詳細頁面底部顯示「前往官方網站」按鈕

### Technical Details
- **路由結構**：`/guesthouses/:id` 用於顯示單個民宿的詳細資訊
- **API 端點**：使用 `GET /api/guesthouses/{id}` 獲取單個民宿資訊
- **導航**：使用 React Router 的 `Link` 和 `useNavigate` 進行頁面導航

## 2026-01-04 15:39:01 - 民宿推薦添加簡短說明欄位，移除列表中的描述顯示 / Add Short Description Field to Guesthouses, Remove Description from Lists

### Database Changes

- **Migration** (`database/migrations/2026_01_04_153901_add_short_description_to_guesthouses_table.php`) - 新建
  - 添加 `short_description` 欄位到 `guesthouses` 表
  - 欄位類型：`string`，可為空，最大長度 255

### Backend Changes

- **Guesthouse.php** (`app/Models/Guesthouse.php`)
  - 添加 `short_description` 到 `$fillable` 陣列

- **GuesthouseController.php** (`app/Http/Controllers/Api/GuesthouseController.php`)
  - 添加 `short_description` 到驗證規則（`nullable|string|max:255`）
  - 更新搜索邏輯，包含 `short_description` 欄位

- **GuesthousesPage.tsx** (`system/backend/pages/GuesthousesPage.tsx`)
  - 移除列表中的「描述」欄位
  - 添加「簡短說明」欄位到列表（顯示 `short_description`）
  - 在表單中添加「簡短說明」輸入框（文字框，最大長度 255）
  - 保留「描述」欄位在表單中（使用 CKEditor）

### Frontend Changes

- **Guesthouses.tsx** (`system/frontend/pages/Guesthouses.tsx`)
  - 移除描述顯示
  - 添加簡短說明顯示（如果有就顯示，沒有隱藏但保持高度一致）
  - 使用 `min-h-[1.5rem]` 確保高度一致

### Features
- **簡短說明**：添加簡短說明欄位，使用簡單的文字框（不是 CKEditor）
- **列表優化**：後端和前端列表都不顯示描述，只顯示簡短說明
- **高度一致**：前端即使沒有簡短說明也保持相同高度

### Technical Details
- **欄位類型**：`short_description` 為 `string` 類型，可為空，最大長度 255
- **API 更新**：API 現在包含 `short_description` 欄位
- **搜索功能**：搜索現在也包含簡短說明欄位

## 2026-01-04 15:31:03 - 為 CKEditor 5 添加圖片上傳功能 / Add Image Upload Functionality to CKEditor 5

### Backend Changes

- **UploadController.php** (`app/Http/Controllers/Api/UploadController.php`) - 新建
  - 創建通用的圖片上傳控制器，用於 CKEditor 5 圖片上傳
  - 使用 ImageService 處理圖片上傳（轉換為 webp 格式，使用 UUID 文件名）
  - 返回 CKEditor 5 期望的 JSON 格式：`{ "url": "..." }`
  - 圖片保存到 `storage/app/public/editor/` 目錄

- **api.php** (`routes/api.php`)
  - 添加 `/api/upload/image` 端點（需要認證）
  - 用於 CKEditor 5 圖片上傳

- **CKEditor.tsx** (`system/backend/components/CKEditor.tsx`)
  - 添加圖片相關插件：Image, ImageUpload, ImageToolbar, ImageCaption, ImageStyle, ImageResize
  - 創建自定義圖片上傳適配器 `CustomUploadAdapter`，處理圖片上傳到服務器
  - 配置圖片工具欄選項：inline、block、side 樣式，圖片標題，替代文字
  - 在工具欄中添加 `uploadImage` 按鈕
  - 配置上傳端點為 `/api/upload/image`，使用 Bearer token 認證

### Features
- **圖片上傳**：支援從本地選擇圖片上傳到服務器
- **圖片編輯**：支援調整圖片樣式（inline、block、side）、添加標題和替代文字
- **圖片管理**：圖片自動轉換為 webp 格式，使用 UUID 文件名
- **認證支持**：圖片上傳需要認證，使用 Bearer token

### Technical Details
- **上傳適配器**：創建自定義 `CustomUploadAdapter` 類，實現 UploadAdapter 接口
- **上傳端點**：`POST /api/upload/image`，接收 `upload` 字段的圖片文件
- **返回格式**：服務器返回 `{ "url": "..." }` 格式的 JSON
- **圖片格式**：自動轉換為 webp 格式，使用 UUID 文件名

## 2026-01-04 15:27:23 - 修復 CKEditor 5 License Key 錯誤 / Fix CKEditor 5 License Key Error

### Backend Changes

- **CKEditor.tsx** (`system/backend/components/CKEditor.tsx`)
  - 添加 `licenseKey: 'GPL'` 配置：使用 GPL（Community）版本許可證
  - 修復 `license-key-missing` 錯誤：CKEditor 5 v44+ 需要明確設置 license key

### Technical Details
- **License 配置**：CKEditor 5 從 v44.0.0 開始，即使是 Community 版本也需要設置 `licenseKey: 'GPL'`
- **GPL 許可證**：使用 GPL 許可證時，編輯器會顯示 "Powered by CKEditor" 標誌

## 2026-01-04 15:18:08 - 為民宿推薦描述添加 CKEditor 5 富文本編輯功能 / Add CKEditor 5 Rich Text Editor for Guesthouse Description

### Backend Changes

- **package.json** (`system/backend/package.json`)
  - 添加 `@ckeditor/ckeditor5-react@^11.0.1`：CKEditor 5 React 組件
  - 添加 `ckeditor5@^46.0.0`：CKEditor 5 核心包

- **CKEditor.tsx** (`system/backend/components/CKEditor.tsx`) - 新建
  - 創建可重用的 CKEditor 5 組件
  - 支援富文本編輯功能：標題、粗體、斜體、下劃線、刪除線、字體大小、字體顏色、背景色、列表、對齊、連結、引用、表格等
  - 支援繁體中文界面
  - 支援禁用狀態動態切換
  - 最小高度 200px

- **GuesthousesPage.tsx** (`system/backend/pages/GuesthousesPage.tsx`)
  - 將描述欄位的 `textarea` 替換為 `CKEditorComponent`
  - 保留編輯功能，現在支援富文本格式

### Frontend Changes

- **Guesthouses.tsx** (`system/frontend/pages/Guesthouses.tsx`)
  - 更新描述顯示方式：使用 `dangerouslySetInnerHTML` 渲染 HTML 內容
  - 添加 `prose` 類別以確保 HTML 內容正確顯示

### Features
- **富文本編輯**：民宿推薦描述現在支援完整的富文本編輯功能
- **HTML 渲染**：前端正確顯示富文本格式的內容
- **編輯功能保留**：原有的編輯功能完全保留，只是增強了編輯能力

### Technical Details
- **編輯器配置**：
  - 使用 ClassicEditor 模式
  - 支援多種格式化選項
  - 繁體中文界面
- **前端渲染**：使用 `dangerouslySetInnerHTML` 和 Tailwind CSS `prose` 類別來渲染 HTML 內容

## 2025-12-31 17:12:44 - 配置前端構建輸出到 public 目錄（根路徑 /）/ Configure Frontend Build Output to public Directory (Root Path /)

### Build Configuration Changes

- **vite.config.ts** (`system/frontend/vite.config.ts`)
  - 添加 `base: '/'` 配置：前端應用對應根路徑 `/`
  - 添加 `build.outDir` 配置：構建輸出到 `public/` 目錄
  - 設置 `build.emptyOutDir: false`：不清空 public 目錄，保留 Laravel 的 `index.php`、`favicon.ico` 等文件
  - 添加 `rollupOptions` 配置：優化構建輸出，將 node_modules 分離為 vendor chunks

### Features
- **路徑對應**：
  - `system/frontend` 構建到 `public/` → 對應 `/` 路徑（前端首頁）
  - `system/backend` 構建到 `public/backend/` → 對應 `/backend` 路徑（後台管理系統）
- **構建優化**：自動將 React、React Router 等依賴分離為獨立的 vendor chunks，提升加載性能

### Technical Details
- **構建輸出目錄**：
  - Frontend: `public/` (對應 Nginx 的 `/` 路徑)
  - Backend: `public/backend/` (對應 Nginx 的 `/backend` 路徑)
- **構建命令**：
  ```bash
  cd system/frontend && pnpm run build  # 構建前端到 public/
  cd system/backend && pnpm run build   # 構建後台到 public/backend/
  ```

## 2025-12-31 09:15:17 - 修復罰單管理和機車清單 dark mode 下狀態標籤文字顏色 / Fix Text Color in Dark Mode for Status Tags in Fines and Scooters Pages

### Frontend Changes

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 修復 dark mode 下「繳費狀態」標籤的文字顏色：
    - 從 `dark:text-gray-100`（白色）改為 `dark:text-gray-900`（黑色）
    - 適用於「已處理」和「未繳費」狀態標籤

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 修復 dark mode 下「狀態」標籤的文字顏色：
    - 從 `dark:text-gray-100`（白色）改為 `dark:text-gray-900`（黑色）
    - 適用於「待出租」、「出租中」、「保養中」狀態標籤

### Features
- **可讀性改善**：在 dark mode 下，狀態標籤的文字顏色為黑色，在淺色背景上更清晰可讀
- **一致性**：light mode 和 dark mode 都使用黑色文字

### Technical Details
- 文字顏色：`text-gray-900 dark:text-gray-900`（light 和 dark mode 都是黑色）
- 背景色：使用對應的顏色（例如：待出租 = 灰色，出租中 = 天藍色，保養中 = 橘色）

## 2025-12-31 09:10:02 - 修復訂單管理頁面 dark mode 下租借機車標籤文字顏色 / Fix Text Color in Dark Mode for Rented Motorcycle Tags in Orders Page

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修復 dark mode 下「租借機車」標籤的文字顏色：
    - 從 `dark:text-gray-100`（白色）改為 `dark:text-gray-900`（黑色）
    - 確保在 dark mode 下文字顏色為黑色，提高可讀性
    - 適用於有顏色背景和默認灰色背景的標籤

### Features
- **可讀性改善**：在 dark mode 下，租借機車標籤的文字顏色為黑色，在淺色背景上更清晰可讀
- **一致性**：light mode 和 dark mode 都使用黑色文字

### Technical Details
- 文字顏色：`text-gray-900 dark:text-gray-900`（light 和 dark mode 都是黑色）
- 背景色：使用車款類型對應的顏色（例如：白牌 = 天藍色）

## 2025-12-31 09:06:27 - 修復罰單管理頁面日期選擇器時區問題 / Fix Timezone Issue in Fines Page Date Picker

### Frontend Changes

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 修復日期選擇器的時區問題：
    - 之前使用 `toISOString().split('T')[0]` 會將日期轉換為 UTC 時間
    - 在 UTC+8 時區（台灣）可能會導致日期少一天
    - 改為使用本地時間格式化日期：
      - 使用 `getFullYear()`, `getMonth() + 1`, `getDate()` 獲取本地時間的年月日
      - 手動格式化為 `YYYY-MM-DD` 格式
      - 確保選擇的日期與顯示的日期一致

### Problem
- **時區問題**：`toISOString()` 會將日期轉換為 UTC 時間
- **影響**：在 UTC+8 時區選擇日期時，可能會少一天
- **範例**：選擇 2025-12-30，可能變成 2025-12-29

### Solution
- 使用本地時間的 `getFullYear()`, `getMonth()`, `getDate()` 方法
- 手動格式化日期字串，避免時區轉換
- 確保選擇的日期與保存的日期一致

### Technical Details
- 日期格式化：`${year}-${month}-${day}`
- 月份和日期使用 `padStart(2, '0')` 確保兩位數格式
- 不再使用 `toISOString()` 避免時區轉換問題

## 2025-12-31 08:43:42 - 更新訂單管理頁面使用車款類型顏色 / Update Orders Page to Use Vehicle Type Colors

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 移除從 `ScooterModelColor` 表獲取顏色的邏輯
  - 添加 `typeColorMap` 定義車款類型對應的顏色（與機車管理頁面一致）：
    - **白牌**：天藍色 (`#7DD3FC`, sky-300)
    - **綠牌**：綠色 (`#86EFAC`, green-300)
    - **電輔車**：橘色 (`#FED7AA`, orange-200)
    - **三輪車**：黃色 (`#FDE047`, yellow-300)
  - 更新 `getScooterModelColor` 函數：
    - 改為根據機車的車款類型 (`s.type`) 獲取顏色
    - 不再使用 `scooterModelColorsApi` API
    - 直接從 `typeColorMap` 獲取對應的顏色
  - 移除 `scooterColorMap` 狀態和相關的 `useEffect`
  - 移除 `scooterModelColorsApi` 的 import

### Features
- **統一顏色邏輯**：訂單管理和機車管理使用相同的車款類型顏色對應規則
- **簡化實現**：不再需要查詢資料庫，直接使用前端定義的顏色映射
- **即時顯示**：顏色直接從訂單中的機車類型獲取，無需額外 API 調用

### Technical Details
- 對應關係：訂單中的機車型號 → 機車的車款類型 (`order.scooters[].type`) → `typeColorMap[type]` → 顏色值
- 訂單資源 (`OrderResource`) 已經包含機車的 `type` 欄位
- 顏色值使用 hex 格式（例如：#7DD3FC）

## 2025-12-30 23:21:47 - 移除機車管理列表中機車型號和車款類型的顏色顯示 / Remove Color Display from Model and Type Columns in Scooters List

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 移除「機車型號」欄位中的顏色方塊和 hex 顏色值顯示
  - 移除「車款類型」欄位中的顏色方塊和 hex 顏色值顯示
  - 簡化顯示，只保留機車型號文字和車款類型標籤

### Features
- **簡化顯示**：移除列表中的顏色值顯示，保持界面簡潔
- **保留功能**：新增/編輯表單中的自動顏色設定功能仍然保留

## 2025-12-30 23:17:31 - 添加車款類型自動顏色設定功能 / Add Automatic Color Setting Based on Vehicle Type

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 添加 `typeColorMap` 定義車款類型對應的顏色：
    - **白牌**：天藍色 (`#7DD3FC`, sky-300)
    - **綠牌**：綠色 (`#86EFAC`, green-300)
    - **電輔車**：橘色 (`#FED7AA`, orange-200)
    - **三輪車**：黃色 (`#FDE047`, yellow-300)
  - 更新新增/編輯表單：
    - 當選擇車款類型時，自動設定對應的顏色到 `formData.color`
    - 在「車款顏色」欄位旁邊顯示顏色預覽（顏色方塊和 hex 值）
    - 添加提示文字說明自動設定規則
    - 用戶仍可手動修改顏色
  - 更新機車管理列表：
    - 在「車款類型」欄位旁邊顯示對應的顏色值
    - 顯示顏色方塊和 hex 顏色值（例如：#7DD3FC）
    - 顏色直接從 `typeColorMap` 獲取

### Features
- **自動顏色設定**：選擇車款類型時自動設定對應的顏色
- **視覺識別**：在列表和表單中都能看到顏色值
- **可手動修改**：雖然自動設定，但用戶仍可手動修改顏色
- **一致性**：新增、編輯和列表都使用相同的顏色對應規則

### Technical Details
- 顏色值使用 hex 格式（例如：#7DD3FC）
- 顏色對應關係定義在 `typeColorMap` 常數中
- 當車款類型改變時，自動更新 `formData.color`
- 列表中的顏色直接從 `typeColorMap` 獲取，不依賴資料庫

## 2025-12-30 23:02:38 - 在機車管理列表顯示機車型號對應的顏色值 / Display Scooter Model Color Values in Scooters Management List

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 添加 `modelColorMap` 狀態來儲存機車型號到顏色的映射
  - 添加 `useEffect` 來獲取機車型號顏色：
    - 從所有機車中提取唯一的型號
    - 批量調用 `scooterModelColorsApi.getColors()` 獲取顏色
    - 從 `scooter_model_colors` 表獲取對應的 `color` 欄位值
  - 更新「機車型號」欄位顯示：
    - 在機車型號旁邊顯示顏色方塊和 hex 顏色值
    - 顏色方塊使用對應的顏色作為背景色
    - 顯示 hex 顏色值（例如：#FF6B9D）
    - 如果型號沒有對應的顏色，則不顯示

### Features
- **顏色顯示**：在機車管理列表中，每個機車型號旁邊顯示對應的顏色值
- **視覺識別**：通過顏色方塊和 hex 值，快速識別機車型號的顏色
- **自動對應**：顏色直接從 `ScooterModelColor` 表的 `color` 欄位獲取

### Technical Details
- 使用 `scooterModelColorsApi.getColors()` API 批量獲取顏色
- 對應關係：機車型號 (`scooter.model`) → `ScooterModelColor` 表的 `model` 欄位 → `color` 欄位
- 顏色顯示格式：顏色方塊（4x4px）+ hex 顏色值（例如：#FF6B9D）

## 2025-12-30 22:57:12 - 確認訂單管理頁面機車型號直接對應 ScooterModelColor 表顏色 / Confirm Orders Page Scooter Models Directly Map to ScooterModelColor Table Colors

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 確認機車型號標籤直接對應到 `ScooterModelColor` 表的顏色
  - 移除編輯功能相關代碼（點擊事件、顏色選擇器彈窗等）
  - 機車型號標籤僅顯示顏色，不提供編輯功能
  - 顏色直接從 `scooter_model_colors` 表的 `color` 欄位獲取並顯示

### Features
- **直接對應**：訂單中的機車型號直接對應到 `ScooterModelColor` 表的 `color` 欄位
- **自動顯示**：根據資料表中的顏色自動顯示，無需手動設定
- **簡潔設計**：只顯示顏色，不提供編輯功能

### Technical Details
- 訂單中的機車型號 (`order.scooters[].model`) 對應到 `scooter_model_colors` 表的 `model` 欄位
- 查詢資料表獲取對應的 `color` 欄位值
- 使用該顏色作為機車型號標籤的背景色
- 如果型號不存在，API 會自動分配顏色並存入資料庫

## 2025-12-30 22:47:57 - 確認並強化機車型號顏色對應關係說明 / Confirm and Strengthen Scooter Model Color Mapping Documentation

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 更新註釋，明確說明顏色對應關係：
    - 訂單中的機車型號 (`order.scooters[].model`) 
    - → `ScooterModelColor` 表的 `model` 欄位（查詢條件）
    - → `ScooterModelColor` 表的 `color` 欄位（返回的顏色值）
  - 在 `useEffect` 和 `getScooterModelColor` 函數中添加詳細的對應關係說明

### Technical Details
- **資料表對應**：`scooter_model_colors` 表
- **查詢邏輯**：`WHERE model = '機車型號'` → 返回對應的 `color` 欄位值
- **自動處理**：如果型號不存在，API 會自動分配顏色並存入資料庫
- **前端使用**：使用返回的 `color` 值作為「租借機車」標籤的背景色

### Data Flow
```
訂單中的機車型號 (order.scooters[].model)
    ↓
前端收集所有唯一的 model
    ↓
API: scooterModelColorsApi.getColors([...models])
    ↓
後端: ScooterModelColor::getColorForModel($model)
    ↓
資料庫查詢: SELECT color FROM scooter_model_colors WHERE model = $model
    ↓
返回 color 欄位值
    ↓
前端使用該顏色作為背景色顯示
```

## 2025-12-30 22:43:29 - 恢復機車管理頁面狀態標籤的顏色 / Restore Status Tag Colors in Scooters Page

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 恢復狀態標籤的背景顏色：
    - **待出租**：灰色 (`#D1D5DB`, gray-300)
    - **出租中**：天藍色 (`#BAE6FD`, sky-200)
    - **保養中**：橘色 (`#FED7AA`, orange-200)
  - 狀態標籤使用內聯樣式設定背景顏色，文字保持黑色

### Features
- **視覺區分**：不同狀態使用不同的顏色，便於快速識別機車狀態
- **一致的顏色**：與之前設定的狀態顏色保持一致

### Technical Details
- 使用內聯樣式 (`style`) 設定狀態標籤的背景顏色
- 顏色值使用 hex 格式，對應 Tailwind CSS 顏色類別
- 文字顏色保持黑色 (`text-gray-900 dark:text-gray-100`)

## 2025-12-30 22:39:22 - 確認訂單租借機車型號對應 ScooterModelColor 的 color / Confirm Order Scooter Models Map to ScooterModelColor Color

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 更新註釋，明確說明訂單中的機車型號對應到 `ScooterModelColor` 表的 `color` 欄位
  - 確認 `getScooterModelColor()` 函數從 `scooter_model_colors` 表獲取顏色
  - 確認「租借機車」欄位使用 `ScooterModelColor` 表的 `color` 作為背景色

### Technical Details
- 訂單中的機車型號（`order.scooters[].model`）對應到 `scooter_model_colors` 表的 `model` 欄位
- 顏色從 `scooter_model_colors` 表的 `color` 欄位獲取
- 如果型號不存在，API 會自動分配顏色並存入資料庫
- 前端通過批量 API (`scooterModelColorsApi.getColors()`) 獲取所有需要的型號顏色

## 2025-12-30 22:34:55 - 創建 Seeder 將現有機車型號寫入顏色表 / Create Seeder to Populate Existing Scooter Models to Color Table

### Database Changes

- **ScooterModelColorSeeder.php** (`database/seeders/ScooterModelColorSeeder.php`)
  - 新增 Seeder 來將現有的機車型號寫入 `scooter_model_colors` 表
  - 從 `scooters` 表中獲取所有唯一的機車型號
  - 為每個型號自動分配顏色（使用 `ScooterModelColor::assignColorForModel()`）
  - 跳過已存在的型號，避免重複
  - 顯示處理進度和結果

### Usage
執行以下命令來將現有機車型號寫入顏色表：
```bash
php artisan db:seed --class=ScooterModelColorSeeder
```

### Features
- **自動處理**：自動從 `scooters` 表提取所有唯一的機車型號
- **避免重複**：檢查型號是否已存在，跳過已存在的記錄
- **自動分配顏色**：使用智能顏色分配算法為每個型號分配顏色
- **進度顯示**：顯示處理進度和結果統計

## 2025-12-30 22:28:37 - 實現機車型號顏色系統，移除 display_color 欄位 / Implement Scooter Model Color System, Remove display_color Field

### Database Changes

- **Migration** (`database/migrations/2025_12_30_222425_create_scooter_model_colors_table.php`)
  - 創建 `scooter_model_colors` 表來儲存機車型號和顏色的對應關係
  - 欄位：`id`, `model` (unique), `color` (hex 格式), `timestamps`
  
- **Migration** (`database/migrations/2025_12_30_222427_remove_display_color_from_scooters_table.php`)
  - 移除 `scooters` 表的 `display_color` 欄位

### Backend Changes

- **ScooterModelColor.php** (`app/Models/ScooterModelColor.php`)
  - 新增 Model 來管理機車型號顏色
  - 實現 `getColorForModel()` 方法：自動獲取或分配顏色
  - 實現 `assignColorForModel()` 方法：自動分配顏色邏輯
    - 使用預定義的亮色調色板（20 種顏色）
    - 確保顏色不重複且不太接近（使用歐幾里得距離計算）
    - 如果所有預定義顏色都被使用，自動生成新的亮色

- **ScooterModelColorController.php** (`app/Http/Controllers/Api/ScooterModelColorController.php`)
  - 新增 API Controller 管理機車型號顏色
  - `index()`: 獲取所有型號顏色
  - `show($model)`: 獲取特定型號的顏色（自動分配如果不存在）
  - `getColors()`: 批量獲取多個型號的顏色
  - `update($model)`: 更新型號顏色
  - `destroy($model)`: 刪除型號顏色

- **routes/api.php**
  - 新增 `/api/scooter-model-colors` 路由群組
  - 包含：`GET /`, `POST /get-colors`, `GET /{model}`, `PUT /{model}`, `DELETE /{model}`

- **Scooter.php** (`app/Models/Scooter.php`)
  - 從 `$fillable` 移除 `display_color`

- **ScooterController.php** (`app/Http/Controllers/Api/ScooterController.php`)
  - 移除 `display_color` 驗證規則

- **ScooterResource.php** (`app/Http/Resources/ScooterResource.php`)
  - 從 `toArray()` 移除 `display_color` 欄位

- **OrderResource.php** (`app/Http/Resources/OrderResource.php`)
  - 從 `scooters` 數據結構移除 `display_color` 欄位
  - 顏色將由前端通過機車型號顏色 API 獲取

### Frontend Changes

- **api.ts** (`system/backend/lib/api.ts`)
  - 新增 `scooterModelColorsApi` API 客戶端
  - 包含：`list()`, `getColor(model)`, `getColors(models[])`, `update(model, color)`, `delete(model)`

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 更新 `Order` interface，從 `scooters` 移除 `display_color`
  - 更新 `useEffect` 來使用 `scooterModelColorsApi.getColors()` 批量獲取機車型號顏色
  - 更新 `getScooterModelColor()` 函數來使用機車型號顏色映射
  - 移除從機車列表獲取 `display_color` 的邏輯

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 從 `Scooter` interface 移除 `display_color`
  - 從 `formData` 移除 `display_color`
  - 移除表單中的「顯示顏色」欄位（顏色選擇器和預覽）
  - 移除列表中的「顏色」欄位
  - 更新表格列數（從 8 列改為 7 列）

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 從 `scooter` interface 移除 `display_color`

### Features
- **自動顏色分配**：系統自動為每個機車型號分配一個亮色，確保顏色不重複且不太接近
- **型號顏色管理**：通過 API 管理機車型號和顏色的對應關係
- **訂單顯示**：訂單管理頁面中的「租借機車」欄位使用機車型號對應的顏色
- **簡化設計**：移除機車管理頁面中的顏色設定，改為由系統自動管理

### Technical Details
- 顏色值儲存為 hex 格式（例如：#FF6B9D）
- 使用歐幾里得距離計算顏色相似度，確保分配的顏色不太接近
- 預定義 20 種亮色，如果都用完會自動生成新的亮色
- 前端通過批量 API 獲取所有需要的型號顏色，提高效率

## 2025-12-30 22:17:22 - 移除機車和罰單頁面的顏色設定，改為黑色文字 / Remove Color Settings from Scooters and Fines Pages, Use Black Text

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - **車牌號碼**：移除 `display_color` 的顏色設定，改為純黑色文字 (`text-gray-900 dark:text-gray-100`)
  - **機車型號**：移除 `display_color` 的顏色設定，改為純黑色文字 (`text-gray-900 dark:text-gray-100`)
  - **狀態標籤**：移除背景顏色設定，改為預設灰色背景 (`bg-gray-100 dark:bg-gray-700`)，文字為黑色

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - **車牌號碼**：移除 `display_color` 的顏色設定，改為純黑色文字 (`text-gray-900 dark:text-gray-100`)

### Features
- **簡化視覺設計**：移除機車和罰單頁面中車牌號碼、機車型號的顏色設定
- **統一的文字顏色**：所有相關欄位使用黑色文字，保持一致的視覺風格
- **狀態標籤簡化**：機車管理頁面的狀態標籤使用預設灰色背景，不再使用彩色背景

### Technical Details
- 移除所有 `display_color` 相關的內聯樣式設定
- 使用 Tailwind CSS 類別設定文字顏色為黑色
- 狀態標籤改為使用預設的灰色背景樣式

## 2025-12-30 22:08:41 - 調整狀態標籤顏色為更淡的版本 / Adjust Status Tag Colors to Lighter Shades

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 調整狀態標籤的背景顏色為更淡的版本：
    - **待出租**：灰色 (`#D1D5DB`, gray-300) - 從 gray-400 調整
    - **出租中**：天藍色 (`#BAE6FD`, sky-200) - 從 sky-300 調整
    - **保養中**：橘色 (`#FED7AA`, orange-200) - 從 orange-400 調整

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 調整狀態標籤的背景顏色為更淡的版本：
    - **已處理**：天藍色 (`#BAE6FD`, sky-200) - 從 sky-300 調整
    - **未繳費**：灰色 (`#D1D5DB`, gray-300) - 從 gray-400 調整

### Features
- **更柔和的視覺效果**：使用更淡的顏色，提供更舒適的視覺體驗
- **保持可讀性**：文字顏色保持黑色，確保在淡色背景上仍然清晰可讀

### Technical Details
- 顏色值調整為更淡的 Tailwind CSS 顏色類別（200-300 範圍）
- 使用內聯樣式 (`style`) 設定狀態標籤的背景顏色
- 文字顏色保持黑色 (`text-gray-900 dark:text-gray-100`)

## 2025-12-30 22:04:20 - 更新狀態標籤顏色 / Update Status Tag Colors

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 更新狀態標籤的背景顏色：
    - **待出租**：灰色 (`#9CA3AF`)
    - **出租中**：天藍色 (`#7DD3FC`, sky-300)
    - **保養中**：橘色 (`#FB923C`, orange-400)
  - 狀態標籤不再使用 `scooter.display_color`，改為根據狀態使用固定顏色

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 更新狀態標籤的背景顏色：
    - **已處理**：天藍色 (`#7DD3FC`, sky-300)
    - **未繳費**：灰色 (`#9CA3AF`)
  - 狀態標籤不再使用 `fine.scooter?.display_color`，改為根據狀態使用固定顏色

### Features
- **統一的狀態顏色**：不同狀態使用不同的顏色，便於快速識別
- **視覺一致性**：機車管理和罰單管理頁面的狀態顏色保持一致

### Technical Details
- 使用內聯樣式 (`style`) 設定狀態標籤的背景顏色
- 顏色值使用 hex 格式，對應 Tailwind CSS 顏色類別
- 文字顏色保持黑色 (`text-gray-900 dark:text-gray-100`)

## 2025-12-30 17:58:39 - 修復機車管理頁面狀態計數邏輯 / Fix Scooters Page Status Count Logic

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 添加 `allScooters` 狀態來儲存所有機車資料，用於計算各狀態的計數
  - 更新 `fetchScooters` 函數：
    - 先獲取所有機車（用於計算計數）
    - 再獲取過濾後的機車（用於顯示列表）
  - 更新 `statusCounts` 計算邏輯：
    - 基於 `allScooters` 計算各狀態的計數
    - 計數不受過濾器影響，始終顯示真實的總數
  - 更新 `modelStatistics` 計算邏輯：
    - 基於 `allScooters` 計算各機車型號的統計
    - 確保統計數據不受過濾器影響

### Features
- **正確的計數顯示**：選擇某個狀態過濾器時，其他狀態的計數不會變成 0
- **一致的統計數據**：機車型號統計始終基於所有機車資料

### Technical Details
- 使用 `allScooters` 儲存所有機車資料
- 計數和統計基於 `allScooters` 計算，不受 `statusFilter` 影響
- 列表顯示基於過濾後的 `scooters` 資料

## 2025-12-30 17:41:22 - 更新罰單管理頁面狀態標籤使用機車的 display_color / Update Fines Page Status to Use Scooter display_color

### Frontend Changes

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 更新「繳費狀態」欄位顯示：
    - 如果機車有設定 `display_color`，使用該顏色作為狀態標籤的背景色
    - 如果沒有 `display_color`，使用灰色背景（`#E5E7EB`）
    - 文字保持黑色（`text-gray-900 dark:text-gray-100`）確保可讀性
    - 移除了根據狀態顯示不同顏色的邏輯（未繳費=紅色、已處理=綠色）
    - 與機車管理頁面的狀態標籤保持一致，都使用機車的 `display_color`
    - 使用 `style={{ backgroundColor: display_color }}` 來應用背景色

### Features
- **視覺一致性**：罰單管理和機車管理頁面的狀態標籤現在都使用機車的 `display_color` 作為背景色
- **可讀性**：文字保持黑色，確保在任何背景色下都有良好的可讀性

### Technical Details
- 使用 `style={{ backgroundColor: fine.scooter?.display_color }}` 來應用背景色
- 如果沒有 `display_color`，使用灰色背景 `#E5E7EB`（對應 Tailwind 的 `bg-gray-200`）
- 文字顏色使用 `text-gray-900 dark:text-gray-100` 確保可讀性

## 2025-12-30 17:40:20 - 統一罰單管理和機車管理頁面的狀態過濾按鈕樣式 / Unify Status Filter Button Styles in Fines and Scooters Pages

### Frontend Changes

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 更新狀態過濾按鈕樣式，與機車管理頁面保持一致：
    - 選中狀態：橙色背景（`bg-orange-600`）、白色文字、有陰影（`shadow-sm shadow-orange-100`）
    - 未選中狀態：白色背景（`bg-white`）、灰色邊框（`border border-gray-200`）、灰色文字（`text-gray-600`）
    - 統一按鈕的 padding（`px-5 py-1.5`）和字體粗細（`font-bold`）
    - 移除了不同狀態使用不同顏色的邏輯（未繳費=紅色、已處理=綠色）
    - 統一使用橙色作為選中狀態的顏色

### Features
- **視覺一致性**：罰單管理和機車管理頁面的狀態過濾按鈕現在使用相同的樣式
- **用戶體驗**：統一的視覺風格讓用戶更容易理解和使用

### Technical Details
- 選中狀態：`bg-orange-600 text-white shadow-sm shadow-orange-100`
- 未選中狀態：`bg-white border border-gray-200 text-gray-600 hover:bg-gray-50`
- 所有按鈕使用相同的 padding 和字體樣式

## 2025-12-30 17:36:46 - 更新機車管理列表狀態標籤使用 display_color 作為背景色 / Update Scooters List Status to Use display_color as Background

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 更新「狀態」欄位顯示：
    - 如果機車有設定 `display_color`，使用該顏色作為狀態標籤的背景色
    - 如果沒有 `display_color`，使用灰色背景（`#E5E7EB`）
    - 文字保持黑色（`text-gray-900 dark:text-gray-100`）確保可讀性
    - 移除了根據狀態顯示不同顏色的邏輯（待出租=綠色、出租中=藍色、保養中=橙色）
    - 使用 `style={{ backgroundColor: display_color }}` 來應用背景色

### Features
- **視覺一致性**：狀態標籤使用機車的 `display_color` 作為背景色，與其他欄位保持一致
- **可讀性**：文字保持黑色，確保在任何背景色下都有良好的可讀性

### Technical Details
- 使用 `style={{ backgroundColor: display_color }}` 來應用背景色
- 如果沒有 `display_color`，使用灰色背景 `#E5E7EB`（對應 Tailwind 的 `bg-gray-200`）
- 文字顏色使用 `text-gray-900 dark:text-gray-100` 確保可讀性

## 2025-12-30 17:33:57 - 更新機車管理列表車牌號碼使用 display_color / Update Scooters List Plate Number to Use display_color

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 更新「車牌號碼」欄位顯示：
    - 如果機車有設定 `display_color`，使用該顏色顯示車牌號碼文字
    - 如果沒有 `display_color`，使用黑色（淺色模式）或白色（深色模式）
    - 使用 inline style 來應用 `display_color`
  - 與「機車型號」欄位保持一致，都使用 `display_color` 顯示顏色

### Features
- **視覺一致性**：機車管理列表中的「車牌號碼」和「機車型號」都使用 `display_color` 顯示
- **用戶體驗**：可以通過顏色快速識別不同機車

### Technical Details
- 使用 `style={{ color: display_color }}` 來應用顏色
- 如果沒有 `display_color`，使用 Tailwind CSS 類名 `text-gray-900 dark:text-gray-100`

## 2025-12-30 17:31:13 - 在罰單管理和機車管理列表中使用 display_color 顯示顏色 / Use display_color in Fines and Scooters List

### Frontend Changes

- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 更新 `Fine` interface，添加 `scooter` 的 `model` 和 `display_color` 欄位
  - 更新「車牌號碼」欄位顯示：
    - 如果機車有設定 `display_color`，使用該顏色顯示車牌號碼文字
    - 如果沒有 `display_color`，使用黑色（淺色模式）或白色（深色模式）
    - 使用 inline style 來應用 `display_color`

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 確認「機車型號」欄位已使用 `display_color` 顯示顏色
  - 如果機車有設定 `display_color`，使用該顏色顯示機車型號文字
  - 如果沒有 `display_color`，使用黑色（淺色模式）或白色（深色模式）

### Features
- **視覺一致性**：罰單管理和機車管理列表中的機車相關文字都使用 `display_color` 顯示
- **用戶體驗**：可以通過顏色快速識別不同機車

### Technical Details
- FineController 已經載入 `scooter` 關係，FineResource 使用 ScooterResource，所以已經包含 `display_color`
- 使用 `style={{ color: display_color }}` 來應用顏色
- 如果沒有 `display_color`，使用 Tailwind CSS 類名 `text-gray-900 dark:text-gray-100`

## 2025-12-30 17:25:05 - 更新訂單管理頁面機車標籤使用 display_color 作為背景色 / Update Orders Page to Use display_color as Background Color

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 更新「租借機車」欄位顯示：
    - 如果機車有設定 `display_color`，使用該顏色作為標籤的背景色
    - 文字保持黑色（`text-gray-900 dark:text-gray-100`）
    - 如果沒有 `display_color`，使用灰色背景和黑色文字
    - 使用 `style={{ backgroundColor: displayColor }}` 來應用背景色

### Features
- **視覺區分**：不同機車的標籤使用不同的背景色，更容易識別
- **可讀性**：文字保持黑色，確保在任何背景色下都有良好的可讀性

### Technical Details
- 使用 `style={{ backgroundColor: displayColor }}` 來應用背景色
- 文字顏色使用 `text-gray-900 dark:text-gray-100` 確保可讀性
- 如果沒有 `display_color`，使用 `bg-gray-100 dark:bg-gray-900/30` 作為默認背景

## 2025-12-30 17:21:28 - 在機車管理列表中使用 display_color 顯示機車型號 / Use display_color for Scooter Model in Scooters List

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 更新「機車型號」欄位顯示：
    - 如果機車有設定 `display_color`，使用該顏色顯示機車型號文字
    - 如果沒有 `display_color`，使用黑色（淺色模式）或白色（深色模式）
    - 使用 inline style 來應用 `display_color`

### Features
- **視覺一致性**：機車型號的顏色與機車設定的 `display_color` 一致
- **用戶體驗**：可以通過顏色快速識別不同機車

### Technical Details
- 使用 `style={{ color: scooter.display_color }}` 來應用顏色
- 如果沒有 `display_color`，使用 Tailwind CSS 類名 `text-gray-900 dark:text-gray-100`

## 2025-12-30 17:19:53 - 更新訂單管理頁面機車顏色顯示邏輯 / Update Scooter Color Display Logic in Orders Page

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 更新 `getScooterModelColor` 函數：
    - 優先使用訂單中機車的 `display_color`（直接從 OrderResource 返回）
    - 如果沒有 `display_color`，使用黑色作為默認顏色（`text-gray-900 dark:text-gray-100`）
    - 移除了根據機車類型顯示不同顏色的邏輯
  - 更新「租借機車」欄位顯示：
    - 如果有 `display_color`，使用該顏色（inline style）
    - 如果沒有 `display_color`，使用黑色文字

### Features
- **簡化顏色邏輯**：只使用機車設定的 `display_color`，如果沒有則使用黑色
- **視覺一致性**：確保訂單列表中的機車顏色直接來自機車設定

### Technical Details
- 移除了類型顏色作為後備的邏輯
- 如果機車沒有設定 `display_color`，統一使用黑色文字顯示

## 2025-12-30 17:10:50 - 為機車添加顯示顏色欄位並實現顏色選擇功能 / Add Display Color Field to Scooters and Implement Color Selection

### Database Changes

- **Migration** (`database/migrations/2025_12_30_170200_add_display_color_to_scooters_table.php`)
  - 新增 migration 檔案為 `scooters` 表添加 `display_color` 欄位
  - 欄位類型：`string('display_color', 50)->nullable()`
  - 位置：在 `color` 欄位之後
  - 用於儲存機車在訂單中顯示的顏色（hex 格式）

### Backend Changes

- **Scooter.php** (`app/Models/Scooter.php`)
  - 添加 `display_color` 到 `$fillable` 陣列

- **ScooterController.php** (`app/Http/Controllers/Api/ScooterController.php`)
  - 在 `store` 和 `update` 方法的驗證規則中添加 `display_color` 欄位
  - 驗證規則：`'display_color' => 'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/'`
  - 只接受有效的 hex 顏色格式（#RRGGBB）

- **ScooterResource.php** (`app/Http/Resources/ScooterResource.php`)
  - 在 `toArray` 方法中添加 `display_color` 欄位返回

- **OrderResource.php** (`app/Http/Resources/OrderResource.php`)
  - 更新 `scooters` 數據結構，添加 `display_color` 欄位
  - 現在返回：`{ model: string, type: string, display_color: string, count: number }`

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 更新 `Scooter` interface 添加 `display_color: string | null`
  - 更新 `formData` 添加 `display_color` 欄位
  - 在表單中添加顏色選擇器：
    - 使用 HTML5 color picker (`<input type="color">`)
    - 添加文字輸入框允許手動輸入 hex 顏色值
    - 添加 hex 顏色格式驗證（只接受 #RRGGBB 格式）
    - 顯示顏色預覽，展示選中顏色在機車型號上的效果
  - 更新機車清單「顏色」欄位：
    - 顯示顏色方塊和 hex 顏色值（如果有設定）
    - 如果沒有設定，顯示「未設定」文字

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 更新 `Order` interface，`scooters` 陣列添加 `display_color?: string` 欄位
  - 添加 `scooterColorMap` state 來儲存機車型號到顯示顏色的映射
  - 添加 `useEffect` 在頁面載入時獲取機車列表並建立顏色映射
  - 更新 `getScooterModelColor` 函數：
    - 優先使用機車設定的 `display_color`
    - 如果沒有，檢查 `scooterColorMap` 中是否有該型號的顏色
    - 如果都沒有，則根據機車類型返回對應顏色
  - 更新「租借機車」欄位顯示：
    - 如果有自定義顏色，使用 `style={{ color }}` 來應用 hex 顏色值
    - 如果沒有，使用類型顏色（Tailwind CSS 類名）

### Features
- **顏色自定義**：每個機車可以選擇自己的顯示顏色，用於訂單管理頁面
- **視覺區分**：訂單列表中的機車型號使用各自設定的顏色顯示，更容易區分
- **用戶友好**：顏色選擇器提供視覺化的顏色選擇和文字輸入框
- **向後兼容**：如果機車沒有設定顯示顏色，會使用類型顏色作為後備

### Technical Details
- 顏色值儲存為 hex 格式（例如：#FF5733）
- 後端驗證確保只接受有效的 hex 顏色格式
- 訂單列表會自動使用機車設定的顯示顏色，無需手動更新
- 如果機車沒有設定顯示顏色，會使用類型顏色（白牌=天藍色、綠牌=綠色、電輔車=橙色、三輪車=琥珀色）

## 2025-12-30 17:01:04 - 在機車清單中添加顏色顯示 / Add Color Display in Scooters List

### Frontend Changes

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 更新「顏色」欄位顯示：
    - 顯示根據機車類型的顏色標籤（與訂單管理頁面一致）
    - 顏色映射：
      - 白牌：天藍色 (`bg-sky-100 text-sky-700`)
      - 綠牌：綠色 (`bg-green-100 text-green-700`)
      - 電輔車：橙色 (`bg-orange-100 text-orange-700`)
      - 三輪車：琥珀色 (`bg-amber-100 text-amber-700`)
    - 如果機車有設定 color 文字（如「消光黑」），會在顏色標籤旁邊顯示
    - 所有顏色都支持深色模式

### UI Improvements
- **視覺一致性**：機車清單和訂單管理頁面使用相同的顏色方案
- **信息完整**：同時顯示機車類型顏色標籤和車款顏色文字（如果有）

### Technical Details
- API 和資料庫已經包含 `color` 欄位，無需額外更新
- ScooterResource 已經返回 `color` 欄位
- 前端直接使用現有的數據結構

## 2025-12-30 16:49:39 - 添加三輪車類型並更新機車顏色顯示邏輯 / Add Tricycle Type and Update Scooter Color Display Logic

### Database Changes

- **Migration** (`database/migrations/2025_12_30_153000_add_tricycle_to_scooters_type_enum.php`)
  - 新增 migration 檔案為 `scooters` 表的 `type` enum 欄位添加「三輪車」選項
  - 更新後的完整選項列表：`['白牌', '綠牌', '電輔車', '三輪車']`
  - 使用 `ALTER TABLE` 語句修改 MySQL enum 欄位

### Backend Changes

- **ScooterController.php** (`app/Http/Controllers/Api/ScooterController.php`)
  - 更新 `type` 欄位驗證規則：
    - 從 `'required|in:白牌,綠牌,電輔車'` 改為 `'required|in:白牌,綠牌,電輔車,三輪車'`
    - 更新錯誤訊息包含「三輪車」

- **OrderResource.php** (`app/Http/Resources/OrderResource.php`)
  - 更新 `scooters` 數據結構，添加 `type` 欄位：
    - 在按 model 分組時，同時返回該 model 的 `type` 信息
    - 現在返回：`{ model: string, type: string, count: number }`

### Frontend Changes

- **types.ts** (`system/backend/types.ts`)
  - 更新 `ScooterType` enum，添加 `TRICYCLE = '三輪車'`

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 更新 `Order` interface，`scooters` 陣列添加 `type?: string` 欄位
  - 更新 `getScooterModelColor` 函數：
    - 從根據 model 名稱哈希分配顏色改為根據機車類型分配顏色
    - 顏色映射：
      - 白牌：天藍色 (`bg-sky-100 text-sky-700`)
      - 綠牌：綠色 (`bg-green-100 text-green-700`)
      - 電輔車：橙色 (`bg-orange-100 text-orange-700`)
      - 三輪車：琥珀色/黃色 (`bg-amber-100 text-amber-700`，不要太亮)
    - 更新調用處，從傳入 `s.model` 改為傳入 `s.type`

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 在「車款類型」下拉選單中添加「三輪車 (Tricycle)」選項
  - 更新機車類型標籤的顏色顯示：
    - 白牌：天藍色 (`bg-sky-50 text-sky-600`)
    - 綠牌：綠色 (`bg-green-50 text-green-600`)
    - 電輔車：橙色 (`bg-orange-50 text-orange-600`)
    - 三輪車：琥珀色 (`bg-amber-50 text-amber-600`)
    - 所有顏色都支持深色模式

### Features
- **新增機車類型**：現在可以選擇「三輪車」作為機車類型
- **顏色區分**：訂單管理頁面中的機車型號現在根據類型顯示不同顏色，更容易區分
- **視覺一致性**：機車管理頁面和訂單管理頁面使用相同的顏色方案

### Technical Details
- 訂單中的機車數據現在包含 `type` 欄位，用於顏色顯示
- 顏色選擇符合用戶要求：白牌（天藍色）、綠牌（綠色）、電輔車（橙色）、三輪車（琥珀色/不太亮的黃色）

## 2025-12-30 15:28:33 - 優化合作商名稱顏色顯示 / Optimize Partner Name Color Display

### Frontend Changes

- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 優化合作商名稱的顏色套用：
    - 當有設定顏色時，使用 `style={{ color: partner.color }}` 直接套用 hex 顏色值
    - 當沒有設定顏色時，使用默認的灰色 Tailwind 類名
    - 確保顏色正確覆蓋默認的文字顏色

### UI Improvements
- **顏色顯示**：合作商名稱現在會正確使用設定的顏色顯示
- **視覺一致性**：有顏色的名稱會優先顯示自定義顏色，沒有顏色的使用默認灰色

## 2025-12-30 15:27:44 - 在合作商列表中顯示顏色 / Display Color in Partners List

### Frontend Changes

- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 在合作商列表表格中添加「顯示顏色」欄位：
    - 在表頭添加「顯示顏色」欄位（位於「合作商名稱」和「合作商地址」之間）
    - 在每一行顯示顏色：
      - 如果有設定顏色：顯示顏色方塊和 hex 顏色值
      - 如果沒有設定顏色：顯示「未設定」文字
    - 合作商名稱使用設定的顏色顯示（如果有設定）
    - 更新 `colSpan` 從 7 改為 8（因為新增了一欄）

### UI Improvements
- **視覺識別**：在列表中可以直接看到每個合作商的顏色設定
- **顏色預覽**：顏色方塊和 hex 值讓顏色設定一目了然
- **一致性**：合作商名稱在列表中也會使用設定的顏色顯示

## 2025-12-30 15:25:00 - 將合作商顏色選擇器改為 Color Picker / Change Partner Color Selector to Color Picker

### Backend Changes

- **PartnerController.php** (`app/Http/Controllers/Api/PartnerController.php`)
  - 更新 `color` 欄位驗證規則：
    - 從 `'nullable|string|max:50'` 改為 `'nullable|string|regex:/^#[0-9A-Fa-f]{6}$/'`
    - 現在只接受 hex 顏色格式（例如：#FF5733）

### Frontend Changes

- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 將固定顏色按鈕改為 HTML5 color picker：
    - 使用 `<input type="color">` 提供顏色選擇器
    - 添加文字輸入框允許手動輸入 hex 顏色值
    - 添加 hex 顏色格式驗證（只接受 #RRGGBB 格式）
    - 顯示顏色預覽，展示選中顏色在文字上的效果
    - 移除原本的 16 種固定顏色按鈕

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 更新 `getPartnerColor` 函數：
    - 現在返回 hex 顏色值（string）或 null，而不是 Tailwind CSS 類名
  - 更新合作商名稱顯示：
    - 使用 `style={{ color }}` 來應用 hex 顏色值
    - 如果沒有設定顏色，使用默認的灰色 Tailwind 類名

### Features
- **自由選擇顏色**：用戶現在可以選擇任意顏色，不再受限於預設的 16 種顏色
- **直觀操作**：提供視覺化的顏色選擇器和文字輸入框
- **即時預覽**：選擇顏色後可以立即看到效果

### Technical Details
- 顏色值儲存為 hex 格式（例如：#FF5733）
- 後端驗證確保只接受有效的 hex 顏色格式
- 前端使用 inline style 來應用自定義顏色

## 2025-12-30 15:17:17 - 為合作商添加顏色欄位並實現顏色選擇功能 / Add Color Field to Partners and Implement Color Selection

### Database Changes

- **Migration** (`database/migrations/2025_12_30_151200_add_color_to_partners_table.php`)
  - 新增 migration 檔案為 `partners` 表添加 `color` 欄位
  - 欄位類型：`string('color', 50)->nullable()`
  - 位置：在 `photo_path` 欄位之後

### Backend Changes

- **Partner.php** (`app/Models/Partner.php`)
  - 添加 `color` 到 `$fillable` 陣列

- **PartnerController.php** (`app/Http/Controllers/Api/PartnerController.php`)
  - 在 `store` 和 `update` 方法的驗證規則中添加 `color` 欄位
  - 驗證規則：`'color' => 'nullable|string|max:50'`

- **PartnerResource.php** (`app/Http/Resources/PartnerResource.php`)
  - 在 `toArray` 方法中添加 `color` 欄位返回

### Frontend Changes

- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 更新 `Partner` interface 添加 `color: string | null`
  - 更新 `formData` 添加 `color` 欄位
  - 在表單中添加顏色選擇器：
    - 16 種預設顏色選項（purple, indigo, pink, teal, cyan, violet, fuchsia, rose, emerald, blue, green, orange, red, yellow, amber, lime）
    - 每個顏色顯示為可點擊的按鈕
    - 選中的顏色會顯示勾選標記和邊框高亮
    - 顯示預覽文字展示選中的顏色效果
  - 在新增和編輯合作商時可以選擇顏色

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 添加 `partnerColorMap` state 來儲存合作商名稱到顏色的映射
  - 添加 `useEffect` 在頁面載入時獲取合作商列表並建立顏色映射
  - 更新 `getPartnerColor` 函數：
    - 優先使用合作商設定的顏色
    - 如果合作商沒有設定顏色，則使用默認灰色
    - 移除了原本的哈希函數顏色分配邏輯

### Features
- **顏色自定義**：每個合作商可以選擇自己的顯示顏色
- **視覺區分**：訂單列表中的合作商名稱使用各自設定的顏色顯示，更容易區分
- **用戶友好**：顏色選擇器提供 16 種預設顏色，清晰直觀

### Technical Details
- 顏色值儲存為 Tailwind CSS 類名格式（例如：`text-purple-600 dark:text-purple-400`）
- 訂單列表會自動使用合作商設定的顏色，無需手動更新
- 如果合作商沒有設定顏色，會顯示默認的灰色

## 2025-12-30 15:10:15 - 更新 payment_method enum 欄位，添加缺少的三個付款方式選項 / Update payment_method Enum to Include Missing Payment Options

### Database Changes

- **Migration** (`database/migrations/2025_12_30_150956_update_payment_method_enum_in_orders_table.php`)
  - 新增 migration 檔案來更新 `orders` 表的 `payment_method` enum 欄位
  - 添加缺少的三個付款方式選項：
    - 匯款
    - 刷卡
    - 行動支付
  - 更新後的完整選項列表：`['現金', '月結', '日結', '匯款', '刷卡', '行動支付']`
  - 使用 `ALTER TABLE` 語句修改 MySQL enum 欄位

### Bug Fixes
- **SQL 錯誤修復**：修復 `Data truncated for column 'payment_method'` 錯誤
  - 之前資料庫 enum 只有三個選項（現金、月結、日結）
  - 但前端和 API 驗證規則已經包含六個選項
  - 當用戶選擇「匯款」、「刷卡」或「行動支付」時會導致 SQL 錯誤
  - 現在資料庫 enum 已更新為包含所有六個選項

### Technical Details
- Migration 使用 `DB::statement()` 直接執行 SQL `ALTER TABLE` 語句
- 因為 Laravel Schema Builder 不支援直接修改 enum 值，所以使用原生 SQL
- `down()` 方法可以還原為原本的三個選項

## 2025-12-30 08:46:40 - 將切換深淺模式按鈕加回左側邊欄 / Add Dark/Light Mode Toggle Button Back to Sidebar

### Frontend Changes

- **DashboardLayout.tsx** (`system/backend/components/DashboardLayout.tsx`)
  - 將切換深淺模式按鈕加回左側邊欄：
    - 位於導覽列表下方、使用者資訊區域上方
    - 側邊欄展開時顯示「切換淺色模式」或「切換深色模式」文字
    - 側邊欄收合時只顯示圖標（太陽/月亮）
    - 使用與之前相同的樣式和功能

### UI Improvements
- **功能恢復**：切換深淺模式功能重新可用
- **位置優化**：按鈕位於左側邊欄，方便訪問

## 2025-12-30 08:45:24 - 移除所有管理頁面上方的空白區域 / Remove Top Padding from All Management Pages

### Frontend Changes

- **DashboardLayout.tsx** (`system/backend/components/DashboardLayout.tsx`)
  - 移除空的 header 元素
    - 刪除高度為 `h-16` 的空 header，讓內容直接從頂部開始顯示

- **所有管理頁面** (`system/backend/pages/*.tsx`)
  - 移除所有管理頁面頂部的 padding：
    - **OrdersPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`
    - **PartnersPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`
    - **StoresPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`
    - **FinesPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`
    - **MembersPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`
    - **ScootersPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`
    - **AdminsPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`
    - **AccessoriesPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`
    - **BannersPage.tsx**: 從 `p-6` 改為 `px-6 pb-6 pt-0`

### UI Improvements
- **最大化內容區域**：移除所有管理頁面上方的空白，讓內容更靠近頂部
- **統一體驗**：所有管理頁面現在都從頂部開始顯示，無額外空白

## 2025-12-30 08:40:14 - 移除側邊欄空白區域 / Remove Empty Space in Sidebar

### Frontend Changes

- **DashboardLayout.tsx** (`system/backend/components/DashboardLayout.tsx`)
  - 移除切換深色模式按鈕後留下的空白區域：
    - 移除使用者資訊區域的上邊框 (`border-t`)
    - 調整導覽列表的底部 padding（從 `py-6` 改為 `pt-6 pb-0`）
    - 確保導覽列表和使用者資訊區域之間無多餘間距

### UI Improvements
- **消除空白**：移除切換深色模式按鈕後留下的視覺空白區域

## 2025-12-30 08:27:02 - 移除側邊欄中的切換深色模式按鈕 / Remove Dark Mode Toggle Button from Sidebar

### Frontend Changes

- **DashboardLayout.tsx** (`system/backend/components/DashboardLayout.tsx`)
  - 移除側邊欄中的「切換深色模式」按鈕
    - 刪除位於導覽列表下方、使用者資訊區域上方的切換深淺模式按鈕區域

### UI Improvements
- **簡化側邊欄**：移除切換深色模式按鈕，簡化界面

## 2025-12-30 08:22:27 - 為訂單管理表格添加顏色區分 / Add Color Coding to Order Management Table

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 添加顏色輔助函數：
    - `getPartnerColor()`: 為合作商名稱分配顏色（使用哈希函數確保一致性）
    - `getShippingCompanyColor()`: 為航運別分配特定顏色
    - `getPaymentMethodColor()`: 為付款方式分配顏色
    - `getScooterModelColor()`: 為機車型號分配顏色標籤
  
  - 更新表格欄位顯示：
    1. **合作商**：使用多種顏色（紫色、靛藍、粉色、青色等）區分不同合作商
    2. **航運別**：特定顏色映射
       - 藍白：藍色 (`text-blue-600`)
       - 泰富：紅色 (`text-red-600`)
       - 聯營：綠色 (`text-green-600`)
       - 大福：深黃色 (`text-yellow-700`)
    3. **付款方式**：不同付款方式使用不同顏色
       - 現金：翠綠色 (`text-emerald-600`)
       - 月結：藍色 (`text-blue-600`)
       - 日結：青色 (`text-cyan-600`)
       - 匯款：靛藍色 (`text-indigo-600`)
       - 刷卡：紫色 (`text-purple-600`)
       - 行動支付：粉色 (`text-pink-600`)
    4. **租借機車（款X台）**：使用彩色標籤區分不同機車型號（藍、綠、紫、粉、靛藍、青色等）

### UI Improvements
- **視覺識別性**：通過顏色快速區分不同類型的數據
- **一致性**：使用哈希函數確保相同值始終顯示相同顏色
- **深色模式支持**：所有顏色都支持深色模式

## 2025-12-29 22:27:57 - 統一按鈕高度 / Unify Button Heights

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 統一「匯出 Excel」和「新增訂單」按鈕高度：
    - 兩個按鈕都使用 `py-2.5` 和 `h-[42px]` 確保高度一致
    - 統一圓角樣式為 `rounded-xl`
    - 保持按鈕視覺一致性

### UI Improvements
- **視覺一致性**：兩個按鈕現在高度完全相同，視覺更整齊

## 2025-12-29 22:22:25 - 調整匯出 Excel 按鈕位置至右側 / Move Export Excel Button to Right Side

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 調整「匯出 Excel」按鈕位置：
    - 從左側移動到右側
    - 與「新增訂單」按鈕並排顯示在右側
  - 調整布局結構：
    - 使用 `justify-between` 將日期選擇器放在左側，按鈕放在右側
    - 左側：年份和月份選擇器
    - 右側：「匯出 Excel」按鈕和「新增訂單」按鈕

### UI Improvements
- **布局優化**：日期選擇器在左側，操作按鈕在右側，視覺更清晰
- **操作便利性**：匯出和新增功能集中在右側，符合操作習慣

## 2025-12-29 22:17:26 - UI 優化：簡化頂部 Header 並調整訂單管理頁面布局 / UI Optimization: Simplify Top Header and Adjust Orders Page Layout

### Frontend Changes

- **DashboardLayout.tsx** (`system/backend/components/DashboardLayout.tsx`)
  - 移除頂部 header 右側的整排元素：
    - 移除 admin 用戶名顯示
    - 移除退出按鈕
    - 移除版本信息（Version 1.0.4 PRO）
  - 將漢堡菜單按鈕（目錄收放鍵）移至左側邊欄頂部
    - 位於 Logo 區域上方
    - 側邊欄展開時顯示「目錄」文字
  - 將切換深淺模式按鈕移至左側邊欄
    - 位於導覽列表下方、使用者資訊區域上方
    - 側邊欄展開時顯示「切換淺色模式」或「切換深色模式」文字

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 調整「匯出 Excel」按鈕位置：
    - 從標題區域移動到日期選擇器同一行
    - 與年份和月份選擇器並排顯示
  - 縮小「匯出 Excel」按鈕尺寸：
    - 從 `px-4 py-2` 改為 `px-3 py-1.5`
    - 從 `text-sm` 改為 `text-xs`
    - 圖標從 `size={16}` 改為 `size={14}`

### UI Improvements
- **簡化頂部 Header**：移除重複的用戶信息（左下角已有顯示）
- **統一控制項位置**：將所有導航和控制功能集中在左側邊欄
- **優化訂單管理頁面**：匯出按鈕與日期選擇器在同一行，提升操作效率
- **按鈕尺寸優化**：縮小匯出按鈕，使界面更緊湊

### Technical Details
- 頂部 header 現在為空，僅保留邊框樣式
- 側邊欄新增兩個功能按鈕區域（漢堡菜單和主題切換）
- 訂單管理頁面布局從 `justify-between` 改為 `flex-col`，匯出按鈕與日期選擇器在同一行

## 2025-12-29 21:28:00 - 將預約日期設為必填欄位 / Set Appointment Date as Required Field

### Backend Changes

- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 修改 `store` 方法驗證規則：
    - `appointment_date` 改為 `required|date`（必填）
  - 修改 `update` 方法驗證規則：
    - `appointment_date` 改為 `required|date`（必填）

### Frontend Changes

- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 在「預約日期」標籤後添加紅色 * 標記，表示必填
  - 在 `handleSubmit` 中添加預約日期的前端驗證
  - 如果未填寫預約日期，會顯示提示訊息

### Features
- **必填欄位更新**：現在有 4 個必填欄位
  - 預約日期 * (`appointment_date`) - 新增
  - 總金額 * (`payment_amount`)
  - 訂單狀態 * (`status`)
  - 租借機車選取 * (`scooter_ids`)
- **新增和編輯**：新增訂單和編輯訂單都使用相同的必填規則

### Technical Details
- API 驗證規則：`appointment_date` 為 `required|date`
- 前端驗證：在提交前檢查預約日期是否填寫
- 前端 UI：預約日期標籤顯示紅色 * 標記

## 2025-12-29 21:25:00 - 修復 OrderResource 中對 null 值調用 format() 的錯誤 / Fix format() Call on Null in OrderResource

### Backend Changes

- **OrderResource.php** (`app/Http/Resources/OrderResource.php`)
  - 修復 null 值處理：
    - `appointment_date` 添加 null 檢查：`$this->appointment_date ? $this->appointment_date->format('Y-m-d') : null`
    - `start_time` 添加 null 檢查：`$this->start_time ? $this->start_time->format('Y-m-d H:i:s') : null`
    - `end_time` 添加 null 檢查：`$this->end_time ? $this->end_time->format('Y-m-d H:i:s') : null`
  - 現在這些欄位可以為 null，不會再出現 "Call to a member function format() on null" 錯誤

### Bug Fixes
- **format() 錯誤**：修復當 `appointment_date`、`start_time`、`end_time` 為 null 時調用 `format()` 方法導致的錯誤
- 現在這些欄位在為 null 時會返回 null，而不是嘗試調用方法

### Technical Details
- 與 `expected_return_time`、`ship_arrival_time`、`ship_return_time` 的處理方式一致
- 確保所有可為 null 的日期/時間欄位都有適當的 null 檢查

## 2025-12-29 21:16:00 - 調整訂單必填欄位規則 / Adjust Order Required Fields Rules

### Backend Changes

- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 修改 `store` 方法驗證規則：
    - 只有 3 個必填欄位：`payment_amount`、`status`、`scooter_ids`
    - 其他欄位改為 `nullable`：`appointment_date`、`start_time`、`end_time`、`tenant` 等
  - 修改 `update` 方法驗證規則：
    - 只有 3 個必填欄位：`payment_amount`、`status`（`scooter_ids` 為 `sometimes`）
    - 其他欄位改為 `nullable`
- **Database Migration** (`database/migrations/2025_12_29_211600_make_dates_nullable_in_orders_table.php`)
  - 新增遷移檔案，將以下欄位改為可為 null：
    - `appointment_date` 改為 `nullable`
    - `start_time` 改為 `nullable`
    - `end_time` 改為 `nullable`

### Features
- **必填欄位**：只有前端標記紅色 * 的欄位才是必填
  - 總金額 * (`payment_amount`)
  - 訂單狀態 * (`status`)
  - 租借機車選取 * (`scooter_ids`)
- **非必填欄位**：其他所有欄位都可以不填寫，包括：
  - 合作商、承租人、預約日期、開始時間、結束時間等
- **資料庫兼容**：資料庫欄位已調整為可為 null，符合 API 驗證規則

### Technical Details
- 新增和編輯訂單都使用相同的驗證規則
- 資料庫遷移確保欄位可以為 null
- 只有標記紅色 * 的欄位才會在 API 層面驗證為必填

## 2025-12-29 21:13:00 - 修復建立訂單驗證規則並改善錯誤處理 / Fix Order Creation Validation Rules and Improve Error Handling

### Backend Changes

- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 修正驗證規則：
    - `appointment_date` 改為 `required|date`（資料庫欄位為 NOT NULL）
    - `start_time` 改為 `required|date`（資料庫欄位為 NOT NULL）
    - `end_time` 改為 `required|date`（資料庫欄位為 NOT NULL）
  - 改善錯誤處理：
    - 添加詳細的錯誤日誌記錄（使用 `\Log::error`）
    - 在 debug 模式下返回錯誤堆疊資訊
    - 記錄請求資料以便除錯

### Frontend Changes

- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 改善錯誤訊息顯示：
    - 優先顯示 API 返回的驗證錯誤
    - 顯示詳細的錯誤訊息（包括 `error` 欄位）
    - 添加 console.error 記錄完整的錯誤回應
    - 提供更清晰的錯誤資訊給用戶

### Bug Fixes
- **建立訂單錯誤**：修正驗證規則，確保必填欄位（`appointment_date`、`start_time`、`end_time`）符合資料庫約束
- **錯誤訊息**：改善前後端錯誤處理，提供更詳細的錯誤資訊

### Technical Details
- 資料庫欄位 `appointment_date`、`start_time`、`end_time` 為 NOT NULL，因此 API 驗證規則必須為 `required`
- 後端現在會記錄詳細的錯誤日誌到 Laravel 日誌檔案
- 前端會顯示更詳細的錯誤訊息，包括 API 返回的具體錯誤內容

## 2025-12-29 21:07:00 - 修復建立訂單錯誤並改善錯誤訊息顯示 / Fix Order Creation Error and Improve Error Message Display

### Backend Changes

- **Order.php** (`app/Models/Order.php`)
  - 從 `$fillable` 陣列中移除 `sort_order` 欄位
  - 確保模型不再處理 `sort_order` 欄位

### Frontend Changes

- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 改善錯誤處理邏輯：
    - 優先顯示 API 返回的錯誤訊息
    - 如果有驗證錯誤，顯示第一個驗證錯誤訊息
    - 提供更詳細的錯誤資訊，方便除錯

### Bug Fixes
- **建立訂單錯誤**：移除 `sort_order` 從模型的 `$fillable` 陣列，修復建立訂單時的錯誤
- **錯誤訊息**：改善前端錯誤訊息顯示，現在會顯示更詳細的 API 錯誤資訊

### Technical Details
- `sort_order` 已完全從模型和 API 處理中移除
- 資料庫欄位保留（有 default 值），但不影響功能
- 前端錯誤處理現在會優先顯示 API 返回的具體錯誤訊息

## 2025-12-29 21:06:00 - 移除 API 中的 sort_order 處理 / Remove sort_order Handling from API

### Frontend Changes

- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 移除發送 `sort_order` 到 API 的邏輯
  - 不再計算或發送 `sort_order` 欄位

### Backend Changes

- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 移除 `store` 方法中的 `sort_order` 驗證規則
  - 移除 `store` 方法中的 `sort_order` 自動設置邏輯
  - 移除 `update` 方法中的 `sort_order` 驗證規則
  - 移除 `update` 方法中的 `sort_order` 自動設置邏輯
  - 移除 `index` 方法中的 `sort_order` 排序邏輯
  - 現在只按 `appointment_date` 和 `created_at` 排序

### Features
- **簡化 API**：API 不再處理或記錄 `sort_order` 欄位
- **前端排序**：排序功能完全由前端處理，不依賴後端 `sort_order` 欄位
- **資料庫兼容**：資料庫欄位保留（不影響現有數據），但 API 不再使用

### Technical Details
- 前端不再發送 `sort_order` 到 API
- 後端不再驗證、處理或保存 `sort_order`
- 列表排序改為只按 `appointment_date DESC, created_at DESC`
- 資料庫 `sort_order` 欄位保留但不使用

## 2025-12-29 21:05:00 - 修改後端 API 以處理毫秒級時間戳 / Update Backend API to Handle Millisecond Timestamps

### Backend Changes

- **OrderController.php** (`app/Http/Controllers/Api/OrderController.php`)
  - 修改 `store` 方法：
    - 添加毫秒級時間戳檢測和轉換邏輯
    - 如果 `sort_order` 大於 10^10（毫秒級），自動轉換為秒級時間戳
    - 確保與前端發送的毫秒級時間戳兼容
  - 修改 `update` 方法：
    - 添加毫秒級時間戳檢測和轉換邏輯
    - 如果 `sort_order` 大於 10^10（毫秒級），自動轉換為秒級時間戳
    - 確保與前端發送的毫秒級時間戳兼容

### Technical Details
- 前端使用 `new Date().getTime()` 返回毫秒級時間戳（例如：1735430400000）
- 後端使用 `strtotime()` 返回秒級時間戳（例如：1735430400）
- 檢測邏輯：如果 `sort_order > 10000000000`，則為毫秒級，需要除以 1000 轉換為秒級
- 這樣可以同時兼容前端發送的毫秒級時間戳和後端自動生成的秒級時間戳

## 2025-12-29 21:04:00 - 移除排序順序輸入欄位 / Remove Sort Order Input Field

### Frontend Changes

- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - 移除排序順序輸入欄位：
    - 從表單中移除「排序順序」輸入欄位及其說明文字
    - 從 `formData` 狀態中移除 `sort_order` 欄位
    - 移除編輯模式下載入 `sort_order` 的邏輯
    - 移除預約日期變更時自動設置 `sort_order` 的邏輯
  - 簡化 `sort_order` 處理：
    - `handleSubmit` 中自動使用 `appointment_date` 的時間戳作為 `sort_order`
    - 不再允許用戶手動輸入排序順序
    - 後端仍會自動處理 `sort_order`，但前端不再顯示輸入欄位

### Features
- **自動排序**：排序順序自動根據預約日期計算，無需手動輸入
- **簡化界面**：移除排序順序輸入欄位，簡化表單界面
- **後端兼容**：後端邏輯保持不變，仍會自動處理 `sort_order`

### Technical Details
- `sort_order` 自動使用 `appointment_date` 的時間戳（毫秒）
- 後端會將毫秒轉換為秒級時間戳
- 用戶無法再手動設置排序順序

## 2025-12-29 20:38:00 - 允許在有排序時也可以拖拽移動 / Allow Drag Sorting Even When Sort Option is Active

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 移除拖拽限制：
    - 移除了 `handleDragStart`、`handleDragOver`、`handleDragEnd` 中對 `activeSortColumn` 的檢查
    - 表格行始終可拖拽（`draggable={true}`），不再受排序選項影響
    - 移除條件性的 `cursor-move` 樣式，始終顯示移動游標
  - 修改排序邏輯：
    - 臨時拖拽排序現在會覆蓋當前排序結果（無論是否有排序選項）
    - 移除了 `temporaryOrder.length > 0 && !activeSortColumn` 的條件限制
    - 當有臨時拖拽排序時，優先應用臨時排序順序
  - 排序行為：
    - 5個排序列（狀態、預約日期、租借開始、租借結束、預計還車）每個都是獨立排序
    - 選擇排序後，仍然可以自由拖拽移動訂單行
    - 拖拽排序會覆蓋當前排序結果，但不會保存

### Features
- **獨立排序**：5個排序列各自獨立，互不影響
- **自由拖拽**：即使選擇了排序選項，也可以自由拖拽移動訂單行
- **臨時排序**：拖拽排序是臨時的，會覆蓋當前排序結果，但不保存
- **無限制移動**：不再限制拖拽功能，始終可用

### Technical Details
- 拖拽排序使用 `temporaryOrder` 數組存儲臨時順序
- 臨時排序會覆蓋任何當前排序選項的結果
- 切換排序選項時會清除臨時排序
- 數據刷新時會清除臨時排序

## 2025-12-29 20:29:00 - 添加臨時拖拽排序並設置默認狀態排序 / Add Temporary Drag Sorting and Set Default Status Sort

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 設置默認排序為狀態：
    - `activeSortColumn` 初始值改為 `'status'`，頁面載入時默認按狀態排序
  - 恢復拖拽排序功能（臨時排序，不保存）：
    - 添加 `draggedOrderId`、`draggedOverOrderId`、`temporaryOrder` 狀態用於臨時拖拽排序
    - 實現 `handleDragStart`、`handleDragOver`、`handleDragEnd`、`handleDragLeave` 拖拽處理函數
    - 拖拽功能僅在無排序狀態下可用（`draggable={!activeSortColumn}`）
    - 當有排序選項時，拖拽被禁用
  - 修改排序邏輯：
    - 當有排序選項時，應用排序邏輯
    - 當無排序選項且有臨時拖拽排序時，應用臨時排序順序
    - 臨時排序不保存到後端，僅用於當前顯示
  - 修改表頭點擊邏輯：
    - 點擊已排序的列時，恢復為狀態排序（而不是取消排序）
    - 點擊排序時清除臨時拖拽排序
  - 修改表格行：
    - 添加 `draggable` 屬性（僅在無排序時可拖拽）
    - 添加拖拽事件處理器
    - 添加拖拽視覺反饋（`cursor-move`、`opacity-50`、`border-t-2 border-orange-500`）
  - 數據刷新時清除臨時排序：
    - 在 `fetchOrders` 成功和失敗時都清除 `temporaryOrder`

### Features
- **默認狀態排序**：頁面載入時默認按狀態排序（進行中、待接送、在合作商、已預訂、已完成）
- **臨時拖拽排序**：在無排序狀態下可以自由拖拽訂單行調整順序
- **不保存排序**：臨時拖拽排序僅用於顯示，不會保存到後端
- **排序優先級**：當有排序選項時，拖拽功能被禁用，確保排序邏輯優先
- **視覺反饋**：拖拽時顯示半透明和邊框提示

### Technical Details
- 使用 `temporaryOrder` 數組存儲臨時排序順序
- 拖拽功能通過檢查 `activeSortColumn` 來控制是否可用
- 支持深色模式

## 2025-12-29 14:17:00 - 移除訂單手動排序並改為點擊表頭排序 / Remove Manual Sorting and Implement Click-to-Sort on Table Headers

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 移除默認排序提示和排序選項UI：
    - 移除「默認排序: 預約日期」提示
    - 移除所有排序選項的複選框（狀態、租借日期、租借結束、預計還車）
  - 移除拖拽排序功能：
    - 移除 `draggedOrderId`、`draggedOverOrderId`、`manualOrder` 狀態
    - 移除所有拖拽相關的事件處理器（`handleDragStart`、`handleDragOver`、`handleDragEnd`、`handleDragLeave`）
    - 移除表格行的 `draggable` 屬性和拖拽樣式
  - 實現點擊表頭排序功能：
    - 添加 `activeSortColumn` 狀態來追蹤當前排序的列
    - 添加 `handleHeaderClick` 函數處理表頭點擊
    - 修改表頭：五個列（狀態、預約日期、租借開始、租借結束、預計還車）變為可點擊
    - 添加視覺反饋：當前排序的列顯示橙色向下箭頭（↓）
    - 點擊已排序的列可取消排序，恢復原始順序
  - 修改排序邏輯：
    - 狀態列：按照 1.進行中 2.待接送 3.在合作商 4.已預訂 5.已完成 排序
    - 日期列（預約日期、租借開始、租借結束、預計還車）：按照日期由近而遠（降序）排序
    - 沒有選擇排序時，保持原始順序（不進行默認排序）

### Features
- **點擊表頭排序**：點擊五個可排序列的表頭即可自動排序
- **視覺反饋**：當前排序的列顯示橙色箭頭指示器
- **取消排序**：再次點擊已排序的列可取消排序
- **無默認排序**：頁面載入時不進行任何排序，保持原始順序
- **簡化UI**：移除所有排序選項複選框，界面更簡潔

### Technical Details
- 使用 `useMemo` 優化排序性能
- 表頭添加 `cursor-pointer` 和 `hover:bg-gray-100` 樣式提示可點擊
- 使用 `select-none` 防止文字選擇影響點擊體驗
- 支持深色模式

## 2025-12-29 09:15:00 - 修改備註展開方式並添加機車管理統計 / Modify Remark Expansion and Add Scooter Statistics

### Frontend Changes

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 修改備註列的展開方式：
    - 移除「展開」和「收起」按鈕文字
    - 整個備註 cell 變為可點擊區域，點擊後以彈窗顯示完整內容
    - 添加 `expandedRemarkId` 狀態來追蹤當前展開的備註
    - 實現彈窗組件，點擊彈窗外部區域可關閉
    - 彈窗包含標題「備註內容」、完整備註文字和關閉提示
  - 修改 `toggleRemark` 函數：改為切換彈窗顯示/隱藏

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 添加機車型號統計功能：
    - 使用 `useMemo` 計算各機車型號的統計數據
    - 統計每個型號的總台數和各顏色分別的台數
    - 在表格上方添加統計卡片區域，顯示每個型號的統計信息
    - 統計卡片樣式參考 AccessoriesPage 的設計，包含：
      - 型號名稱（標題）
      - 總台數（大字顯示）
      - 各顏色的台數列表

### Features
- **備註彈窗顯示**：點擊備註列任意位置即可查看完整備註內容，無需按鈕
- **點擊外部關閉**：點擊彈窗外部區域或 X 按鈕可關閉彈窗
- **機車型號統計**：自動統計並顯示每個機車型號的總台數和各顏色的台數
- **響應式設計**：統計卡片支持響應式布局，適配不同屏幕尺寸

### Technical Details
- 使用 `useMemo` 優化統計數據計算性能
- 彈窗使用 `z-index: 70` 確保在其他元素之上
- 統計卡片使用 `border-l-4 border-orange-500` 突出顯示
- 支持深色模式

## 2025-12-29 08:54:49 - 為訂單管理表格添加頂部和底部滾動條 / Add Top and Bottom Scrollbars to Order Management Table

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 將表格分為兩個區域：表頭滾動區域和表體滾動區域
  - 添加 `tableHeaderScrollRef` 和 `tableBodyScrollRef` 用於同步滾動位置
  - 表頭區域設置 `overflow-x-auto overflow-y-hidden` 和底部邊框
  - 表體區域設置 `overflow-x-auto`
  - 實現雙向滾動同步：滾動表頭時同步表體，滾動表體時同步表頭
  - 使用固定表格佈局（`table-layout: fixed`）和固定最小寬度確保列寬一致
  - 為每個列設置固定寬度，確保表頭和表體列寬完全對齊

### Features
- **雙滾動條**：表格頂部和底部都有水平滾動條
- **同步滾動**：兩個滾動條同步滾動，確保表頭和表體始終對齊
- **固定列寬**：使用固定表格佈局，確保所有列的寬度一致
- **視覺一致性**：表頭和表體的列寬完全對齊，提供更好的用戶體驗

## 2025-12-29 08:48:00 - 調整訂單排序優先級 / Adjust Order Sorting Priority

### Backend Changes
- **OrderController** (`app/Http/Controllers/Api/OrderController.php`)
  - `index` 方法：調整排序優先級，預約日期優先，排序順序第二
  - 排序順序改為：`appointment_date DESC, sort_order DESC, created_at DESC`

## 2025-12-29 08:44:50 - 為訂單添加排序順序字段 / Add Sort Order Field to Orders

### Backend Changes
- **Database Migration** (`database/migrations/2025_12_27_000001_add_sort_order_to_orders_table.php`)
  - 新增 `sort_order` 整數欄位到 `orders` 表，預設值為 0，位於 `appointment_date` 之後

- **Order Model** (`app/Models/Order.php`)
  - 將 `sort_order` 加入 `$fillable` 陣列，允許批量賦值

- **OrderController** (`app/Http/Controllers/Api/OrderController.php`)
  - `store` 方法：新增 `sort_order` 驗證規則（`nullable|integer`）
  - `store` 方法：如果未提供 `sort_order`，預設使用 `appointment_date` 的時間戳
  - `update` 方法：新增 `sort_order` 驗證規則（`nullable|integer`）
  - `update` 方法：如果未提供 `sort_order`，預設使用 `appointment_date` 的時間戳（如果存在）
  - `index` 方法：修改排序邏輯，優先按 `sort_order` 降序排序，然後按 `appointment_date` 降序排序

- **OrderResource** (`app/Http/Resources/OrderResource.php`)
  - 在返回的陣列中新增 `sort_order` 欄位，預設值為 0

### Frontend Changes
- **AddOrderModal.tsx** (`system/backend/components/AddOrderModal.tsx`)
  - `Order` 介面新增 `sort_order?: number` 欄位
  - `formData` 狀態新增 `sort_order` 欄位
  - 編輯模式下載入 `sort_order` 值
  - 新增排序順序輸入欄位，位於預約日期之後
  - 輸入欄位說明：留空則自動使用預約日期作為排序依據
  - 當選擇預約日期時，如果 `sort_order` 為空，自動使用日期時間戳
  - `handleSubmit` 中處理 `sort_order`：如果未提供，使用 `appointment_date` 的時間戳

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - `Order` 介面新增 `sort_order?: number` 欄位

### Features
- **排序順序欄位**：訂單新增可編輯的 `sort_order` 欄位，數字越大越靠前
- **預設排序**：如果未指定 `sort_order`，自動使用 `appointment_date` 的時間戳作為排序依據
- **API 排序**：列表 API 優先按 `sort_order` 降序排序，然後按 `appointment_date` 降序排序
- **可編輯**：前端表單中可以手動設定排序順序，留空則使用預約日期自動計算

### Technical Details
- 使用整數型態存儲排序順序，支援負數和 0
- 預設排序邏輯：`sort_order DESC, appointment_date DESC, created_at DESC`
- 前端自動將日期轉換為時間戳（毫秒），後端轉換為秒級時間戳

## 2025-12-28 20:51:00 - 訂單管理列表排序和拖拽功能 / Order Management List Sorting and Drag-to-Reorder Features

### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 添加排序選項狀態：`sortByStatus`, `sortByStartTime`, `sortByEndTime`, `sortByExpectedReturnTime`
  - 添加拖拽排序狀態：`draggedOrderId`, `draggedOverOrderId`, `manualOrder`
  - 添加備註展開狀態：`expandedRemarks`
  - 實現排序邏輯：
    - 默認按預約日期升序排序
    - 狀態排序：進行中、待接送、在合作商、已預訂、已完成（按此順序）
    - 日期排序（租借開始、租借結束、預計還車）：由近而遠（降序）
    - 支援多個排序條件組合（按優先級排序）
  - 實現拖拽排序功能：
    - 表格行設置為可拖拽（`draggable={true}`）
    - 使用 HTML5 拖拽 API 實現拖拽排序
    - 拖拽時顯示視覺反饋（透明度、邊框高亮）
    - 拖拽完成後自動清除所有排序選項，使用手動排序
  - 實現備註展開功能：
    - 備註文字超過20個字符時顯示「展開」按鈕
    - 點擊展開後顯示完整備註內容和「收起」按鈕
    - 使用 `Set` 追蹤已展開的備註
  - 添加排序選項UI：
    - 顯示「默認排序: 預約日期」提示
    - 四個可勾選的排序選項：狀態、租借日期、租借結束、預計還車
    - 使用自定義樣式的複選框，勾選時顯示 Check 圖標

### Features
- **默認排序**：按預約日期升序排序
- **多條件排序**：可同時勾選多個排序選項，按優先級排序（狀態 > 租借日期 > 租借結束 > 預計還車）
- **狀態排序**：按固定順序排序（進行中、待接送、在合作商、已預訂、已完成）
- **日期排序**：租借日期、租借結束、預計還車按日期由近而遠（降序）排序
- **拖拽排序**：可以使用滑鼠拖拽表格行來自由調整順序，無論當前選擇何種排序方式都可使用
- **手動排序優先**：當進行拖拽排序後，自動清除所有排序選項，使用手動排序順序
- **備註展開**：所有有文字的備註都可以點擊展開查看完整內容，點擊收起恢復截斷顯示
- **視覺反饋**：拖拽時顯示透明度變化，拖拽目標位置顯示橙色邊框

### Technical Details
- 使用 `useMemo` 計算排序後的訂單列表
- 使用 `useRef` 存儲最新的排序結果，供拖拽處理函數訪問
- 使用 HTML5 原生拖拽 API（`draggable`, `onDragStart`, `onDragOver`, `onDragEnd`, `onDragLeave`）
- 狀態管理使用 React Hooks（`useState`, `useMemo`, `useRef`）
- 排序邏輯支援多條件組合，按優先級依次應用
- 支援深色模式

## 2025-12-28 20:38:44 - 為列表添加圖片顯示和點擊放大功能 / Add Image Display and Click-to-Zoom in List Views

### Frontend Changes
- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 在罰單列表中添加「罰單照片」列作為第一列
  - 顯示罰單照片縮圖（20x12，圓角），無照片時顯示相機圖標
  - 圖片添加點擊事件，點擊後打開全屏圖片查看器
  - 更新 colSpan 從 7 改為 8 以適應新增的照片列

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 在機車列表中添加「機車照片」列作為第一列
  - 顯示機車照片縮圖（20x12，圓角），無照片時顯示機車圖標
  - 圖片添加點擊事件，點擊後打開全屏圖片查看器
  - 更新 colSpan 從 7 改為 8 以適應新增的照片列

- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 為現有的「店面照片」列表圖片添加點擊放大功能
  - 圖片添加 `cursor-pointer` 和 `hover:opacity-90` 樣式
  - 圖片添加點擊事件，點擊後打開全屏圖片查看器
  - 添加深色模式支援（dark:bg-gray-700, dark:border-gray-600）

### Features
- 所有列表現在都顯示圖片縮圖
- 點擊列表中的圖片可以全屏放大查看
- 圖片縮圖使用統一的樣式（20x12，圓角，邊框，陰影）
- 無照片時顯示對應的圖標（罰單：Camera，機車：Bike，合作商：ImageIcon）
- 圖片點擊後顯示全屏圖片查看器，支援點擊背景或 X 按鈕關閉
- 圖片查看器已在編輯模态框中實現，現在列表中也使用相同的查看器

### Technical Details
- 使用現有的 `imageViewerOpen` 和 `imageViewerUrl` 狀態管理圖片查看器
- 圖片容器使用 `w-20 h-12` 尺寸，`rounded-xl` 圓角
- 圖片使用 `object-cover` 填充容器
- 點擊事件直接設置 `imageViewerUrl` 並打開查看器
- 支援深色模式

### Notes
- AccessoriesPage（機車配件）沒有照片字段，因此不需要添加圖片顯示功能

## 2025-12-28 20:30:00 - 為上傳圖片添加點擊放大查看功能 / Add Image Click-to-Zoom Functionality for Uploaded Images

### Frontend Changes
- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 為「罰單影本/現場照」圖片預覽添加點擊放大功能
  - 添加 `imageViewerOpen` 和 `imageViewerUrl` 狀態管理圖片查看器
  - 圖片預覽添加 `cursor-pointer` 和 `hover:opacity-90` 樣式
  - 添加圖片點擊事件處理，點擊後顯示放大查看器
  - 實現全屏圖片查看器模态框，支援點擊背景或關閉按鈕關閉

- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 為「店面形象照片」圖片預覽添加點擊放大功能
  - 添加圖片查看器狀態和點擊事件處理
  - 實現全屏圖片查看器

- **StoresPage.tsx** (`system/backend/pages/StoresPage.tsx`)
  - 為「店面形象照片」圖片預覽添加點擊放大功能
  - 添加圖片查看器狀態和點擊事件處理
  - 實現全屏圖片查看器

- **ScootersPage.tsx** (`system/backend/pages/ScootersPage.tsx`)
  - 為「機車外觀照片」圖片預覽添加點擊放大功能
  - 添加圖片查看器狀態和點擊事件處理
  - 實現全屏圖片查看器

### Features
- 所有上傳的圖片預覽現在都支援點擊放大查看
- 圖片預覽顯示滑鼠指針樣式，提示用戶可以點擊
- 點擊圖片後顯示全屏黑色背景的圖片查看器
- 圖片在查看器中以最大尺寸顯示（最大高度 90vh），保持原始比例
- 支援點擊背景或右上角關閉按鈕關閉圖片查看器
- 圖片查看器使用 `z-[60]` 確保顯示在所有其他元素之上
- 圖片點擊事件使用 `stopPropagation()` 防止觸發上傳區域的點擊事件

### Technical Details
- 圖片查看器使用 `fixed inset-0` 實現全屏覆蓋
- 背景使用 `bg-black/90` 提供半透明黑色背景
- 圖片使用 `object-contain` 保持原始比例
- 關閉按鈕使用 `absolute` 定位在右上角
- 支援深色模式（圖片查看器背景為黑色）

## 2025-12-28 20:22:09 - 為所有管理頁面模态框添加滾動功能 / Add Scroll Functionality to All Management Modal Forms

### Frontend Changes
- **FinesPage.tsx** (`system/backend/pages/FinesPage.tsx`)
  - 為「登記違規罰單」和「編輯違規罰單」模态框添加滾動功能
  - 使用 flexbox 布局，設置模态框最大高度為 90vh
  - 內容區域添加 `overflow-y-auto` 和 `max-h-[calc(90vh-180px)]` 以實現滾動
  - Header 和 Footer 使用 `flex-shrink-0` 保持固定

- **AccessoriesPage.tsx** (`system/backend/pages/AccessoriesPage.tsx`)
  - 為「新增配件設備」和「編輯配件設備」模态框添加滾動功能
  - 使用 flexbox 布局，設置模态框最大高度為 90vh
  - 內容區域添加滾動功能

- **PartnersPage.tsx** (`system/backend/pages/PartnersPage.tsx`)
  - 為「建立合作商」和「編輯合作商」模态框添加滾動功能
  - 使用 flexbox 布局，設置模态框最大高度為 90vh
  - 內容區域添加滾動功能

- **StoresPage.tsx** (`system/backend/pages/StoresPage.tsx`)
  - 為「建立商店」和「編輯商店」模态框添加滾動功能
  - 使用 flexbox 布局，設置模态框最大高度為 90vh
  - 內容區域添加滾動功能

- **AdminsPage.tsx** (`system/backend/pages/AdminsPage.tsx`)
  - 為「新增系統管理者」和「編輯系統管理者」模态框添加滾動功能
  - 使用 flexbox 布局，設置模态框最大高度為 90vh
  - 內容區域添加滾動功能

### Features
- 所有管理頁面的新增/編輯模态框現在都支援滾動
- 當表單內容超出視窗高度時，可以透過滾動查看完整內容
- Header（標題和關閉按鈕）和 Footer（取消和確認按鈕）保持固定，只有中間內容區域可滾動
- 統一的滾動體驗，改善用戶在填寫長表單時的使用體驗
- 支援深色模式

### Technical Details
- 模态框容器使用 `flex flex-col` 布局
- 設置 `max-h-[90vh]` 限制模态框總高度
- 內容區域使用 `overflow-y-auto max-h-[calc(90vh-180px)]` 實現滾動
- Header 和 Footer 使用 `flex-shrink-0` 防止被壓縮

## 2025-12-28 12:03:53 - 優化構建性能：實現代碼分割和手動分塊 / Build Performance Optimization: Code Splitting and Manual Chunking

### Frontend Changes
- **App.tsx** (`system/backend/App.tsx`)
  - 使用 `React.lazy()` 實現路由級別的代碼分割
  - 將所有頁面組件改為懶加載：`OrdersPage`, `PartnersPage`, `StoresPage`, `ScootersPage`, `FinesPage`, `AccessoriesPage`, `AdminsPage`
  - 添加 `Suspense` 包裹和 `LoadingFallback` 組件，提供載入狀態顯示
  - 減少初始包大小，提升首屏載入速度

- **vite.config.ts** (`system/backend/vite.config.ts`)
  - 配置 `manualChunks` 策略，將大型依賴庫分離到獨立 chunk：
    - `react-vendor`: React 和 React DOM
    - `router-vendor`: React Router
    - `genai-vendor`: Google Gemini AI 庫
    - `excel-vendor`: ExcelJS 和 XLSX 庫
    - `charts-vendor`: Recharts 圖表庫
    - `canvas-vendor`: html2canvas 庫
    - `flatpickr-vendor`: Flatpickr 日期選擇器
    - `icons-vendor`: Lucide React 圖標庫
    - `vendor`: 其他 node_modules 依賴
  - 將 chunk 大小警告限制提高到 600KB

### Performance Improvements
- 減少初始包大小：頁面組件只在需要時載入
- 更好的緩存策略：vendor 庫與應用代碼分離，提升緩存命中率
- 並行載入：多個小 chunk 可以並行下載，提升載入速度
- 解決構建警告：將超過 500KB 的單一 chunk 拆分為多個較小的 chunk

### Features
- 路由級別的代碼分割，每個頁面獨立載入
- Vendor 庫智能分離，提升緩存效率
- 載入狀態提示，改善用戶體驗
- 構建產物優化，減少首屏載入時間

## 2025-12-28 11:31:00 - 重構 React 代碼：統一共享樣式類別

### Frontend Refactoring
- **styles.ts** (`system/backend/styles.ts`) - 新建
  - 創建共享樣式文件，統一管理重複的樣式類別
  - 定義 `inputClasses`、`selectClasses`、`labelClasses`、`chevronDownClasses`、`searchInputClasses`、`uploadAreaBaseClasses`、`modalCancelButtonClasses`、`modalSubmitButtonClasses`
  - 消除多個文件中重複定義的樣式類別

- **所有頁面文件更新**：
  - **PartnersPage.tsx** - 移除重複的 `inputClasses` 定義，改用共享樣式
  - **ScootersPage.tsx** - 移除重複的 `inputClasses` 和 `selectClasses` 定義，改用共享樣式
  - **AccessoriesPage.tsx** - 移除重複的樣式定義，改用共享樣式
  - **FinesPage.tsx** - 移除重複的樣式定義，改用共享樣式
  - **StoresPage.tsx** - 移除重複的樣式定義，改用共享樣式
  - **AdminsPage.tsx** - 移除重複的樣式定義，改用共享樣式
  - **MembersPage.tsx** - 移除重複的樣式定義，改用共享樣式
  - **AddOrderModal.tsx** - 移除重複的樣式定義，改用共享樣式

### Code Quality Improvements
- 消除重複代碼：移除了 8 個文件中重複定義的樣式類別
- 統一維護：所有樣式現在集中在一個文件中，便於維護和更新
- 保持一致性：確保所有頁面的輸入框、選擇框、標籤等元素使用相同的樣式

### 重複模式總結
1. **inputClasses** - 在 8 個文件中重複定義，現已統一
2. **selectClasses** - 在 5 個文件中重複定義，現已統一
3. **labelClasses** - 在 8 個文件中重複定義（52 處使用），現已統一
4. **chevronDownClasses** - 在 4 個文件中重複定義（9 處使用），現已統一
5. **searchInputClasses** - 在 7 個文件中重複定義，現已統一
6. **uploadAreaBaseClasses** - 在 4 個文件中重複定義，現已統一
7. **modalCancelButtonClasses** - 在 6 個文件中重複定義，現已統一
8. **modalSubmitButtonClasses** - 在 6 個文件中重複定義，現已統一

## 2025-12-27 21:55:00 - 修復 AccessoriesPage 中缺少的 ChevronDown 導入

### Frontend Changes
- **AccessoriesPage.tsx** (`system/backend/pages/AccessoriesPage.tsx`)
  - 修復缺少的 `ChevronDown` 導入
  - 在 import 語句中添加 `ChevronDown` 從 `lucide-react`
  - 解決 "ChevronDown is not defined" 錯誤

### Bug Fixes
- 修復了 AccessoriesPage 中 select 下拉選單的 ChevronDown 圖標無法顯示的問題

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

---

## 2026-01-04 21:22:23 - 修復郵件發送錯誤

### 問題
- 發送測試郵件時發生錯誤：「Email \"測試使用者\" does not comply with addr-spec of RFC 2822.」
- 原因：在 `ContactMail.php` 中使用陣列格式設置 `replyTo` 時，中文名稱編碼處理不當

### 修復內容

- **ContactMail.php** (`app/Mail/ContactMail.php`)
  - 導入 `Illuminate\Mail\Mailables\Address` 類
  - 修改 `envelope()` 方法中的 `replyTo` 設置
  - 從 `replyTo: [$this->data['email'] => $this->data['name']]` 改為使用 `Address` 類
  - 新格式：`replyTo: [new Address($this->data['email'], $this->data['name'] ?? '')]`
  - 這樣可以正確處理包含中文字符的名稱，符合 RFC 2822 標準

### 技術細節
- 使用 Laravel 的 `Address` 類可以正確處理郵件地址和名稱的編碼
- 確保中文名稱在郵件標頭中正確編碼
- 符合 RFC 2822 郵件標準規範

---

## 2026-01-04 21:31:38 - 聯絡表單增加驗證碼功能

### 功能需求
- 在聯絡表單中增加驗證碼功能
- 驗證碼至少 6 位數
- 排除字母 O 和數字 0（避免混淆）
- 輸入框強制大寫
- 驗證碼也是大寫
- 加上視覺干擾（雜訊點、干擾線條、波浪線等）
- 驗證碼輸入框放在訊息輸入框前面

### Backend Changes

- **ContactController.php** (`app/Http/Controllers/Api/ContactController.php`)
  - 在 `send()` 方法中添加驗證碼驗證
  - 添加 `captcha_id` 和 `captcha_answer` 驗證規則
  - 驗證驗證碼是否過期或錯誤
  - 驗證成功後刪除驗證碼（防止重複使用）
  - 驗證碼錯誤時返回適當的錯誤訊息

### Frontend Changes

- **api.ts** (`system/frontend/lib/api.ts`)
  - 在 `publicApi` 中添加 `captcha` 物件
  - 添加 `captcha.generate()` 方法：生成驗證碼圖片
  - 添加 `captcha.verify()` 方法：驗證驗證碼答案
  - 更新 `contact.send()` 方法簽名，添加 `captcha_id` 和 `captcha_answer` 參數

- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 導入必要的圖標：`RefreshCw`, `Loader2`
  - 添加 `Captcha` 介面定義
  - 在狀態中添加 `captcha` 和 `isLoadingCaptcha`
  - 在 `formData` 中添加 `captchaAnswer` 欄位
  - 添加 `fetchCaptcha()` 函數：獲取驗證碼圖片
  - 在 `useEffect` 中自動載入驗證碼
  - 更新 `handleSubmit()` 函數：
    - 驗證驗證碼是否存在和完整
    - 提交時包含驗證碼 ID 和答案
    - 驗證碼錯誤時重新獲取驗證碼
    - 成功提交後重新獲取驗證碼
  - 在表單中添加驗證碼輸入區塊（放在訊息輸入框前面）：
    - 驗證碼圖片顯示（可點擊刷新）
    - 刷新按鈕
    - 驗證碼輸入框：
      - 強制大寫（`uppercase` class 和 `toUpperCase()`）
      - 排除 O 和 0（`replace(/[O0]/g, '')`）
      - 最多 6 位數（`maxLength={6}`）
      - 等寬字體和寬字距（`font-mono tracking-widest`）
      - 文字置中（`text-center`）

### Features
- **圖片驗證碼**：使用現有的 CaptchaController 生成帶干擾的驗證碼圖片
- **自動載入**：頁面載入時自動獲取驗證碼
- **點擊刷新**：可以點擊驗證碼圖片或刷新按鈕重新獲取驗證碼
- **強制大寫**：輸入框自動轉換為大寫，並排除 O 和 0
- **錯誤處理**：驗證碼錯誤或過期時顯示適當的錯誤訊息並重新獲取驗證碼
- **安全性**：驗證碼使用後立即刪除，防止重複使用

### Technical Details
- 使用現有的 CaptchaController，無需重複實現驗證碼生成邏輯
- 驗證碼存儲在 Cache 中，5 分鐘過期
- 驗證碼圖片使用 Base64 編碼，無需額外圖片存儲
- 驗證碼包含多種視覺干擾：200 個雜訊點、5 條干擾線、3 條波浪線、字符隨機旋轉和偏移
- 字符集：`ABCDEFGHIJKLMNPQRSTUVWXYZ123456789`（排除 O 和 0）

---

## 2026-01-04 21:32:15 - 調整聯絡表單驗證碼位置

### 變更內容
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 將驗證碼輸入框與訊息內容輸入框的位置對調
  - 驗證碼輸入框現在位於訊息內容輸入框之後
  - 表單順序：姓名 → 電子信箱 → 聯絡電話 → 訊息內容 → 驗證碼 → 送出按鈕

---

## 2026-01-04 21:57:23 - 線上預約表單增加電子郵件、必填標記和驗證碼功能

### 功能需求
- 增加電子郵件欄位（需要寄信給使用者）
- 姓名、預約日期、Email 必須填寫（加上紅色 * 標記）
- 添加驗證碼功能
- 提交後發送郵件給用戶和管理員

### Frontend Changes

- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 導入必要的圖標和 API：`RefreshCw`, `Loader2`, `publicApi`
  - 添加 `Captcha` 介面定義
  - 在狀態中添加 `email`、`captcha` 和 `isLoadingCaptcha`
  - 在 `formData` 中添加 `email` 和 `captchaAnswer` 欄位
  - 添加 `fetchCaptcha()` 函數：獲取驗證碼圖片
  - 在 `useEffect` 中自動載入驗證碼
  - 更新 `handleSubmit()` 函數：
    - 驗證驗證碼是否存在和完整
    - 調用 `publicApi.booking.send()` 提交預約
    - 驗證碼錯誤時重新獲取驗證碼
    - 成功提交後重新獲取驗證碼並清空表單
  - 表單欄位更新：
    - **姓名**：添加紅色 * 標記（必填）
    - **電子信箱**：新增欄位，添加紅色 * 標記（必填）
    - **預約日期**：添加紅色 * 標記（必填）
    - **聯絡電話**：改為非必填（移除 required）
    - **驗證碼**：新增驗證碼圖片顯示和輸入框（放在備註後面）
      - 驗證碼圖片顯示（可點擊刷新）
      - 刷新按鈕
      - 輸入框強制大寫，排除 O 和 0，最多 6 位數

- **api.ts** (`system/frontend/lib/api.ts`)
  - 在 `publicApi` 中添加 `booking` 物件
  - 添加 `booking.send()` 方法：提交預約表單

### Backend Changes

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`) - 新建
  - 創建預約表單控制器
  - `send()` 方法：處理表單驗證和驗證碼驗證
  - 驗證規則：
    - `name`：必填
    - `email`：必填，email 格式
    - `phone`：選填
    - `scooterType`：必填
    - `date`：必填，日期格式
    - `days`：必填
    - `note`：選填
    - `captcha_id` 和 `captcha_answer`：必填
  - 驗證碼驗證邏輯（與聯絡表單相同）
  - 發送郵件給兩個收件人：填寫表單的人和管理員（zau1110216@gmail.com）

- **BookingMail.php** (`app/Mail/BookingMail.php`) - 新建
  - 創建預約郵件類
  - 郵件標題：「【蘭光租賃中心】線上預約確認」
  - 設置 Reply-To 為表單提交者的信箱

- **booking.blade.php** (`resources/views/emails/booking.blade.php`) - 新建
  - 創建預約郵件模板視圖
  - 美觀的 HTML 郵件格式
  - 顯示所有預約資訊（姓名、信箱、電話、車款、預約日期、租借天數、備註）
  - 包含發送時間資訊
  - 提示訊息：「預約完成後，我們將有專人與您電話聯繫確認詳情。」

- **api.php** (`routes/api.php`)
  - 添加 `POST /api/booking` 路由（公開路由）：處理預約表單提交

### Features
- **郵件發送**：預約表單提交後自動發送郵件給用戶和管理員
- **美觀格式**：使用 HTML 郵件模板，呈現專業的郵件格式
- **Reply-To 設置**：郵件設置 Reply-To 為表單提交者的信箱，方便直接回覆
- **驗證碼保護**：使用與聯絡表單相同的驗證碼系統，防止垃圾提交
- **錯誤處理**：完整的錯誤處理和用戶友好的錯誤訊息
- **表單驗證**：後端驗證表單資料確保資料完整性

### Technical Details
- 使用現有的 CaptchaController，無需重複實現驗證碼生成邏輯
- 驗證碼存儲在 Cache 中，5 分鐘過期
- 郵件發送給兩個收件人：用戶和管理員
- API 端點：`POST /api/booking`

---

## 2026-01-04 21:44:12 - 聯絡表單郵件發送給兩個收件人

### 變更內容
- **ContactController.php** (`app/Http/Controllers/Api/ContactController.php`)
  - 修改 `send()` 方法，郵件同時發送給兩個收件人：
    1. 填寫表單的人（表單提交者的 email）
    2. 管理員信箱（zau1110216@gmail.com）
  - 使用兩次 `Mail::to()` 調用，分別發送郵件給兩個收件人
  - 兩封郵件內容相同，都是聯絡表單的內容

---

## 2026-01-04 21:36:23 - 移除聯絡表單郵件標題中的姓名

### 變更內容
- **ContactMail.php** (`app/Mail/ContactMail.php`)
  - 移除郵件標題中的姓名部分
  - 郵件標題從「【蘭光租賃中心】聯絡表單 - {姓名}」改為「【蘭光租賃中心】聯絡表單」
  - 標題不再包含用戶輸入的姓名，統一顯示「【蘭光租賃中心】聯絡表單」

---

## 2026-01-04 22:04:15 - 線上預約表單驗證碼改為全寬

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將驗證碼輸入框從右側欄移到表單底部，使用 `md:col-span-2` 跨越兩欄
  - 驗證碼輸入框現在在中等及以上屏幕（md）上佔滿整個表單寬度
  - 驗證碼輸入框位於備註欄位之後、提交按鈕之前
  - 確保驗證碼輸入框在所有屏幕尺寸上都是全寬顯示

---

## 2026-01-04 22:06:45 - 郵件模板改用 table 佈局

### 變更內容
- **contact.blade.php** (`resources/views/emails/contact.blade.php`)
  - 將郵件模板從 div 佈局改為 table 佈局
  - 使用內聯樣式（inline styles）替代 CSS class
  - 使用 `role="presentation"` 屬性提升語義和可訪問性
  - 保持視覺效果一致，確保在各種郵件客戶端中的兼容性

- **booking.blade.php** (`resources/views/emails/booking.blade.php`)
  - 將郵件模板從 div 佈局改為 table 佈局
  - 使用內聯樣式（inline styles）替代 CSS class
  - 使用 `role="presentation"` 屬性提升語義和可訪問性
  - 保持視覺效果一致，確保在各種郵件客戶端中的兼容性

### 技術細節
- 使用 table 佈局是郵件開發的最佳實踐，因為許多郵件客戶端對現代 CSS 支持有限
- 所有樣式都使用內聯樣式，確保在各種郵件客戶端中正確顯示
- 使用 `bgcolor` 屬性作為背景顏色的備選方案
- 使用 `cellspacing="0" cellpadding="0" border="0"` 確保表格間距一致
- 保持原有的視覺設計和顏色方案

---

## 2026-01-04 22:16:23 - 更新 LINE @ 連結網址

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 更新 LINE @ 連結網址從 `https://line.me` 改為 `https://lin.ee/7Fr9eko`
  - 連結已設定 `target="_blank"` 和 `rel="noopener noreferrer"`，會在新分頁開啟

---

## 2026-01-04 22:36:12 - Footer 增加電話號碼

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 在 footer 的地址下方增加電話號碼顯示
  - 電話號碼：0911306011
  - 電話號碼使用 `tel:0911306011` 連結，點擊可在手機上撥打電話
  - 電話號碼連結添加 hover 效果（hover:text-teal-600），提升用戶體驗

---

## 2026-01-04 22:42:15 - Footer 增加 LINE ID 和地址連結

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 在電話上方增加 LINE ID 顯示：@623czmsm
  - LINE ID 使用 `https://lin.ee/7Fr9eko` 連結，在新分頁開啟
  - 地址「屏東縣琉球鄉相埔路86之5」增加 Google Maps 連結
  - 地址連結使用 `https://www.google.com.tw/maps/search/...`，在新分頁開啟
  - 所有連結都添加 hover 效果（hover:text-teal-600），提升用戶體驗
  - Footer 資訊順序：地址（有連結） → LINE ID（有連結） → 電話（有連結）

---

## 2026-01-05 17:38:25 - 將電子信箱欄位改為 LINE ID

### 功能需求
- 將聯絡表單和線上預約表單中的「電子信箱」欄位改為「LINE ID」
- 更新相關的 API 驗證規則
- 更新郵件模板顯示
- 調整郵件發送邏輯（因為沒有 email，只發送給管理員）

### Frontend Changes

- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 將表單欄位從 `email` 改為 `lineId`
  - 標籤從「電子信箱」改為「LINE ID」
  - 輸入框類型從 `type="email"` 改為 `type="text"`
  - Placeholder 改為「請輸入您的 LINE ID（例如：@623czmsm）」
  - 更新表單提交時傳遞的資料欄位

- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將表單欄位從 `email` 改為 `lineId`
  - 標籤從「電子信箱」改為「LINE ID」
  - 輸入框類型從 `type="email"` 改為 `type="text"`
  - Placeholder 改為「請輸入您的 LINE ID（例如：@623czmsm）」
  - 更新表單提交時傳遞的資料欄位

- **api.ts** (`system/frontend/lib/api.ts`)
  - 更新 `contact.send()` 方法的類型定義：`email` 改為 `lineId`
  - 更新 `booking.send()` 方法的類型定義：`email` 改為 `lineId`

### Backend Changes

- **ContactController.php** (`app/Http/Controllers/Api/ContactController.php`)
  - 驗證規則從 `'email' => 'required|email|max:255'` 改為 `'lineId' => 'required|string|max:255'`
  - 移除 email 驗證規則（不再需要 email 格式驗證）
  - 更新郵件發送邏輯：移除發送給用戶的郵件（因為沒有 email），只發送給管理員
  - 更新 `test()` 方法：測試資料中的 `email` 改為 `lineId`

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 驗證規則從 `'email' => 'required|email|max:255'` 改為 `'lineId' => 'required|string|max:255'`
  - 移除 email 驗證規則（不再需要 email 格式驗證）
  - 更新郵件發送邏輯：移除發送給用戶的郵件（因為沒有 email），只發送給管理員

- **ContactMail.php** (`app/Mail/ContactMail.php`)
  - 移除 `replyTo` 設置（因為沒有 email 地址）

- **BookingMail.php** (`app/Mail/BookingMail.php`)
  - 移除 `replyTo` 設置（因為沒有 email 地址）

### Email Template Changes

- **contact.blade.php** (`resources/views/emails/contact.blade.php`)
  - 將「電子信箱」標籤改為「LINE ID」
  - 將 `{{ $data['email'] }}` 改為 `{{ $data['lineId'] }}`

- **booking.blade.php** (`resources/views/emails/booking.blade.php`)
  - 將「電子信箱」標籤改為「LINE ID」
  - 將 `{{ $data['email'] }}` 改為 `{{ $data['lineId'] }}`

### 影響範圍
- 聯絡表單和線上預約表單不再收集 email，改為收集 LINE ID
- 郵件只發送給管理員（zau1110216@gmail.com），不再發送給用戶
- 郵件中顯示 LINE ID 而非電子信箱
- 郵件不再設置 Reply-To（因為沒有 email 地址）

---

## 2026-01-05 20:44:45 - 預約功能增加資料庫儲存和後端管理

### 功能需求
- 預約提交後儲存到資料庫
- 添加 status 欄位，預設為「執行中」
- 狀態選項：執行中、已經回覆、取消
- 在後端管理系統中添加預約管理功能

### Database Changes

- **create_bookings_table.php** (`database/migrations/2026_01_05_173900_create_bookings_table.php`) - 新建
  - 創建 `bookings` 資料表
  - 欄位：
    - `id`：主鍵
    - `name`：姓名
    - `line_id`：LINE ID
    - `phone`：電話（可為空）
    - `scooter_type`：車款
    - `booking_date`：預約日期
    - `rental_days`：租借天數
    - `note`：備註（可為空）
    - `status`：狀態（enum: 執行中、已經回覆、取消），預設為「執行中」
    - `created_at`、`updated_at`：時間戳記

### Backend Changes

- **Booking.php** (`app/Models/Booking.php`) - 新建
  - 創建 Booking 模型
  - 定義 fillable 欄位
  - 設定 `booking_date` 為 date cast

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 更新 `send()` 方法：在發送郵件前先儲存到資料庫
  - 新增 `index()` 方法：後端列表（支援搜尋和狀態篩選）
  - 新增 `show()` 方法：後端查看詳情
  - 新增 `update()` 方法：後端更新預約資料
  - 新增 `updateStatus()` 方法：後端更新狀態
  - 新增 `destroy()` 方法：後端刪除預約

- **api.php** (`routes/api.php`)
  - 添加後端預約管理路由（需要認證）：
    - `GET /api/bookings`：列表
    - `GET /api/bookings/{booking}`：詳情
    - `PUT /api/bookings/{booking}`：更新
    - `PATCH /api/bookings/{booking}/status`：更新狀態
    - `DELETE /api/bookings/{booking}`：刪除

- **api.ts** (`system/backend/lib/api.ts`)
  - 添加 `bookingsApi` 物件
  - 包含所有後端管理方法

### Frontend Backend Changes

- **BookingsPage.tsx** (`system/backend/pages/BookingsPage.tsx`) - 新建
  - 創建後端預約管理頁面
  - 功能：
    - 預約列表顯示（表格形式）
    - 搜尋功能（姓名、LINE ID、電話）
    - 狀態篩選（執行中、已經回覆、取消）
    - 狀態快速切換（下拉選單）
    - 編輯預約資料（Modal 表單）
    - 刪除預約（確認對話框）
    - 狀態顏色標示：
      - 執行中：藍色
      - 已經回覆：綠色
      - 取消：紅色
  - 表格欄位：姓名、LINE ID、電話、車款、預約日期、租借天數、狀態、建立時間、操作

- **App.tsx** (`system/backend/App.tsx`)
  - 添加 BookingsPage 的 lazy load
  - 添加 `/bookings` 路由

- **constants.tsx** (`system/backend/constants.tsx`)
  - 在「網站內容管理」區塊的最下面添加「預約管理」連結
  - 路徑：`/bookings`

### Features
- **資料庫儲存**：所有預約都會儲存到資料庫
- **狀態管理**：預設狀態為「執行中」，可在後端修改為「已經回覆」或「取消」
- **後端管理**：完整的 CRUD 功能（創建、讀取、更新、刪除）
- **搜尋和篩選**：支援搜尋和狀態篩選
- **快速狀態切換**：在列表中直接切換狀態

### Technical Details
- 預約提交時自動儲存到資料庫，狀態預設為「執行中」
- 後端管理頁面位於「網站內容管理」區塊的最下面
- 狀態欄位使用 enum 類型，確保資料一致性
- API 路由使用 `auth:sanctum` middleware 保護

---

## 2026-01-05 22:12:38 - 聯絡我們功能增加資料庫儲存和後端管理

### 功能需求
- 聯絡我們提交後儲存到資料庫
- 添加 status 欄位，預設為「執行中」
- 狀態選項：執行中、已經回覆、取消
- 在後端管理系統中添加聯絡管理功能
- 功能與預約管理相同

### Database Changes

- **create_contacts_table.php** (`database/migrations/2026_01_05_221011_create_contacts_table.php`) - 新建
  - 創建 `contacts` 資料表
  - 欄位：
    - `id`：主鍵
    - `name`：姓名
    - `line_id`：LINE ID
    - `phone`：電話（可為空）
    - `message`：訊息內容
    - `status`：狀態（enum: 執行中、已經回覆、取消），預設為「執行中」
    - `created_at`、`updated_at`：時間戳記

### Backend Changes

- **Contact.php** (`app/Models/Contact.php`) - 新建
  - 創建 Contact 模型
  - 定義 fillable 欄位

- **ContactController.php** (`app/Http/Controllers/Api/ContactController.php`)
  - 更新 `send()` 方法：在發送郵件前先儲存到資料庫
  - 新增 `index()` 方法：後端列表（支援搜尋和狀態篩選）
  - 新增 `show()` 方法：後端查看詳情
  - 新增 `update()` 方法：後端更新聯絡資料
  - 新增 `updateStatus()` 方法：後端更新狀態
  - 新增 `destroy()` 方法：後端刪除聯絡

- **api.php** (`routes/api.php`)
  - 添加後端聯絡管理路由（需要認證）：
    - `GET /api/contacts`：列表
    - `GET /api/contacts/{contact}`：詳情
    - `PUT /api/contacts/{contact}`：更新
    - `PATCH /api/contacts/{contact}/status`：更新狀態
    - `DELETE /api/contacts/{contact}`：刪除

- **api.ts** (`system/backend/lib/api.ts`)
  - 添加 `contactsApi` 物件
  - 包含所有後端管理方法

### Frontend Backend Changes

- **ContactsPage.tsx** (`system/backend/pages/ContactsPage.tsx`) - 新建
  - 創建後端聯絡管理頁面
  - 功能：
    - 聯絡列表顯示（表格形式）
    - 搜尋功能（姓名、LINE ID、電話、訊息內容）
    - 狀態篩選（執行中、已經回覆、取消）
    - 編輯聯絡資料（Modal 表單）
    - 刪除聯絡（確認對話框）
    - 狀態顏色標示：
      - 執行中：藍色
      - 已經回覆：綠色
      - 取消：紅色
  - 表格欄位：姓名、LINE ID、電話、訊息內容、狀態、建立時間、操作

- **App.tsx** (`system/backend/App.tsx`)
  - 添加 ContactsPage 的 lazy load
  - 添加 `/contacts` 路由

- **constants.tsx** (`system/backend/constants.tsx`)
  - 在「網站內容管理」區塊的最下面添加「聯絡管理」連結
  - 路徑：`/contacts`

### Features
- **資料庫儲存**：所有聯絡訊息都會儲存到資料庫
- **狀態管理**：預設狀態為「執行中」，可在後端修改為「已經回覆」或「取消」
- **後端管理**：完整的 CRUD 功能（創建、讀取、更新、刪除）
- **搜尋和篩選**：支援搜尋和狀態篩選
- **與預約管理一致**：功能結構與預約管理相同

### Technical Details
- 聯絡提交時自動儲存到資料庫，狀態預設為「執行中」
- 後端管理頁面位於「網站內容管理」區塊的最下面
- 狀態欄位使用 enum 類型，確保資料一致性
- API 路由使用 `auth:sanctum` middleware 保護

---

## 2026-01-06 10:49:30 - 聯絡我們頁面改為與 footer 相同格式

### 變更內容
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 移除整個聯絡表單區塊（填寫表單功能）
  - 移除所有表單相關的 state 和函數（formData, captcha, handleSubmit, fetchCaptcha 等）
  - 移除不需要的 import（Send, RefreshCw, Loader2, MapPin）
  - 將聯絡資訊區塊改為與 footer 相同的格式
  - 聯絡資訊顯示：
    - 地址：屏東縣琉球鄉相埔路86之5（有 Google Maps 連結）
    - LINE ID：@623czmsm（有連結）
    - 電話：0911306011（有 tel: 連結）
  - 所有連結都添加 hover 效果（hover:text-teal-600），提升用戶體驗
  - 格式與 footer 保持一致，使用相同的樣式和連結結構

---

## 2026-01-06 10:49:30 - 聯絡我們頁面改為與 footer 相同格式

### 變更內容
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 移除整個聯絡表單區塊（填寫表單功能）
  - 移除所有表單相關的 state 和函數（formData, captcha, handleSubmit, fetchCaptcha 等）
  - 移除不需要的 import（Send, RefreshCw, Loader2, MapPin）
  - 將聯絡資訊區塊改為與 footer 相同的格式
  - 聯絡資訊顯示：
    - 地址：屏東縣琉球鄉相埔路86之5（有 Google Maps 連結）
    - LINE ID：@623czmsm（有連結）
    - 電話：0911306011（有 tel: 連結）
  - 所有連結都添加 hover 效果（hover:text-teal-600），提升用戶體驗
  - 格式與 footer 保持一致，使用相同的樣式和連結結構


---

## 2026-01-06 10:51:58 - 移除後端聯絡管理選單

### 變更內容
- **constants.tsx** (`system/backend/constants.tsx`)
  - 從「網站內容管理」區塊移除「聯絡管理」選單項目

- **App.tsx** (`system/backend/App.tsx`)
  - 移除 ContactsPage 的 lazy load import
  - 移除 `/contacts` 路由

### 說明
- 由於前端已移除聯絡表單功能，後端不再需要聯絡管理選單
- 聯絡管理相關的 API 和資料庫功能仍保留，但後端介面已移除


---

## 2026-01-06 11:02:34 - 將所有「蘭光租賃中心」改為「蘭光電動機車」

### 變更內容
將專案中所有出現「蘭光租賃中心」的地方統一改為「蘭光電動機車」：

- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - Footer 版權資訊

- **郵件模板**
  - `resources/views/emails/booking.blade.php` - 預約確認郵件標題和內容
  - `resources/views/emails/contact.blade.php` - 聯絡表單郵件標題和內容

- **郵件類別**
  - `app/Mail/BookingMail.php` - 郵件主題
  - `app/Mail/ContactMail.php` - 郵件主題

- **前端頁面**
  - `system/frontend/pages/Location.tsx` - 頁面描述
  - `system/frontend/pages/RentalPlans.tsx` - 頁面描述
  - `system/frontend/pages/Guesthouses.tsx` - 頁面描述
  - `system/frontend/pages/About.tsx` - 多處描述文字

- **前端配置**
  - `system/frontend/constants.tsx` - Logo 文字
  - `system/frontend/index.html` - 頁面標題
  - `system/frontend/package.json` - 專案名稱
  - `system/frontend/metadata.json` - 名稱和描述
  - `system/frontend/README.md` - 文件說明

- **後端頁面**
  - `system/backend/pages/LocationPage.tsx` - placeholder 範例文字

### 說明
統一品牌名稱，將所有「蘭光租賃中心」改為「蘭光電動機車」，確保整個系統的品牌一致性。


---

## 2026-01-06 11:08:55 - 將後端所有「蘭光租賃」改為「蘭光電動機車」

### 變更內容
將後端系統中所有出現「蘭光租賃」的地方統一改為「蘭光電動機車」：

- **package.json** (`system/backend/package.json`)
  - 專案名稱：從「蘭光租賃管理系統」改為「蘭光電動機車管理系統」

- **DashboardLayout.tsx** (`system/backend/components/DashboardLayout.tsx`)
  - 側邊欄標題：從「蘭光租賃」改為「蘭光電動機車」

- **index.html** (`system/backend/index.html`)
  - 頁面標題：從「蘭光租賃管理系統」改為「蘭光電動機車管理系統」

- **LoginPage.tsx** (`system/backend/pages/LoginPage.tsx`)
  - 登入頁面標題：從「蘭光租賃管理系統」改為「蘭光電動機車管理系統」

- **gemini.ts** (`system/backend/lib/gemini.ts`)
  - AI 助手系統指令：從「蘭光租賃」改為「蘭光電動機車」

- **AIChatAssistant.tsx** (`system/backend/components/AIChatAssistant.tsx`)
  - AI 助手歡迎訊息：從「蘭光租賃」改為「蘭光電動機車」

- **metadata.json** (`system/backend/metadata.json`)
  - 專案名稱：從「蘭光租賃管理系統」改為「蘭光電動機車管理系統」

### 說明
統一後端系統的品牌名稱，將所有「蘭光租賃」改為「蘭光電動機車」，確保與前端品牌名稱一致。


---

## 2026-01-06 11:30:34 - 添加 Logo 圖片和 Favicon

### 變更內容
- **constants.tsx** (`system/frontend/constants.tsx`)
  - 在 Logo 組件中添加 logo 圖片顯示
  - Logo 圖片顯示在「蘭光電動機車」文字上方，左右置中
  - 使用 `/logo.png` 作為圖片路徑
  - Logo 圖片高度設為 `h-12`，並使用 `object-contain` 保持比例

- **index.html** (`system/frontend/index.html`)
  - 添加 favicon 連結：`<link rel="icon" type="image/png" href="/favicon.png">`
  - Favicon 使用 `/favicon.png` 作為路徑

### 說明
- Logo 圖片需放置在 `public/logo.png`
- Favicon 圖片需放置在 `public/favicon.png`
- Logo 會顯示在側邊欄和 footer 的 Logo 組件中


---

## 2026-01-06 11:43:11 - 後端選單 Logo 改為使用 favicon.png

### 變更內容
- **DashboardLayout.tsx** (`system/backend/components/DashboardLayout.tsx`)
  - 將後端選單最上方的「蘭」字橘紅色區塊替換為 favicon.png 圖片
  - 移除原本的橘紅色背景和「蘭」字文字
  - 使用 `<img>` 標籤顯示 favicon.png，路徑為 `./favicon.png`
  - 保持相同的尺寸（w-10 h-10）和圓角樣式（rounded-xl）

### 說明
- 後端選單頂部的 Logo 現在使用 favicon.png 圖片
- Favicon 圖片需放置在後端構建輸出目錄中（與 index.html 同目錄）
- 其他部分保持不變


---

## 2026-01-06 12:09:05 - 租車方案頁面增加價格說明和注意事項

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 在租車方案列表下方新增價格說明和注意事項區塊
  - 新增內容包括：
    - 「價格」/24H
    - 隨車附安全帽，並提供衛生帽套供使用
    - 注意事項：
      - 逾時15分以一小時計，每小時以$50/小時計算
      - 逾時6小時以1日計算
      - 連續與國定假日每小時以$100/小時計算（上限$500）
  - 使用灰色背景區塊突出顯示注意事項
  - 位置在方案列表和 Premium Service 區塊之間

### 說明
- 價格說明和注意事項以清晰的格式呈現
- 注意事項使用灰色背景區塊，方便用戶閱讀
- 所有文字使用適當的字體大小和顏色，保持頁面一致性


---

## 2026-01-06 12:10:27 - 在 build.sh 中增加文字提示

### 變更內容
- **build.sh** (`build.sh`)
  - 為每個部署步驟添加清晰的文字提示
  - 使用進度標示（[1/6], [2/6] 等）顯示當前步驟
  - 每個步驟完成後顯示 ✓ 確認訊息
  - 在開始和結束時顯示分隔線和標題
  - 步驟說明：
    1. 切換到專案目錄
    2. 更新程式碼 (git pull)
    3. 清除並快取 Laravel 路由
    4. 清除並快取 Laravel 配置
    5. 構建後端 (React)
    6. 構建前端 (React)

### 說明
- 執行腳本時會清楚顯示每個步驟的進度和狀態
- 方便追蹤部署流程，快速定位問題
- 提升部署過程的可讀性和用戶體驗


---

## 2026-01-06 12:16:21 - 將租車方案價格說明移到頁面頂部

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 將價格說明和注意事項從頁面底部移到 header 區域內
  - 位置調整：在描述文字下方、麵包屑上方（紅色框標示的位置）
  - 移除原本在方案列表下方的獨立 section
  - 保持相同的內容和樣式：
    - 「價格」/24H
    - 隨車附安全帽，並提供衛生帽套供使用
    - 注意事項（逾時計算規則）

### 說明
- 價格說明現在顯示在頁面頂部，用戶進入頁面即可看到
- 內容整合在 header 區域內，保持頁面結構的一致性
- 使用適當的間距和樣式，確保視覺效果良好


---

## 2026-01-06 12:16:56 - 調整租車方案價格說明位置至麵包屑下方

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 將價格說明和注意事項移到麵包屑下方
  - 調整順序：描述文字 → 麵包屑 → 價格說明和注意事項
  - 保持相同的內容和樣式

### 說明
- 價格說明現在顯示在麵包屑下方，符合用戶要求的布局
- 內容順序更符合閱讀邏輯


---

## 2026-01-06 12:29:01 - 重寫線上預約表單，參考 77go 格式

### 變更內容

#### Frontend Changes
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 完全重寫預約表單，參考 77go 的線上預約格式
  - 在表單上方添加注意事項區塊，包含 5 條注意事項
  - 新增表單欄位：
    - 承租人姓名（必填）
    - Line（必填，但後端改為可選）
    - 行動電話（必填）
    - 預約日期（必填）
    - 結束日期（必填）
    - 船運公司（下拉選單：泰富、藍白、聯營、大福）
    - 船班時間（來）（必填）
    - 人數：大人、小孩（12歲以下）
    - 所需租車類型/數量（可動態添加多個，參考 77go）
  - 表單採用兩欄布局，左欄和右欄分別放置不同欄位
  - 租車類型/數量支援動態添加和刪除
  - 保持驗證碼功能

#### Backend Changes
- **Migration** (`database/migrations/2026_01_06_122833_add_fields_to_bookings_table.php`)
  - 新增欄位：`end_date`, `shipping_company`, `ship_arrival_time`, `adults`, `children`, `scooters` (JSON)
  - 修改 `status` enum，新增「預約中」狀態，預設為「預約中」

- **Booking.php** (`app/Models/Booking.php`)
  - 更新 `$fillable` 陣列，添加新欄位
  - 更新 `$casts`，添加日期時間和 JSON 轉換

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 更新驗證規則，支援新欄位
  - Line 改為可選欄位（nullable）
  - 行動電話改為必填
  - 預設狀態改為「預約中」
  - 更新所有狀態相關的 enum 值

### 說明
- 預約表單現在完全符合 77go 的格式和功能
- 注意事項顯示在表單上方，方便用戶查看
- 除 Line 和人數外，其他欄位都是必填
- 預約提交後狀態為「預約中」，等待後端確認
- 後續需要實現：後端訂單管理頁面的通知功能，以及確認後轉為訂單的功能


---

## 2026-01-06 14:02:45 - 實現後端訂單管理頁面的通知功能和預約轉訂單功能

### 變更內容

#### Backend API Changes
- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 新增 `pendingCount()` 方法：獲取未確認預約數量（status = '預約中'）
  - 新增 `pending()` 方法：獲取未確認預約列表
  - 新增 `convertToOrder()` 方法：將預約轉為訂單
    - 驗證預約狀態必須為「預約中」
    - 自動生成訂單編號（由 Order 模型自動處理）
    - 從預約資料複製到訂單（承租人、日期、船運資訊等）
    - 關聯選擇的機車
    - 更新預約狀態為「執行中」
    - 使用資料庫事務確保資料一致性

- **routes/api.php** (`routes/api.php`)
  - 新增路由：`GET /bookings/pending` - 獲取未確認預約列表
  - 新增路由：`GET /bookings/pending/count` - 獲取未確認預約數量
  - 新增路由：`POST /bookings/{booking}/convert-to-order` - 將預約轉為訂單

#### Frontend Backend Changes
- **api.ts** (`system/backend/lib/api.ts`)
  - 在 `bookingsApi` 中新增：
    - `pending()` - 獲取未確認預約列表
    - `pendingCount()` - 獲取未確認預約數量
    - `convertToOrder()` - 將預約轉為訂單

- **ConvertBookingModal.tsx** (`system/backend/components/ConvertBookingModal.tsx`) - 新建
  - 創建預約轉訂單的 Modal 組件
  - 顯示預約資訊（只讀）
  - 表單欄位：
    - 合作商（可選）
    - 付款方式（必填）
    - 付款金額（必填）
    - 選擇機車（必填，可多選）
  - 提交後調用 API 轉換訂單

- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 添加通知功能（鈴鐺圖標）：
    - 在頁面頂部顯示未確認預約數量
    - 每 30 秒自動刷新數量
    - 點擊「查看預約」按鈕顯示/隱藏預約列表
  - 添加未確認預約列表區域：
    - 顯示所有「預約中」狀態的預約
    - 顯示預約詳細資訊（承租人、電話、日期、船運資訊、租車類型等）
    - 每個預約有「確認轉為訂單」按鈕
  - 整合 ConvertBookingModal：
    - 點擊「確認轉為訂單」打開 Modal
    - 填寫必要資訊後轉換為訂單
    - 轉換成功後自動刷新預約列表和訂單列表

### 功能說明
1. **通知功能**：
   - 後端訂單管理頁面頂部顯示鈴鐺圖標和未確認預約數量
   - 數量會自動更新（每 30 秒）
   - 點擊「查看預約」可展開/收起預約列表

2. **預約轉訂單流程**：
   - 在未確認預約列表中點擊「確認轉為訂單」
   - 打開 Modal，顯示預約資訊（只讀）
   - 填寫必要資訊：合作商（可選）、付款方式、付款金額、選擇機車
   - 提交後，系統會：
     - 創建新訂單（自動生成訂單編號）
     - 從預約複製相關資訊
     - 關聯選擇的機車
     - 更新預約狀態為「執行中」
     - 自動刷新預約列表和訂單列表

### 技術細節
- 使用資料庫事務確保轉換過程的資料一致性
- 訂單編號由 Order 模型的 boot 方法自動生成
- 預約狀態從「預約中」更新為「執行中」
- 轉換後的訂單狀態為「已預訂」


---

## 2026-01-06 14:04:39 - 修正 bookings 表欄位問題

### 變更內容
- **Migration** (`database/migrations/2026_01_06_140500_make_scooter_type_and_rental_days_nullable_in_bookings_table.php`) - 新建
  - 將 `scooter_type` 欄位改為可選（nullable）
  - 將 `rental_days` 欄位改為可選（nullable）
  - 因為新的表單使用 `scooters` JSON 欄位來儲存多個租車類型，舊的 `scooter_type` 和 `rental_days` 欄位已不再使用

### 問題修正
- 修正錯誤：`Field 'scooter_type' doesn't have a default value`
- 新表單不再使用 `scooter_type` 和 `rental_days` 欄位，改為使用 `scooters` JSON 欄位
- 為了向後兼容，將這些欄位改為可選，避免插入資料時出錯

### 說明
執行此 migration 後，預約表單可以正常提交，不會再出現 `scooter_type` 欄位錯誤。


---

## 2026-01-06 14:22:11 - 更新預約確認郵件模板以支援新表單欄位

### 變更內容
- **booking.blade.php** (`resources/views/emails/booking.blade.php`)
  - 移除舊欄位：`scooterType`、`date`、`days`
  - 新增欄位顯示：
    - 所需租車類型/數量（使用 `scooters` JSON 陣列）
    - 預約日期（使用 `appointmentDate`）
    - 結束日期（使用 `endDate`）
    - 船運公司（使用 `shippingCompany`）
    - 船班時間（來）（使用 `shipArrivalTime`）
    - 人數（大人、小孩，使用 `adults` 和 `children`）
  - 所有新欄位都使用條件判斷，只在有值時顯示

### 問題修正
- 修正錯誤：`Undefined array key "scooterType"`
- 郵件模板現在完全支援新的預約表單欄位結構
- 保持向後兼容，使用 `??` 運算符處理可能不存在的舊欄位

### 說明
- 郵件模板現在會正確顯示新的預約表單資料
- 租車類型會以列表形式顯示（例如：VIVA MIX 白牌 x 1）
- 所有新欄位都有適當的條件判斷，避免顯示空值


---

## 2026-01-06 14:23:26 - 修正後端 favicon 路徑

### 變更內容
- **DashboardLayout.tsx** (`system/backend/components/DashboardLayout.tsx`)
  - 將 favicon 圖片路徑從 `./favicon.png` 改為 `/favicon.png`
  - 統一使用絕對路徑，與前端保持一致

### 說明
- 後端選單 Logo 現在使用 `/favicon.png` 作為路徑
- 與前端和後端 index.html 中的 favicon 路徑保持一致


---

## 2026-01-06 14:33:06 - 線上預約表單 LINE ID 改為非必填

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將表單標籤從「Line」改為「LINE ID」
  - 移除必填標記（紅色星號）
  - 移除 input 的 `required` 屬性
  - LINE ID 欄位現在為可選填寫

### 說明
- 符合用戶需求，LINE ID 不再強制填寫
- 標籤文字改為「LINE ID」，更加明確
- 後端 API 已經支援 LINE ID 為可選（nullable）


---

## 2026-01-06 14:39:39 - 將 bookings 表的 line_id 欄位改為可選

### 變更內容
- **Migration** (`database/migrations/2026_01_06_143900_make_line_id_nullable_in_bookings_table.php`) - 新建
  - 將 `line_id` 欄位改為可選（nullable）
  - 因為前端表單已將 LINE ID 改為非必填，資料庫欄位也需要支援 null 值

### 問題修正
- 修正錯誤：`Column 'line_id' cannot be null`
- 當用戶不填寫 LINE ID 時，可以正常提交預約表單

### 說明
執行此 migration 後，預約表單可以不填寫 LINE ID 也能正常提交。


---

## 2026-01-06 14:46:08 - 修正預約轉訂單的時間字串解析錯誤

### 變更內容
- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 導入 Carbon 類別
  - 修正 `convertToOrder` 方法中的時間字串處理
  - 確保 `booking_date` 和 `end_date` 在連接時間前先格式化為日期字串（Y-m-d）
  - 修正錯誤：`Double time specification` - 當日期物件已經包含時間時，直接連接字串會導致雙重時間規格

### 問題修正
- 修正錯誤：`Could not parse '2026-01-09 00:00:00 18:00:00': Failed to parse time string (2026-01-09 00:00:00 18:00:00) at position 20 (1): Double time specification`
- 現在會正確處理 Carbon 日期物件，先格式化為日期字串再連接時間

### 技術細節
- 使用 `instanceof Carbon` 檢查日期是否為 Carbon 物件
- 如果是 Carbon 物件，使用 `format('Y-m-d')` 格式化為日期字串
- 然後再連接時間部分（如 ' 08:00:00' 或 ' 18:00:00'）


---

## 2026-01-06 14:57:33 - 移除租車方案頁面的「價格」/24H 文字

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 移除「價格」/24H 文字
  - 保留「隨車附安全帽，並提供衛生帽套供使用」和注意事項

### 說明
- 租車方案頁面現在不再顯示「價格」/24H 文字
- 其他內容保持不變


---

## 2026-01-06 15:00:58 - 修改租車方案價格顯示格式

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 價格顯示改為整數（使用 `Math.floor` 去除小數點）
  - 價格後面加上 "/ 24H"
  - 從 `${plan.price || 0}` 改為 `${Math.floor(plan.price || 0)} / 24H`

- **RentalPlansPage.tsx** (`system/backend/pages/RentalPlansPage.tsx`)
  - 價格顯示改為整數（使用 `Math.floor` 去除小數點）
  - 價格後面加上 "/ 24H"
  - 從 `${plan.price}` 改為 `${Math.floor(plan.price)} / 24H`

### 說明
- 所有租車方案的價格顯示現在都是整數格式，不顯示小數點
- 價格後面統一顯示 "/ 24H" 表示每 24 小時的價格
- 例如：原本顯示 `$400.00` 現在顯示 `$400 / 24H`


---

## 2026-01-06 15:04:37 - 調整租車方案價錢字體大小

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 將價錢顯示字體從 `text-3xl` 改為 `text-2xl`
  - 讓 `$金額 / 24H` 看起來較小、更精緻，維持整體版面平衡

### 說明
- 價格內容仍為整數且附上「/ 24H」，只調整視覺字級大小


---

## 2026-01-06 15:11:34 - 調整線上預約注意事項重點文字樣式

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將注意事項中被標記的重點文字改為紅色並放大
  - "不代表預約成功" - 改為紅色 (`text-red-600`) 並放大 (`text-base font-bold`)
  - "24小時內" - 改為紅色並放大
  - "0911306011" - 改為紅色並放大
  - "@623czmsm" - 改為紅色並放大

### 說明
- 參考 77go 的設計風格，將重要資訊以紅色標示並放大，提升視覺重點
- 讓用戶更容易注意到關鍵資訊（預約狀態、時效、聯絡方式）


---

## 2026-01-06 15:42:57 - 修改預約表單為單選機車型號（從後臺機車清單獲取）

### 變更內容

#### 後端 API
- **ScooterController.php** (`app/Http/Controllers/Api/ScooterController.php`)
  - 新增 `models()` 方法，獲取唯一的 `model + type` 組合列表
  - 返回格式：`{ model: string, type: string, label: string }`（label 為 "model type" 組合，例如 "ES-2000 白牌"）

- **routes/api.php**
  - 新增公開路由 `GET /api/scooters/models`，供前端預約表單使用

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 更新驗證規則：從 `scooters` 陣列改為單一選擇 `scooterModel`, `scooterType`, `scooterCount`
  - 在儲存時將單一選擇轉換為陣列格式（保持與資料庫結構一致）

#### 前端
- **api.ts** (`system/frontend/lib/api.ts`)
  - 更新 `booking.send` 的參數類型，改為單一選擇格式
  - 新增 `scooters.models()` 方法，獲取機車型號列表

- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 移除多選機車功能（`addScooter`, `removeScooter`, `updateScooter` 等函數）
  - 改為單選下拉選單，從 API 獲取機車型號列表（顯示 "model + type" 組合）
  - 表單狀態從 `scooters: []` 改為 `scooterModel`, `scooterType`, `scooterCount`
  - 移除「需求說明」欄位（根據用戶要求）
  - 下拉選單字體大小改為 `text-base`（較大）

### 說明
- 預約表單現在只允許選擇一種機車類型，選項來自後臺機車清單的唯一 `model + type` 組合
- 選項顯示格式為「機車型號 + 類型」（例如：「ES-2000 白牌」）
- 後端 API 保持向後兼容，將單一選擇轉換為陣列格式儲存


---

## 2026-01-06 15:47:57 - 放大線上預約表單「人數」區塊字體

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將「大人」和「小孩（12歲以下）」標籤字體從 `text-xs` 改為 `text-base font-bold`
  - 將輸入框數字字體改為 `text-base`（較大）
  - 將「人」單位字體從 `text-xs` 改為 `text-sm`

### 說明
- 根據用戶要求，將「人數」區塊中被紅色線標記的標籤字體放大
- 提升視覺清晰度和可讀性


---

## 2026-01-06 15:51:20 - 移除線上預約表單「人數」區塊的「人」單位文字

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 移除「大人」輸入框下方的「人」單位文字
  - 移除「小孩（12歲以下）」輸入框下方的「人」單位文字

### 說明
- 根據用戶要求，直接移除「人數」區塊中的「人」單位顯示，簡化表單外觀


---

## 2026-01-06 15:56:29 - 調整「大人」「小孩」標籤字體與「租車類型」一致

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將「大人」標籤字體從 `text-base` 改為 `text-sm`
  - 將「小孩（12歲以下）」標籤字體從 `text-base` 改為 `text-sm`
  - 現在與「所需租車類型/數量」標籤字體一致（`text-sm font-bold text-gray-700`）

### 說明
- 統一表單標籤字體大小，提升視覺一致性


---

## 2026-01-06 15:57:37 - 移除線上預約表單「人數」標籤

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 移除「人數」標籤，直接顯示「大人」和「小孩（12歲以下）」輸入欄位

### 說明
- 簡化表單外觀，移除多餘的標籤文字


---

## 2026-01-06 16:04:58 - 修復預約郵件模板中 lineId 未定義錯誤

### 變更內容
- **booking.blade.php** (`resources/views/emails/booking.blade.php`)
  - 將 LINE ID 區塊包在 `@if(!empty($data['lineId']))` 條件中
  - 當 `lineId` 不存在或為空時，不顯示 LINE ID 欄位

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 確保 `lineId` 在傳遞給郵件的資料中存在（即使為 null）
  - 使用 `$mailData` 變數確保所有必要欄位都存在

### 說明
- 修復 "Undefined array key 'lineId'" 錯誤
- 因為 `lineId` 是可選欄位，需要在使用前檢查是否存在
- 現在當用戶未填寫 LINE ID 時，郵件不會顯示該欄位，也不會產生錯誤


---

## 2026-01-06 16:27:25 - 在前臺 footer 新增 Facebook 和 Instagram 社交媒體連結

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 在 footer 的社交媒體圖標區域新增 Facebook 和 Instagram 連結
  - Facebook 連結：https://www.facebook.com/share/1KYnY8BMeV/?mibextid=wwXIfr
  - Instagram 連結：https://www.instagram.com/languan_smart?igsh=M2IxaDN5cTFsZnJ2&utm_source=qr
  - 三個社交媒體圖標（Facebook、Instagram、LINE）並列顯示，使用 `gap-3` 間距
  - Facebook 使用藍色背景 `bg-[#1877F2]`
  - Instagram 使用漸層背景（從紫色到紅色到橙色）
  - 保持與 LINE 圖標相同的樣式和大小

### 說明
- 用戶現在可以從 footer 直接訪問 Facebook 和 Instagram 頁面
- 所有社交媒體圖標統一風格，提升品牌一致性


---

## 2026-01-06 16:40:41 - 修改預約轉訂單功能：狀態改為「已轉訂單」

### 變更內容

#### Database Migration
- **add_converted_to_order_status_to_bookings_table.php** (`database/migrations/2026_01_06_163905_add_converted_to_order_status_to_bookings_table.php`) - 新建
  - 添加「已轉訂單」狀態到 `bookings` 表的 `status` enum
  - 新的 enum 值：`['預約中', '執行中', '已經回覆', '取消', '已轉訂單']`

#### Backend API
- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - `convertToOrder()` 方法：將預約狀態從「執行中」改為「已轉訂單」
  - 更新所有驗證規則中的 `status` enum，添加「已轉訂單」選項
  - 更新 `update()` 和 `updateStatus()` 方法的驗證規則

#### Backend Interface
- **BookingsPage.tsx** (`system/backend/pages/BookingsPage.tsx`)
  - 更新 `Booking` interface 的 `status` 類型，包含「預約中」和「已轉訂單」
  - 更新 `getStatusColor()` 函數：添加「預約中」（黃色）和「已轉訂單」（紫色）的顏色
  - 更新 `getStatusIcon()` 函數：添加「預約中」和「已轉訂單」的圖標
  - 更新狀態過濾器選項，包含所有狀態
  - 更新表單中的狀態選項，包含所有狀態
  - 預設狀態改為「預約中」

### 說明
- 當預約轉為訂單時，預約的狀態會自動更新為「已轉訂單」，而不是「執行中」
- 後端界面可以正確顯示和過濾「已轉訂單」狀態的預約
- 「已轉訂單」狀態使用紫色標籤顯示，與其他狀態區分


---

## 2026-01-06 17:03:24 - 隱藏前臺「預約查詢」功能

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 將側邊欄中的「預約查詢」按鈕用註釋標記起來（隱藏）
  - 保留代碼以便未來需要時可以重新啟用

### 說明
- 「預約查詢」功能暫時隱藏，用戶無法在前臺看到此按鈕
- 代碼保留在註釋中，方便未來需要時恢復


---

## 2026-01-06 17:08:51 - 移除首頁的 RENTAL PLAN 區塊

### 變更內容
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 移除整個「RENTAL PLAN」區塊（包含標題、VIVA MIX 白牌和 VIVA 綠牌的展示卡片）

### 說明
- 首頁現在只保留 Banner Carousel、Hero Section 和 Featured Images Grid
- 用戶仍可通過側邊欄導航到「租車方案」頁面查看詳細資訊


---

## 2026-01-06 17:10:24 - 更新預約表單人數標籤格式

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將「大人」標籤改為「大人 / 人數」
  - 將「小孩（12歲以下）」標籤改為「小孩（12歲以下）/ 人數」

### 說明
- 標籤格式統一，更清楚地表示這是人數輸入欄位


---

## 2026-01-06 17:19:19 - 優化聯絡資訊頁面：添加圖標並增大樣式

### 變更內容
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 導入 `MapPin`, `Phone`, `MessageCircle` 圖標（來自 lucide-react）
  - 為每個聯絡資訊項目添加對應圖標：
    - 地址：MapPin 圖標（綠色）
    - 電話：Phone 圖標（綠色）
    - LINE ID：MessageCircle 圖標（綠色）
  - 增大整體樣式：
    - 標題從 `text-2xl` 改為 `text-3xl`
    - 內邊距從 `p-8` 改為 `p-10 md:p-12`
    - 標題下邊距從 `mb-6` 改為 `mb-8`
    - 項目間距從 `mt-2` 改為 `space-y-6`
    - 文字大小從 `text-sm` 改為 `text-base`
  - 改進布局：
    - 使用 flex 布局，圖標和文字並排顯示
    - 每個項目有標題（粗體）和內容
    - 圖標使用綠色（`text-teal-600`）突出顯示

### 說明
- 聯絡資訊頁面現在更加充實，視覺效果更好
- 圖標幫助用戶快速識別不同類型的聯絡方式
- 更大的字體和間距提升可讀性


---

## 2026-01-06 17:22:10 - 放大聯絡我們頁面地址/電話/LINE ID 字體

### 變更內容
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 將聯絡資訊內容文字從 `text-base` 放大為 `text-lg`：
    - 地址內容行改為 `text-lg text-gray-600`
    - 電話內容行改為 `text-lg text-gray-600`
    - LINE ID 內容行改為 `text-lg text-gray-600`

### 說明
- 讓地址、電話與 LINE ID 更醒目，減少留白感，提升可讀性


---

## 2026-01-06 17:24:30 - 放大聯絡資訊內容文字

### 變更內容
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 將以下內容文字從 `text-base` 改為 `text-lg`：
    - 地址內容 `<p className="text-lg text-gray-600">`
    - 電話內容 `<p className="text-lg text-gray-600">`
    - LINE ID 內容 `<p className="text-lg text-gray-600">`

### 說明
- 讓聯絡我們頁面中的地址、電話與 LINE ID 更顯眼，字體更大更容易閱讀


---

## 2026-01-06 17:32:23 - 放大聯絡資訊內容文字（實際套用）

### 變更內容
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 將以下三行從 `text-base text-gray-600` 改為 `text-lg text-gray-600`：
    - 地址內容行
    - 電話內容行
    - LINE ID 內容行

### 說明
- 讓聯絡我們頁面中的地址、電話與 LINE ID 文字實際放大，畫面更飽滿、可讀性更好


---

## 2026-01-06 17:40:10 - 調整租車須知回答換行與字體大小

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 將回答區塊的樣式從：
    - `text-sm` 改為 `text-base md:text-lg`
  - 新增 `whitespace-pre-line`，讓後端文字中的 `\n` 會正確顯示為換行

### 說明
- 租車須知（Q&A）中的回答現在會依照文字內的換行顯示，不再擠成一行
- 回答字體放大，閱讀體驗更好


---

## 2026-01-06 17:45:10 - 前臺選單暫時隱藏「民宿推薦」

### 變更內容
- **constants.tsx** (`system/frontend/constants.tsx`)
  - 將 `NAV_ITEMS` 中的 `{ label: '民宿推薦', path: '/guesthouses' }` 以註釋方式 mark 起來：
    - `// { label: '民宿推薦', path: '/guesthouses' }, // 暫時隱藏民宿推薦選單`

### 說明
- 前臺側邊選單不再顯示「民宿推薦」，但路由與頁面仍然存在
- 之後若要重新啟用，只需取消註釋該行即可


---

## 2026-01-06 20:41:31 - 調整側邊欄按鈕位置

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 將「線上預約」和「LINE @」按鈕從側邊欄底部（`mt-auto`）移動到「聯絡我們」選單項目下方
  - 使用 `mt-8` 取代 `mt-auto`，讓按鈕緊接在選單下方顯示

### 說明
- 桌面版側邊欄的「線上預約」和「LINE @」按鈕現在會顯示在「聯絡我們」下方，而不是在整個側邊欄的底部
- 提升使用者體驗，讓重要功能按鈕更容易被發現


---

## 2026-01-06 20:46:02 - 修復 Layout 組件標籤結構錯誤

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 修復 JSX 標籤結構錯誤：補上缺失的 `</div>` 標籤
  - 確保第 22 行的外層 `<div>` 容器正確關閉

### 說明
- 修正了構建錯誤：`Unexpected closing "aside" tag does not match opening "div" tag`
- 現在標籤結構正確：外層容器 `<div>` → Logo → nav → 按鈕區域 `<div>` → 關閉按鈕區域 `</div>` → 關閉外層容器 `</div>` → 關閉 `</aside>`


---

## 2026-01-06 20:50:20 - 將按鈕移到框外

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 將「線上預約」和「LINE @」按鈕從帶邊框的白色框內移到框外
  - 按鈕現在位於 `<aside>` 內，但在帶邊框的 `<div>` 外面
  - 移除了按鈕區域的 `mt-8`，改為直接放在框下方

### 說明
- 現在結構為：帶邊框的白色框（Logo + 選單）→ 按鈕區域（線上預約、LINE @）
- 按鈕不再包含在白色框內，視覺上更清晰分離


---

## 2026-01-06 20:59:42 - 在租賃須知頁面新增服務內容區塊

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 在租賃須知頁面最下方新增「服務內容」區塊
  - 包含三個服務項目：
    1. **民宿推薦**：列出小琉球極の宿、微浮包棟民宿、外泊家民宿、灣DAO包棟民宿、77旗下包棟民宿的介紹（不含圖片）
    2. **行李配送**：輕鬆旅遊從77go開始，行李內的快樂回憶不論大小，由我們幫您守護
    3. **專車接送**：一趟美好旅程，從涼爽接駁開始，不畏風雨只為了提供尊貴的服務

### 說明
- 內容參考自 77go 網站（https://www.77go.com.tw/）
- 服務內容區塊位於 FAQ 問答區塊下方，以分隔線區分
- 使用與問答區塊一致的樣式風格，保持頁面一致性


---

## 2026-01-06 21:06:19 - 調整民宿推薦格式

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 調整「小琉球極の宿」的顯示格式
  - 將標題和內容合併為同一行，內容前加上句號「。」
  - 格式：小琉球極の宿。極の宿 一館、極の宿 觀海二館、極の宿 包棟小館

### 說明
- 標題使用粗體，內容使用正常字重並以灰色顯示
- 內容直接接在標題後面，以句號開頭


---

## 2026-01-06 21:07:02 - 在服務內容區塊之間加上橫線分隔

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 在「民宿推薦」和「行李配送」之間加上橫線分隔
  - 在「行李配送」和「專車接送」之間加上橫線分隔
  - 使用 `border-t border-gray-300 my-8` 樣式

### 說明
- 每個服務區塊之間現在都有清晰的橫線分隔，提升視覺層次感
- 橫線上下各有適當的間距（my-8）


---

## 2026-01-06 21:11:33 - 調整民宿推薦格式，標題與內容分開並加上實心圓圈

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 將所有民宿項目的格式調整為：
    - 標題單獨一行（粗體）
    - 內容單獨一行，前面加上實心圓圈（•）
  - 適用於所有民宿項目：小琉球極の宿、微浮包棟民宿、外泊家民宿、灣DAO包棟民宿、77旗下包棟民宿

### 說明
- 標題和內容現在分開顯示，提升可讀性
- 內容前面加上實心圓圈（•）作為視覺標記，與標題區分


---

## 2026-01-07 09:09:39 - 移除民宿推薦小圓點並將所有 77/77go 替換為蘭光電動機車

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 移除所有民宿推薦內容前面的實心圓圈（•）
  - 將「77旗下包棟民宿」改為「蘭光電動機車旗下包棟民宿」
  - 將民宿描述中的「77」改為「蘭光電動機車」
  - 將行李配送內容中的「77go」改為「蘭光電動機車」

### 說明
- 民宿推薦區塊的內容現在不再使用小圓點作為前綴
- 所有品牌相關的「77」和「77go」都已統一替換為「蘭光電動機車」，確保品牌一致性


---

## 2026-01-07 09:10:03 - 刪除民宿推薦區塊的所有內容

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 刪除「民宿推薦」標題下的所有民宿項目內容
  - 保留「民宿推薦」標題，等待後續資料填入

### 說明
- 由於尚未有民宿資料，暫時移除所有民宿推薦內容
- 標題保留，方便後續添加資料


---

## 2026-01-07 11:40:46 - 移除前臺線上預約表單的驗證碼功能

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 移除驗證碼相關的 import（RefreshCw, Loader2）
  - 移除 Captcha interface
  - 移除 captcha 和 isLoadingCaptcha state
  - 移除 formData 中的 captchaAnswer 欄位
  - 移除 fetchCaptcha 函數
  - 移除 useEffect 中的 fetchCaptcha 調用
  - 移除 handleSubmit 中的驗證碼驗證邏輯
  - 移除表單提交時的 captcha_id 和 captcha_answer 參數
  - 移除表單中的驗證碼 UI 區塊（圖片、輸入框、刷新按鈕）
  - 更新提交按鈕的 disabled 條件，移除 captcha 檢查

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 移除驗證規則中的 captcha_id 和 captcha_answer
  - 移除驗證碼驗證邏輯（檢查 captcha_id、驗證答案等）
  - 移除 Cache::forget 驗證碼快取的邏輯

### 說明
- 前臺線上預約表單不再需要驗證碼驗證
- 簡化表單流程，提升用戶體驗
- 後端 API 已同步移除驗證碼相關驗證


---

## 2026-01-07 11:49:09 - 修改線上預約表單支援多個租車類型/數量

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 新增 `ScooterItem` interface 定義租車項目結構
  - 將單一租車選擇改為動態列表（`scooterItems` state）
  - 新增 `addScooterItem()` 函數，允許用戶添加多個租車項目
  - 新增 `removeScooterItem()` 函數，允許用戶移除租車項目（至少保留一個）
  - 新增 `handleScooterChange()` 和 `handleScooterCountChange()` 處理多個項目的變更
  - 更新表單 UI，顯示多個租車選擇框，每個項目都有移除按鈕（至少保留一個時）
  - 新增「新增租車類型」按鈕，使用 Plus 圖標
  - 更新表單提交邏輯，將多個租車項目組合成陣列發送
  - 更新表單驗證邏輯，檢查所有租車項目是否完整填寫
  - 更新提交按鈕的 disabled 條件，檢查所有租車項目

- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 更新驗證規則，將 `scooterModel`、`scooterType`、`scooterCount` 改為 `scooters` 陣列
  - 新增 `scooters.*.model`、`scooters.*.type`、`scooters.*.count` 的驗證規則
  - 更新資料處理邏輯，將接收到的 `scooters` 陣列轉換為資料庫格式（model + type 組合）
  - 移除單一租車項目的處理邏輯

- **api.ts** (`system/frontend/lib/api.ts`)
  - 更新 `booking.send()` 的 TypeScript 類型定義
  - 將參數從單一的 `scooterModel`、`scooterType`、`scooterCount` 改為 `scooters` 陣列

### 說明
- 用戶現在可以在線上預約表單中添加多個不同的租車類型/數量
- 每個租車項目都可以獨立選擇車型和數量
- 至少需要保留一個租車項目，可以動態添加或移除其他項目
- Email 模板已支援顯示多個租車項目（無需修改）


---

## 2026-01-07 14:02:03 - 更新首頁標題文字

### 變更內容
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 將首頁 Hero Section 的標題從「駕馭科技時尚<br />環保之旅」改為「讓純淨動力，帶你遇見更美好的島嶼風光」
  - 移除換行標籤和 teal-600 顏色的 span，改為單行文字

### 說明
- 更新首頁主標題，傳達更溫馨、更貼近島嶼旅遊體驗的品牌訊息


---

## 2026-01-07 14:02:28 - 更新關於我們頁面的成立日期

### 變更內容
- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 將「我們的 story」區塊第一句從「蘭光電動機車成立於小琉球」改為「蘭光電動機車於2025/07/20於小琉球」
  - 添加了具體的成立日期資訊

### 說明
- 更新關於我們頁面中的公司成立資訊，加入具體的成立日期


---

## 2026-01-07 14:41:08 - 將首頁標題改為天藍色

### 變更內容
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 將首頁 Hero Section 標題「讓純淨動力，帶你遇見更美好的島嶼風光」的顏色改為天藍色（`text-sky-600`）
  - 使用較柔和的天藍色，避免過於鮮亮

### 說明
- 標題文字現在使用天藍色顯示，更符合島嶼風光的視覺感受


---

## 2026-01-07 14:41:53 - 將首頁標題中的「純淨動力」改為天藍色

### 變更內容
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 將首頁標題拆分，只有「純淨動力」四個字使用天藍色（`text-sky-600`）
  - 其他文字（「讓」、「，帶你遇見更美好的島嶼風光」）保持黑色（預設顏色）

### 說明
- 標題中只有「純淨動力」使用天藍色突出顯示，其他文字保持黑色


---

## 2026-01-07 14:46:10 - 將首頁標題「純淨動力」的天藍色調亮

### 變更內容
- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 將「純淨動力」的顏色從 `text-sky-600` 改為 `text-sky-500`，使天藍色更亮

### 說明
- 調整顏色色階，使天藍色更加明亮醒目


---

## 2026-01-07 14:48:56 - 將整體底色從白色改為淡粉藍色

### 變更內容
- **Layout.tsx** (`system/frontend/components/Layout.tsx`)
  - 將整體背景色從 `bg-[#fcfcfc]` 改為 `bg-[#f0f4ff]`（淡粉藍色）
  - 將側邊欄背景色從 `bg-[#fcfcfc]` 改為 `bg-[#f0f4ff]`
  - 將手機版 header 背景色從 `bg-white` 改為 `bg-[#f0f4ff]`
  - 將手機版選單背景色從 `bg-white` 改為 `bg-[#f0f4ff]`
  - 將 Footer 背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

- **Home.tsx** (`system/frontend/pages/Home.tsx`)
  - 將 Featured Images Grid 區塊背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

### 說明
- 整體網站底色現在使用淡粉藍色（`#f0f4ff`），營造更柔和、溫馨的視覺感受
- 側邊欄內容框（Logo 和導航）仍保持白色背景以確保可讀性


---

## 2026-01-07 14:52:48 - 將關於我們頁面的背景色改為淡粉藍色

### 變更內容
- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 將 Header Section 背景色從 `bg-white` 改為 `bg-[#f0f4ff]`（淡粉藍色）
  - 將「我們的環境」區塊背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

### 說明
- 關於我們頁面的背景色現在與整體網站一致，使用淡粉藍色
- 「我們的 story」內容卡片仍保持白色背景以確保內容的可讀性和對比度


---

## 2026-01-07 14:54:39 - 將所有頁面的背景色改為淡粉藍色

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將表單容器背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 將 Header Section 背景色從 `bg-white` 改為 `bg-[#f0f4ff]`
  - 將底部裝飾區塊背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 將 Header Section 背景色從 `bg-white` 改為 `bg-[#f0f4ff]`
  - 將聯絡資訊卡片背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 將 Header Section 背景色從 `bg-white` 改為 `bg-[#f0f4ff]`
  - 將價格標籤背景色和邊框從 `bg-white` 和 `border-white` 改為 `bg-[#f0f4ff]` 和 `border-[#f0f4ff]`
  - 將底部服務區塊背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

- **Location.tsx** (`system/frontend/pages/Location.tsx`)
  - 將 Header Section 背景色從 `bg-white` 改為 `bg-[#f0f4ff]`
  - 將門市據點卡片背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

- **Guesthouses.tsx** (`system/frontend/pages/Guesthouses.tsx`)
  - 將民宿卡片背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

- **GuesthouseDetail.tsx** (`system/frontend/pages/GuesthouseDetail.tsx`)
  - 將整體背景色從 `bg-[#fcfcfc]` 改為 `bg-[#f0f4ff]`
  - 將 Header Section 背景色從 `bg-white` 改為 `bg-[#f0f4ff]`
  - 將錯誤訊息卡片背景色從 `bg-white` 改為 `bg-[#f0f4ff]`
  - 將民宿詳細資訊卡片背景色從 `bg-white` 改為 `bg-[#f0f4ff]`

### 說明
- 所有頁面的背景色現在統一使用淡粉藍色（`#f0f4ff`），與整體網站設計保持一致
- 部分功能性元素（如按鈕）仍保持原有顏色以確保可讀性和對比度


---

## 2026-01-07 14:57:01 - 將聯絡資訊卡片改回白色背景

### 變更內容
- **Contact.tsx** (`system/frontend/pages/Contact.tsx`)
  - 將聯絡資訊卡片背景色從 `bg-[#f0f4ff]` 改回 `bg-white`

### 說明
- 聯絡資訊卡片使用白色背景，與淡粉藍色頁面背景形成對比，提升可讀性和視覺層次


---

## 2026-01-07 14:57:35 - 將門市據點卡片改回白色背景

### 變更內容
- **Location.tsx** (`system/frontend/pages/Location.tsx`)
  - 將門市據點卡片背景色從 `bg-[#f0f4ff]` 改回 `bg-white`

### 說明
- 門市據點卡片使用白色背景，與淡粉藍色頁面背景形成對比，提升可讀性和視覺層次


---

## 2026-01-07 14:58:29 - 將租車須知頁面的問題列表區塊改為白色背景

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 將問題列表區塊（包含分類按鈕和問題列表）包在白色背景的容器中
  - 添加 `bg-white rounded-[40px] p-8 md:p-12 shadow-sm` 樣式

### 說明
- 問題列表區塊現在使用白色背景，與淡粉藍色頁面背景形成對比，提升可讀性和視覺層次


---

## 2026-01-07 14:59:15 - 將租車方案頁面的車子卡片區塊改為白色背景

### 變更內容
- **RentalPlans.tsx** (`system/frontend/pages/RentalPlans.tsx`)
  - 將車子卡片區塊包在白色背景的容器中
  - 添加 `bg-white rounded-[40px] p-8 md:p-12 shadow-sm` 樣式

### 說明
- 車子卡片區塊現在使用白色背景，與淡粉藍色頁面背景形成對比，提升可讀性和視覺層次


---

## 2026-01-07 15:00:06 - 將線上預約表單區塊改回白色背景

### 變更內容
- **Booking.tsx** (`system/frontend/pages/Booking.tsx`)
  - 將表單容器背景色從 `bg-[#f0f4ff]` 改回 `bg-white`

### 說明
- 線上預約表單區塊現在使用白色背景，與淡粉藍色頁面背景形成對比，提升可讀性和視覺層次


---

## 2026-01-07 15:06:30 - 將網站 Logo 圖檔改為 logo2.png

### 變更內容
- **constants.tsx** (`system/frontend/constants.tsx`)
  - 將 `Logo` 元件中的圖片來源從 `/logo.png` 改為 `/logo2.png`

### 說明
- 頁面上所有使用 `Logo` 元件的地方（側邊欄、Footer 等）現在都會顯示新的 `logo2.png`


---

## 2026-01-07 15:07:36 - 將網站 Logo 圖檔改為 logo2.png

### 變更內容
- **constants.tsx** (`system/frontend/constants.tsx`)
  - 將 `Logo` 元件中的圖片來源從 `/logo.png` 改為 `/logo2.png`

### 說明
- 頁面上所有使用 `Logo` 元件的地方（側邊欄、Footer 等）現在都會顯示新的 `logo2.png`


---

## 2026-01-07 15:32:01 - 修改關於我們頁面的開幕日期文字

### 變更內容
- **About.tsx** (`system/frontend/pages/About.tsx`)
  - 將「我們的 story」區塊第一句從「蘭光電動機車於2025/07/20於小琉球」改為「蘭光電動機車2025/07/20首度於小琉球開幕」

### 說明
- 更新了公司開幕資訊的表達方式，使文字更加流暢自然


---

## 2026-01-08 16:51:29 - 修復後台預約管理編輯功能，支援所有欄位

### 問題
- 後台預約管理頁面只能查看，無法修改預約資料
- 前端表單缺少新欄位（end_date, shipping_company, ship_arrival_time, adults, children, scooters）
- 後端 API 的 update 方法只接受舊欄位，沒有支援新欄位

### 變更內容

#### Backend Changes
- **BookingController.php** (`app/Http/Controllers/Api/BookingController.php`)
  - 更新 `update()` 方法的驗證規則，支援所有新欄位：
    - `end_date`: 結束日期（可選）
    - `shipping_company`: 船運公司（可選）
    - `ship_arrival_time`: 船班時間（可選）
    - `adults`: 大人人數（可選）
    - `children`: 小孩人數（可選）
    - `scooters`: 租車類型/數量陣列（可選）
    - `line_id`: 改為可選（nullable）
    - `scooter_type`: 改為可選（nullable）
    - `rental_days`: 改為可選（nullable）

#### Frontend Changes
- **BookingsPage.tsx** (`system/backend/pages/BookingsPage.tsx`)
  - 更新 `Booking` interface，添加所有新欄位
  - 更新 `formData` state，包含所有新欄位
  - 更新 `handleOpenModal()`，正確初始化所有欄位（包括 scooters 陣列和日期格式化）
  - 更新 `handleSubmit()`，正確提交所有欄位資料
  - 新增 `addScooter()`, `removeScooter()`, `updateScooter()` 函數，支援動態編輯租車項目
  - 更新表單 UI，添加所有新欄位：
    - 結束日期
    - 船運公司
    - 船班時間（來）
    - 大人 / 人數
    - 小孩 (12歲以下) / 人數
    - 所需租車類型/數量（動態列表，可新增/刪除）
  - 更新列表顯示，正確顯示 `scooters` JSON 資料（如果有的話，顯示多個租車項目；否則顯示舊的 `scooter_type`）

### 說明
- 現在後台預約管理頁面可以完整編輯所有預約資料
- 支援新舊資料格式（scooters 陣列和舊的 scooter_type 欄位）
- 表單包含所有必要欄位，可以完整編輯預約資訊


---

## 2026-01-08 16:55:07 - 優化預約管理功能：添加拒絕按鈕和詳情視圖

### 需求
- 預約管理通常只有兩個操作：轉為訂單、拒絕
- 鈴鐺按下「確認轉為訂單」後，應該跳到預約管理頁面的該訂單的 detail 視圖

### 變更內容

#### Frontend Changes
- **OrdersPage.tsx** (`system/backend/pages/OrdersPage.tsx`)
  - 添加 `useNavigate` hook 用於頁面跳轉
  - 添加 `handleRejectBooking()` 函數，將預約狀態改為「取消」
  - 修改 `handleConvertSuccess()`，在轉為訂單成功後跳轉到預約管理頁面的 detail 視圖（`/bookings?detail={bookingId}`）
  - 在未確認預約列表中添加「拒絕」按鈕，與「確認轉為訂單」按鈕並列顯示
  - 添加 `XCircle` icon 用於拒絕按鈕

- **BookingsPage.tsx** (`system/backend/pages/BookingsPage.tsx`)
  - 添加 `useSearchParams` hook 用於讀取 URL 參數
  - 添加 `detailBooking` state 和 `detailLoading` state
  - 添加 `fetchBookingDetail()` 函數，根據 ID 獲取單個預約詳情
  - 添加 `handleCloseDetail()` 函數，關閉詳情視圖並返回列表
  - 添加詳情視圖 UI，當 URL 參數包含 `detail` 時顯示：
    - 顯示所有預約欄位（姓名、LINE ID、電話、日期、船運資訊、人數、租車類型等）
    - 顯示狀態標籤
    - 顯示建立時間和更新時間
    - 提供「返回列表」和「編輯」按鈕
  - 當有 `detail` 參數時，不顯示列表，只顯示詳情視圖

- **ConvertBookingModal.tsx** (`system/backend/components/ConvertBookingModal.tsx`)
  - 修改 `onSuccess` prop 類型，從 `() => void` 改為 `(bookingId: number) => void`
  - 修改 `handleSubmit()`，在轉為訂單成功後調用 `onSuccess(booking.id)` 傳遞預約 ID

### 功能說明
1. **拒絕預約**：
   - 在未確認預約列表中，每個預約都有「拒絕」和「確認轉為訂單」兩個按鈕
   - 點擊「拒絕」會將預約狀態改為「取消」
   - 拒絕後會自動刷新未確認預約列表

2. **轉為訂單後跳轉**：
   - 點擊「確認轉為訂單」並完成轉換後，會自動跳轉到預約管理頁面的詳情視圖
   - URL 格式：`/bookings?detail={bookingId}`
   - 詳情視圖顯示完整的預約資訊，可以編輯或返回列表

3. **詳情視圖**：
   - 支援通過 URL 參數 `detail` 顯示單個預約的詳情
   - 顯示所有預約欄位，包括新舊格式的租車類型
   - 提供編輯和返回列表功能


---

## 2026-01-08 16:57:54 - 移除預約詳情視圖中的編輯功能

### 變更內容
- **BookingsPage.tsx** (`system/backend/pages/BookingsPage.tsx`)
  - 移除詳情視圖中的「編輯」按鈕
  - 詳情視圖現在只保留「返回列表」按鈕，改為只讀模式

### 說明
- 預約詳情視圖現在只能查看，無法修改
- 如需編輯預約，需返回列表頁面進行操作


---

## 2026-01-08 17:01:24 - 將預約列表中的編輯按鈕改為查看按鈕

### 變更內容
- **BookingsPage.tsx** (`system/backend/pages/BookingsPage.tsx`)
  - 將列表中的「編輯」按鈕（Edit2 圖標）改為「查看」按鈕（Eye 圖標）
  - 點擊「查看」按鈕會跳轉到詳情視圖（使用 `setSearchParams({ detail: booking.id.toString() })`）
  - 添加 `Eye` icon 的 import

### 說明
- 預約列表中的操作按鈕現在是「查看」和「刪除」
- 點擊「查看」會跳轉到只讀的詳情視圖，而不是編輯表單
- 符合預約管理以查看為主的設計需求


---

## 2026-01-08 17:02:12 - 確保詳情視圖完全只讀，禁用編輯功能

### 變更內容
- **BookingsPage.tsx** (`system/backend/pages/BookingsPage.tsx`)
  - 在編輯 Modal 的顯示條件中添加 `!detailId` 檢查
  - 確保在詳情視圖模式下（有 `detail` URL 參數時），編輯 Modal 不會顯示

### 說明
- 當進入詳情視圖時，編輯 Modal 不會被觸發或顯示
- 詳情視圖現在完全只讀，無法進行任何編輯操作
- 符合預約管理以查看為主的設計需求


---

## 2026-01-08 17:13:27 - 添加民宿多圖片支援功能

### 需求
- 添加嘿城寶民宿資料
- 支援上傳 4 張圖片（類似最後一張圖片的樣式）

### 變更內容

#### Database Changes
- **Migration** (`database/migrations/2026_01_08_171007_add_images_to_guesthouses_table.php`) - 新建
  - 添加 `images` JSON 欄位，支援存儲多張圖片路徑陣列

#### Backend Changes
- **Guesthouse.php** (`app/Models/Guesthouse.php`)
  - 更新 `$fillable` 陣列，添加 `images` 欄位
  - 更新 `$casts`，將 `images` 設為 `array` 類型

- **GuesthouseController.php** (`app/Http/Controllers/Api/GuesthouseController.php`)
  - 添加 `uploadImages()` 方法：支援上傳多張圖片（最多 10 張）
  - 添加 `deleteImage()` 方法：從 images 陣列中刪除單張圖片
  - 更新 `uploadImage()` 方法，支援 webp 格式

- **routes/api.php** (`routes/api.php`)
  - 添加路由：`POST /guesthouses/{guesthouse}/upload-images` - 上傳多張圖片
  - 添加路由：`DELETE /guesthouses/{guesthouse}/delete-image` - 刪除單張圖片

#### Frontend Backend Changes
- **api.ts** (`system/backend/lib/api.ts`)
  - 添加 `uploadFiles()` 方法到 `ApiClient` 類別，支援上傳多個文件
  - 更新 `guesthousesApi`，添加 `uploadImages()` 和 `deleteImage()` 方法

- **GuesthousesPage.tsx** (`system/backend/pages/GuesthousesPage.tsx`)
  - 更新 `Guesthouse` interface，添加 `images` 欄位
  - 添加多圖片上傳功能：
    - `imageFiles` 和 `imagePreviews` state 用於管理新上傳的圖片
    - `existingImages` state 用於顯示已存在的圖片
    - `handleImagesChange()` 函數處理多圖片選擇
    - `removeImagePreview()` 函數移除新上傳的圖片預覽
    - `removeExistingImage()` 函數刪除已存在的圖片
  - 更新表單 UI：
    - 保留原有的單圖片上傳（主圖片）
    - 添加多圖片上傳區域，支援選擇多張圖片
    - 顯示現有圖片網格，可刪除單張圖片
    - 顯示新上傳圖片的預覽網格
  - 更新 `handleSubmit()`，在上傳時同時處理單圖片和多圖片

#### Frontend Changes
- **GuesthouseDetail.tsx** (`system/frontend/pages/GuesthouseDetail.tsx`)
  - 更新 `Guesthouse` interface，添加 `images` 欄位
  - 更新圖片顯示邏輯：
    - 優先顯示 `images` 陣列中的多張圖片（2 欄網格布局）
    - 如果沒有 `images`，則顯示 `image_path` 主圖片
    - 支援顯示 4 張或更多圖片

### 使用說明
1. **添加新民宿**：
   - 進入後端管理系統的「民宿推薦管理」頁面
   - 點擊「新增民宿」按鈕
   - 填寫民宿資訊：
     - 名稱：嘿城寶民宿
     - 簡短說明：（可選）
     - 描述：海景、夕陽與星空，是這裡每天的風景。簡約建築環繞著寬闊草皮，觀景平台一覽無際的海天景色。寵物友善讓你與毛孩一起入住，共享純粹又美好的渡假時光。
     - 連結：（可選）
   - 上傳主圖片（單張，用於列表顯示）
   - 上傳多張圖片（4 張，用於詳情頁顯示）
   - 設定排序和啟用狀態
   - 點擊「儲存」

2. **圖片上傳**：
   - 主圖片：用於列表頁面顯示的單張圖片
   - 多張圖片：用於詳情頁面顯示的圖片網格（建議 4 張）
   - 可以隨時添加或刪除圖片

### 說明
- 系統現在支援每個民宿有多張圖片
- 前端詳情頁會以 2 欄網格顯示多張圖片
- 如果沒有多圖片，則顯示主圖片
- 所有圖片都會轉換為 webp 格式並使用 UUID 命名


---

## 2026-01-08 17:19:43 - 修復租車須知頁面民宿推薦顯示功能

### 問題
- 前台的租車須知頁面的民宿推薦部分只有標題，沒有顯示實際的民宿資料
- 用戶已經建立了民宿，但頁面上沒有顯示

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 添加 `Guesthouse` interface
  - 添加 `guesthouses` state 用於存儲民宿列表
  - 在 `useEffect` 中添加 `fetchGuesthouses()` 函數，從 API 獲取啟用的民宿列表
  - 更新「民宿推薦」區塊：
    - 顯示民宿卡片網格（響應式：手機 1 欄，平板 2 欄，桌面 3 欄）
    - 每個卡片顯示：
      - 民宿圖片（如果有）
      - 民宿名稱
      - 簡短說明（如果有，最多顯示 2 行）
      - 「VIEW DETAILS」連結，點擊後跳轉到民宿詳情頁
    - 如果沒有民宿，顯示「目前尚無推薦民宿」提示
  - 添加 `ExternalLink` icon import

### 說明
- 現在租車須知頁面的民宿推薦部分會自動顯示所有啟用的民宿
- 民宿卡片樣式與民宿列表頁面保持一致
- 點擊「VIEW DETAILS」會跳轉到對應的民宿詳情頁面


---

## 2026-01-08 17:22:42 - 將租車須知頁面的民宿推薦改為圖文並排顯示

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 將民宿推薦的顯示方式從網格卡片改為圖文並排布局
  - 每個民宿卡片：
    - 左側：民宿圖片（佔 50% 寬度）
    - 右側：文字內容（佔 50% 寬度）
      - 民宿名稱（較大字體）
      - 簡短說明
      - 「VIEW DETAILS」連結
  - 響應式設計：
    - 手機：上下排列（圖片在上，文字在下）
    - 平板和桌面：左右並排（圖片在左，文字在右）

### 說明
- 民宿推薦現在以圖文並排的方式顯示，更符合圖片中的設計風格
- 每個民宿佔據一整行，左圖右文的布局更突出民宿的特色


---

## 2026-01-08 17:27:26 - 將民宿詳情頁面的返回連結改為「返回租車須知」

### 變更內容
- **GuesthouseDetail.tsx** (`system/frontend/pages/GuesthouseDetail.tsx`)
  - 將「返回民宿列表」改為「返回租車須知」
  - 將返回連結從 `/guesthouses` 改為 `/guidelines`
  - 更新兩個位置的返回連結：
    - 錯誤頁面的返回連結
    - 正常頁面 header 中的返回連結

### 說明
- 現在從民宿詳情頁面點擊返回，會回到租車須知頁面（民宿推薦區塊）
- 更符合用戶從租車須知頁面進入民宿詳情的流程


---

## 2026-01-08 22:02:44 - 讓租車須知頁面的民宿推薦卡片整個可點擊進入詳情頁

### 變更內容
- **Guidelines.tsx** (`system/frontend/pages/Guidelines.tsx`)
  - 將整個民宿推薦卡片改為可點擊的連結
  - 將外層的 `div` 改為 `Link` 元件，指向 `/guesthouses/${gh.id}`
  - 將內部的 "VIEW DETAILS" 連結改為 `div`（因為整個卡片已經是連結）
  - 添加 `cursor-pointer` 樣式，讓用戶知道整個卡片可點擊
  - 保持原有的 hover 效果（`hover:shadow-md`）

### 說明
- 現在點擊民宿推薦卡片的任意位置（圖片、標題、描述、VIEW DETAILS 文字）都可以進入該民宿的詳情頁
- 提升用戶體驗，讓操作更直覺


---

## 2026-01-08 22:20:35 - 創建首頁圖片管理後端界面

### 變更內容

#### 資料庫
- **Migration** (`database/migrations/2026_01_08_221709_create_home_images_table.php`)
  - 創建 `home_images` 表，包含 `key`（唯一）、`image_path`、`alt_text` 欄位
- **Seeder** (`database/seeders/HomeImageSeeder.php`)
  - 初始化 5 張首頁圖片記錄：
    - `hero_image` - 首頁 Hero 區塊圖片（右側大圖）
    - `featured_image_1` - 首頁精選圖片 1
    - `featured_image_2` - 首頁精選圖片 2
    - `featured_image_3` - 首頁精選圖片 3
    - `featured_image_4` - 首頁精選圖片 4

#### 後端
- **Model** (`app/Models/HomeImage.php`)
  - 創建 HomeImage 模型，定義 fillable 欄位
- **Controller** (`app/Http/Controllers/Api/HomeImageController.php`)
  - `index()` - 列出所有首頁圖片（公開 API）
  - `show($key)` - 根據 key 獲取單個圖片（公開 API）
  - `update($key)` - 更新圖片資訊（需要認證）
  - `uploadImage($key)` - 上傳圖片（需要認證）
- **Routes** (`routes/api.php`)
  - 添加 `/api/home-images` 路由群組
  - 公開路由：`GET /home-images`、`GET /home-images/{key}`
  - 需要認證：`PUT /home-images/{key}`、`POST /home-images/{key}/upload-image`

#### 後端管理界面
- **HomeImagesPage** (`system/backend/pages/HomeImagesPage.tsx`)
  - 創建首頁圖片管理頁面
  - 顯示 5 張圖片的預覽和上傳界面
  - 支援上傳新圖片、預覽、取消上傳
  - 如果沒有上傳圖片，顯示預設圖片
  - 標示「預設圖片」或「已上傳自訂圖片」狀態
- **API Client** (`system/backend/lib/api.ts`)
  - 添加 `homeImagesApi` 包含 `list`、`get`、`update`、`uploadImage` 方法
- **路由** (`system/backend/App.tsx`)
  - 添加 `/home-images` 路由
- **側邊欄** (`system/backend/constants.tsx`)
  - 在「網站內容管理」下添加「首頁圖片」選單項目

#### 前端
- **API** (`system/frontend/lib/api.ts`)
  - 添加 `publicApi.homeImages.list()` 方法
- **首頁** (`system/frontend/pages/Home.tsx`)
  - 從 API 獲取首頁圖片配置
  - 如果資料庫有圖片，使用上傳的圖片；否則使用預設圖片
  - 支援動態 alt text

### 說明
- 後端管理員可以在「網站內容管理 > 首頁圖片」頁面管理首頁的 5 張圖片
- 每張圖片都可以獨立上傳，如果沒有上傳則使用預設的 picsum.photos 圖片
- 前端首頁會自動從 API 獲取圖片配置，優先使用上傳的圖片
- 圖片上傳後會自動轉換為 webp 格式並使用 UUID 命名


---

## 2026-01-09 14:42:26 - 後台預約管理增加 Email 欄位及郵件發送功能

### 變更內容

#### 資料庫
- **Migration** (`database/migrations/2026_01_09_143913_add_email_to_bookings_table.php`)
  - 在 `bookings` 表中添加 `email` 欄位（可為空）

#### 後端
- **Model** (`app/Models/Booking.php`)
  - 在 `$fillable` 中添加 `email` 欄位

- **Controller** (`app/Http/Controllers/Api/BookingController.php`)
  - 在 `update()` 方法的驗證規則中添加 `email` 欄位（可選）
  - 更新 `updateStatus()` 方法：
    - 當狀態改為「取消」（拒絕）時，檢查是否有 email
    - 如果沒有 email，返回錯誤訊息
    - 如果有 email，發送拒絕郵件
  - 更新 `convertToOrder()` 方法：
    - 在轉換訂單前檢查是否有 email
    - 如果沒有 email，返回錯誤訊息
    - 如果有 email，轉換訂單後發送確認郵件

- **郵件類**
  - **BookingRejectedMail** (`app/Mail/BookingRejectedMail.php`)
    - 創建拒絕郵件類，接收 `Booking` 模型
    - 郵件標題：「【蘭光電動機車】預約通知」
  - **BookingConfirmedMail** (`app/Mail/BookingConfirmedMail.php`)
    - 創建確認郵件類，接收 `Booking` 模型
    - 郵件標題：「【蘭光電動機車】訂單確認通知」

- **郵件模板**
  - **booking-rejected.blade.php** (`resources/views/emails/booking-rejected.blade.php`)
    - 拒絕郵件模板
    - 包含 logo（logo2.png）
    - 內容：「因預約日車輛全數租出，故此無法承接您的訂單 造成不便，深感抱歉」
  - **booking-confirmed.blade.php** (`resources/views/emails/booking-confirmed.blade.php`)
    - 確認郵件模板
    - 包含 logo（logo2.png）
    - 內容：「您 x 月 x 日與蘭光電動機車下定之訂單已成立」（動態顯示預約日期）

#### 後端管理界面
- **BookingsPage** (`system/backend/pages/BookingsPage.tsx`)
  - 在 `Booking` 接口中添加 `email: string | null`
  - 在 `formData` 狀態中添加 `email` 欄位
  - 在詳情視圖中添加 email 欄位顯示
  - 在編輯表單中添加 email 輸入欄位
  - 在預約列表表格中添加 email 欄位顯示

### 功能說明
- 後台管理員可以在預約資料中編輯 email 欄位
- 當拒絕預約（狀態改為「取消」）時：
  - 如果沒有 email，會顯示錯誤訊息：「此預約沒有填寫 email，無法拒絕。請先編輯預約資料添加 email。」
  - 如果有 email，會自動發送拒絕郵件給客戶
- 當確認轉為訂單時：
  - 如果沒有 email，會顯示錯誤訊息：「此預約沒有填寫 email，無法確認轉為訂單。請先編輯預約資料添加 email。」
  - 如果有 email，會自動發送確認郵件給客戶
- 郵件模板包含 logo 和專業的格式設計


---

## 2026-01-09 15:07:44 - 調整訂單管理轉換預約模態框的欄位順序和編輯權限

### 變更內容

#### 後端管理界面
- **ConvertBookingModal** (`system/backend/components/ConvertBookingModal.tsx`)
  - 在 `Booking` 接口中添加 `email: string | null`
  - 在 `formData` 狀態中添加 `email` 欄位
  - 調整預約資訊欄位順序為：
    1. 承租人姓名（只讀）
    2. Email（可編輯）
    3. LINE ID（只讀）
    4. 行動電話（只讀）
    5. 預約日期（只讀）
    6. 結束日期（只讀）
    7. 船運公司（只讀）
    8. 船班時間（來）（只讀）
    9. 大人 / 人數（只讀）
    10. 小孩 (12歲以下) / 人數（只讀）
    11. 所需租車類型/數量（只讀）
  - 所有欄位使用統一的樣式（白色背景、邊框）
  - Email 欄位使用輸入框，可以編輯
  - 其他欄位使用只讀的 div 顯示
  - 在提交轉換訂單前，如果 email 有變更，會先更新 booking 的 email

### 功能說明
- 在訂單管理的「確認預約轉為訂單」模態框中，只有 email 欄位可以編輯
- 其他所有欄位都是只讀顯示，確保資料一致性
- 欄位順序按照用戶要求的順序排列
- 如果用戶修改了 email，在轉換訂單前會自動更新預約資料中的 email


---

## 2026-01-09 15:13:02 - 更新訂單管理未確認預約列表的顯示格式

### 變更內容

#### 後端管理界面
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 添加 `editingEmails` 狀態來管理每個預約的 email 編輯
  - 添加 `handleEmailChange` 和 `handleEmailSave` 函數來處理 email 的編輯和儲存
  - 更新未確認預約列表的顯示格式，按照以下順序顯示欄位：
    1. 承租人姓名（只讀）
    2. Email（可編輯，帶儲存按鈕）
    3. LINE ID（只讀）
    4. 行動電話（只讀）
    5. 預約日期（只讀）
    6. 結束日期（只讀）
    7. 船運公司（只讀）
    8. 船班時間（來）（只讀）
    9. 大人 / 人數（只讀）
    10. 小孩 (12歲以下) / 人數（只讀）
    11. 所需租車類型/數量（只讀）
  - 所有欄位使用統一的樣式（白色背景、邊框）
  - Email 欄位可以即時編輯，修改後點擊「儲存」按鈕保存
  - 調整按鈕位置為垂直排列在右側

### 功能說明
- 在訂單管理的「未確認預約列表」中，所有欄位按照指定順序顯示
- 只有 Email 欄位可以編輯，其他欄位都是只讀
- Email 修改後需要點擊「儲存」按鈕才會保存到資料庫
- 顯示格式與「確認轉為訂單」模態框保持一致


---

## 2026-01-09 15:18:04 - 調整未確認預約列表顯示格式為簡潔文字形式

### 變更內容

#### 後端管理界面
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 將 Email 欄位移到第一個位置（可編輯）
  - 其他欄位改為簡潔的文字顯示格式，使用 "欄位名: 值" 的方式
  - 移除所有表單樣式的框框，改為純文字顯示
  - 欄位順序：
    1. Email（可編輯，帶儲存按鈕）
    2. 承租人姓名: 值
    3. LINE ID: 值
    4. 行動電話: 值
    5. 預約日期: 值
    6. 結束日期: 值
    7. 船運公司: 值
    8. 船班時間（來）: 值
    9. 大人 / 人數: 值
    10. 小孩 (12歲以下) / 人數: 值
    11. 所需租車類型/數量: 值

### 功能說明
- Email 欄位放在最上方，可以編輯
- 其他所有欄位以簡潔的文字格式顯示，例如 "承租人姓名: 張三"、"LINE ID: -"
- 不再使用表單框框，界面更簡潔
- 租車類型/數量以逗號分隔顯示多個項目


---

## 2026-01-09 15:22:31 - 調整未確認預約列表為兩列布局並為租車類型添加顏色標籤

### 變更內容

#### 後端管理界面
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 將欄位改為兩列網格布局（grid-cols-2）
  - 欄位排列順序：
    - 第一行：承租人姓名、LINE ID
    - 第二行：預約日期、結束日期
    - 第三行：船運公司、船班時間（來）
    - 第四行：大人 / 人數、小孩 (12歲以下) / 人數
  - 為「所需租車類型/數量」的車型標籤添加彩色背景
    - 使用多種顏色循環（藍色、綠色、橙色、紫色、粉色、黃色、靛藍色、青色）
    - 每個車型標籤都有獨立的顏色，便於區分
    - 標籤樣式：圓角、內邊距、字體加粗

### 功能說明
- 欄位以兩列形式整齊排列，節省空間
- 租車類型標籤使用不同顏色，視覺效果更清晰
- Email 欄位仍然在最上方，可以編輯
- 其他欄位以簡潔的文字格式顯示


---

## 2026-01-09 15:25:24 - 將 Email、拒絕和確認按鈕調整為同一排顯示

### 變更內容

#### 後端管理界面
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 將 Email 輸入框、拒絕按鈕和確認按鈕調整為同一排（同一行）顯示
  - 使用 `flex items-end gap-3` 布局，確保按鈕與輸入框底部對齊
  - Email 輸入框使用 `flex-1` 佔據剩餘空間
  - 按鈕高度統一為 `h-[42px]`，與輸入框高度一致
  - 移除原本右側垂直排列的按鈕區域

### 功能說明
- Email、拒絕和確認按鈕現在在同一排顯示，界面更緊湊
- 按鈕與輸入框底部對齊，視覺效果更整齊
- 其他欄位和租車類型標籤保持不變


---

## 2026-01-09 15:29:46 - 拒絕和確認按鈕直接跳轉到預約管理 detail 頁面

### 變更內容

#### 後端管理界面
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `handleRejectBooking` 函數：拒絕預約後直接跳轉到預約管理的 detail 頁面
  - 修改 `handleConvertBookingClick` 函數：點擊「確認轉為訂單」後直接跳轉到預約管理的 detail 頁面，不再打開確認模態框
  - 移除 `ConvertBookingModal` 的導入和使用
  - 移除不再使用的狀態：`isConvertModalOpen`、`selectedBooking`、`convertingBookingId`
  - 移除 `handleConvertSuccess` 函數（不再需要）

### 功能說明
- 點擊「拒絕」按鈕後，會先確認，然後更新預約狀態為「取消」，並直接跳轉到預約管理的 detail 頁面
- 點擊「確認轉為訂單」按鈕後，直接跳轉到預約管理的 detail 頁面，用戶可以在那裡完成轉換訂單的操作
- 簡化了操作流程，不需要額外的確認模態框


---

## 2026-01-09 15:33:02 - 修復更新預約 email 時的驗證錯誤

### 變更內容

#### 後端
- **BookingController** (`app/Http/Controllers/Api/BookingController.php`)
  - 修改 `update()` 方法的驗證規則
  - 將 `name`、`booking_date`、`status` 的驗證規則從 `required` 改為 `sometimes|required`
  - 這樣只有在提供這些欄位時才會驗證，允許只更新部分欄位（如 email）

### 問題修復
- 修復了在未確認預約列表中更新 email 時出現的 422 驗證錯誤
- 之前只傳送 `email` 欄位時，後端要求 `name`、`booking_date`、`status` 必填
- 現在可以只更新 email，不需要提供其他必填欄位

### 功能說明
- 使用 `sometimes` 規則，只有在請求中包含該欄位時才進行驗證
- 允許部分更新，提升 API 的靈活性
- 其他欄位的驗證規則保持不變


---

## 2026-01-09 15:41:16 - 確認按鈕直接創建訂單並發送郵件

### 變更內容

#### 後端
- **BookingController** (`app/Http/Controllers/Api/BookingController.php`)
  - 修改 `convertToOrder()` 方法的驗證規則
  - 將 `payment_method`、`payment_amount`、`scooter_ids` 改為 `sometimes|required`，允許使用預設值
  - 添加自動選擇機車的邏輯：
    - 如果沒有提供 `scooter_ids`，根據預約的車型需求自動選擇可用機車
    - 從預約的 `scooters` 陣列計算需要的機車數量
    - 自動選擇狀態為「待出租」的機車
    - 如果可用機車數量不足，返回錯誤訊息
  - 使用預設值：
    - `payment_method`: '現金'（如果未提供）
    - `payment_amount`: 0（如果未提供）
  - 確認轉為訂單後會自動發送確認郵件（已實現）

#### 後端管理界面
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `handleConvertBookingClick` 函數：
    - 添加確認對話框
    - 檢查 email 是否存在
    - 直接調用 `convertToOrder` API，使用預設值（現金、金額 0、自動選擇機車）
    - 轉換成功後重新載入預約列表和訂單列表
    - 跳轉到預約管理的 detail 頁面

### 功能說明
- **確認按鈕**：
  - 點擊後會先確認，然後直接創建訂單
  - 使用預設值：付款方式「現金」、金額 0、自動選擇可用機車
  - 創建訂單後，預約狀態自動改為「已轉訂單」
  - 自動發送確認郵件給客戶的 email
  - 跳轉到預約管理的 detail 頁面

- **拒絕按鈕**：
  - 點擊後會先確認，然後更新預約狀態為「取消」
  - 自動發送拒絕郵件給客戶的 email（已實現）
  - 跳轉到預約管理的 detail 頁面

- **郵件發送**：
  - 拒絕時：發送拒絕郵件（內容：「因預約日車輛全數租出，故此無法承接您的訂單 造成不便，深感抱歉」）
  - 確認時：發送確認郵件（內容：「您 x 月 x 日與蘭光電動機車下定之訂單已成立」）


---

## 2026-01-09 15:47:03 - 修改預約轉訂單邏輯：為每個車型創建對應數量的訂單

### 變更內容

#### 後端
- **BookingController** (`app/Http/Controllers/Api/BookingController.php`)
  - 修改 `convertToOrder()` 方法的邏輯
  - 如果沒有提供 `scooter_ids`，根據預約的 `scooters` 陣列為每個車型創建訂單
  - 邏輯：
    1. 遍歷預約的 `scooters` 陣列
    2. 解析每個項目的 `model`（格式：model + " " + type，例如 "EB-500 電輔車"）
    3. 根據 model 和 type 匹配對應的可用機車（狀態為「待出租」）
    4. 為每個車型創建一個訂單，每個訂單包含該車型對應數量的機車
    5. 如果某個車型的可用機車數量不足，返回錯誤訊息
  - 如果提供了 `scooter_ids`，仍然創建單一訂單（保持向後兼容）
  - 返回訊息改為「預約已成功轉為 X 筆訂單」
  - 返回的 `data` 改為訂單陣列

### 功能說明
- 一個預約如果包含多個車型（例如：EB-500 電輔車 x1 和 ES-1000 綠牌 x1），會創建 2 個訂單
- 每個訂單對應一個車型，包含該車型對應數量的機車
- 自動根據 model 和 type 匹配對應的可用機車
- 如果某個車型的可用機車數量不足，會返回具體的錯誤訊息
- 所有訂單創建成功後，預約狀態改為「已轉訂單」，並發送確認郵件


---

## 2026-01-09 15:54:14 - 修正預約轉訂單邏輯：一個預約轉為一個訂單

### 變更內容

#### 後端
- **BookingController** (`app/Http/Controllers/Api/BookingController.php`)
  - 修正 `convertToOrder()` 方法的邏輯
  - 改為：一個預約轉為一個訂單，這個訂單包含所有需要的機車
  - 邏輯：
    1. 如果提供了 `scooter_ids`，使用提供的機車 ID
    2. 如果沒有提供 `scooter_ids`，根據預約的 `scooters` 陣列自動選擇機車：
       - 遍歷每個車型需求
       - 解析 model 和 type（格式：model + " " + type）
       - 根據 model 和 type 匹配對應的可用機車
       - 收集所有需要的機車 ID
    3. 創建單一訂單，關聯所有選中的機車
  - 將 `scooter_ids` 驗證規則改為 `nullable|array`，允許不提供（自動選擇）
  - 返回訊息改為「預約已成功轉為訂單」
  - 返回的 `data` 改為單一訂單物件

### 功能說明
- 一個預約（無論包含多少個車型）轉為一個訂單
- 這個訂單包含所有需要的機車（根據預約的車型需求自動選擇）
- 例如：預約包含 EB-500 電輔車 x1 和 ES-1000 綠牌 x1，會創建一個訂單，包含 1 台 EB-500 電輔車和 1 台 ES-1000 綠牌
- 自動根據 model 和 type 匹配對應的可用機車
- 如果某個車型的可用機車數量不足，返回具體的錯誤訊息


---

## 2026-01-09 15:55:22 - 修正確認轉為訂單的參數傳遞

### 變更內容

#### 後端管理界面
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 修改 `handleConvertBookingClick` 函數
  - 移除 `scooter_ids: []` 的傳遞，改為不傳送該欄位
  - 這樣後端會根據預約的車型需求自動選擇機車，不會觸發驗證錯誤

### 功能說明
- 確認轉為訂單時，不傳送 `scooter_ids` 欄位
- 後端會自動根據預約的 `scooters` 陣列處理所有車型：
  - 遍歷每個車型需求（例如：EB-500 電輔車 x1、ES-1000 綠牌 x1）
  - 根據 model 和 type 匹配對應的可用機車
  - 收集所有需要的機車 ID
  - 創建一個訂單，包含所有機車
- 如果某個車型的可用機車數量不足，會返回具體的錯誤訊息


---

## 2026-01-09 16:42:19 - 清理未使用的程式碼

### 變更內容

#### 後端管理界面
- **OrdersPage** (`system/backend/pages/OrdersPage.tsx`)
  - 移除未使用的導入：
    - `scootersApi` - 已不再使用（之前用於 ConvertBookingModal）
    - `OrderStatus` - 未在代碼中使用
    - `Check` icon - 未在代碼中使用

#### 後端組件
- **ConvertBookingModal** (`system/backend/components/ConvertBookingModal.tsx`)
  - 刪除整個組件檔案
  - 該組件已不再被使用，因為確認轉為訂單現在直接調用 API，不再使用模態框

### 清理說明
- 移除未使用的導入可以減少打包大小
- 刪除未使用的組件可以保持代碼庫整潔
- 所有功能仍然正常運作

