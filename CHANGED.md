# 變更記錄 (Change Log)

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

