<?php

namespace App\Exports;

use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Cell\Coordinate;

class PartnerMonthlyReportExport
{
    protected $partnerName;
    protected $storeName;
    protected $year;
    protected $month;
    protected $dates;
    protected $models;
    protected $weekdayMap;

    public function __construct($partnerName, $year, $month, $dates, $models, $storeName = null)
    {
        $this->partnerName = $partnerName;
        $this->storeName = $storeName;
        $this->year = $year;
        $this->month = $month;
        $this->dates = $dates;
        $this->models = $models;
        
        $this->weekdayMap = [
            'Monday' => '星期一',
            'Tuesday' => '星期二',
            'Wednesday' => '星期三',
            'Thursday' => '星期四',
            'Friday' => '星期五',
            'Saturday' => '星期六',
            'Sunday' => '星期日',
        ];
    }

    public function generate(): Spreadsheet
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('月報表');
        
        // 驗證 models 陣列
        if (empty($this->models) || !is_array($this->models)) {
            throw new \Exception('機車型號列表為空或無效');
        }
        
        $row = 1;
        
        // 計算總列數：日期(1) + 星期(1) + 每個型號(4列)
        $totalCols = 2 + count($this->models) * 4;
        
        // 驗證總列數是否有效（PhpSpreadsheet 支援的最大列數是 16384，即 XFD）
        if ($totalCols < 1 || $totalCols > 16384) {
            throw new \Exception('總列數超出有效範圍: ' . $totalCols);
        }
        
        $lastCol = Coordinate::stringFromColumnIndex($totalCols);
        
        // 第一行：標題「蘭光智能出租月報表」，下方有店名信息
        $titleCell = $sheet->getCell('A' . $row);
        
        // 設置標題和店名（如果有的話）
        if ($this->storeName) {
            // 在同一個儲存格中換行顯示標題和店名
            // 格式：蘭光智能出租月報表\n{store_name}
            $titleCell->setValue('蘭光智能出租月報表' . "\n" . $this->storeName);
        } else {
            $titleCell->setValue('蘭光智能出租月報表 test');
        }
        
        $sheet->mergeCells('A' . $row . ':' . $lastCol . $row);
        $titleStyle = $sheet->getStyle('A' . $row);
        $titleStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $titleStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $titleStyle->getAlignment()->setWrapText(true);
        $titleStyle->getFont()->setBold(true);
        $titleStyle->getFont()->setSize(14);
        $row++;
        
        // 第二行：各個機車型號（每個型號跨4列）
        $col = 1;
        // 日期和星期列在第二行是空的（會在第四行顯示）
        $col += 2;
        
        foreach ($this->models as $model) {
            $modelStartCol = $col;
            $modelEndCol = $col + 3;
            $sheet->mergeCells(Coordinate::stringFromColumnIndex($modelStartCol) . $row . ':' . Coordinate::stringFromColumnIndex($modelEndCol) . $row);
            $sheet->setCellValueByColumnAndRow($modelStartCol, $row, $model);
            $modelStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($modelStartCol) . $row);
            $modelStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $modelStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            // 設置淺藍色背景
            $modelStyle->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9E1F2');
            $modelStyle->getFont()->setBold(true);
            $col = $modelEndCol + 1;
        }
        $row++;
        
        // 第三行：每個型號下分為「當日租」（1列）和「跨日租」（3列合併）
        $col = 1;
        // 日期和星期列在第三行是空的
        $col += 2;
        
        foreach ($this->models as $model) {
            // 當日租 (1列)
            $sameDayCol = $col;
            $sheet->setCellValueByColumnAndRow($sameDayCol, $row, '當日租');
            $sameDayStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($sameDayCol) . $row);
            $sameDayStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sameDayStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $sameDayStyle->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9E1F2');
            $sameDayStyle->getFont()->setBold(true);
            $col++;
            
            // 跨日租 (3列合併)
            $overnightStartCol = $col;
            $overnightEndCol = $col + 2;
            $sheet->mergeCells(Coordinate::stringFromColumnIndex($overnightStartCol) . $row . ':' . Coordinate::stringFromColumnIndex($overnightEndCol) . $row);
            $sheet->setCellValueByColumnAndRow($overnightStartCol, $row, '跨日租');
            $overnightStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($overnightStartCol) . $row);
            $overnightStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $overnightStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $overnightStyle->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9E1F2');
            $overnightStyle->getFont()->setBold(true);
            $col = $overnightEndCol + 1;
        }
        $row++;
        
        // 第四行：日期、星期，然後每個型號下：當日租只有「台數」（1列），跨日租有「台數」、「天數」、「金額」（3列）
        $col = 1;
        // 日期
        $sheet->setCellValueByColumnAndRow($col, $row, '日期');
        $dateStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($col) . $row);
        $dateStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $dateStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $dateStyle->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('D9E1F2');
        $dateStyle->getFont()->setBold(true);
        $col++;
        // 星期
        $sheet->setCellValueByColumnAndRow($col, $row, '星期');
        $weekdayStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($col) . $row);
        $weekdayStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $weekdayStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
        $weekdayStyle->getFill()
            ->setFillType(Fill::FILL_SOLID)
            ->getStartColor()->setRGB('D9E1F2');
        $weekdayStyle->getFont()->setBold(true);
        $col++;
        
        foreach ($this->models as $model) {
            // 當日租：台數
            $sheet->setCellValueByColumnAndRow($col, $row, '台數');
            $sameDayHeaderStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($col) . $row);
            $sameDayHeaderStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $sameDayHeaderStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $sameDayHeaderStyle->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9E1F2');
            $sameDayHeaderStyle->getFont()->setBold(true);
            $col++;
            // 跨日租：台數
            $sheet->setCellValueByColumnAndRow($col, $row, '台數');
            $overnightCountStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($col) . $row);
            $overnightCountStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $overnightCountStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $overnightCountStyle->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9E1F2');
            $overnightCountStyle->getFont()->setBold(true);
            $col++;
            // 跨日租：天數
            $sheet->setCellValueByColumnAndRow($col, $row, '天數');
            $overnightDaysStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($col) . $row);
            $overnightDaysStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $overnightDaysStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $overnightDaysStyle->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9E1F2');
            $overnightDaysStyle->getFont()->setBold(true);
            $col++;
            // 跨日租：金額
            $sheet->setCellValueByColumnAndRow($col, $row, '金額');
            $overnightAmountStyle = $sheet->getStyle(Coordinate::stringFromColumnIndex($col) . $row);
            $overnightAmountStyle->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $overnightAmountStyle->getAlignment()->setVertical(Alignment::VERTICAL_CENTER);
            $overnightAmountStyle->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('D9E1F2');
            $overnightAmountStyle->getFont()->setBold(true);
            $col++;
        }
        $row++;
        
        // 數據行
        foreach ($this->dates as $dateItem) {
            $dateStr = $dateItem['date'];
            $dateObj = \Carbon\Carbon::parse($dateStr . 'T00:00:00');
            $formattedDate = $dateObj->format('Y年m月d日');
            $weekday = $this->weekdayMap[$dateItem['weekday']] ?? $dateItem['weekday'];
            
            $col = 1;
            $sheet->setCellValueByColumnAndRow($col, $row, $formattedDate);
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, $weekday);
            $col++;
            
            // 處理數據：如果 dates 中有 orders 數組，需要合併為 models 格式
            $modelsData = [];
            if (isset($dateItem['orders']) && is_array($dateItem['orders'])) {
                // 合併所有訂單中相同型號的數據
                foreach ($dateItem['orders'] as $order) {
                    if (isset($order['models']) && is_array($order['models'])) {
                        foreach ($order['models'] as $modelItem) {
                            $modelKey = ($modelItem['model'] ?? '') . ' ' . ($modelItem['type'] ?? '');
                            $modelKey = trim($modelKey);
                            
                            if (!isset($modelsData[$modelKey])) {
                                $modelsData[$modelKey] = [
                                    'same_day_count' => 0,
                                    'same_day_days' => 0,
                                    'same_day_amount' => 0,
                                    'overnight_count' => 0,
                                    'overnight_days' => 0,
                                    'overnight_amount' => 0,
                                ];
                            }
                            
                            // 累加數據（處理空字符串的情況）
                            $modelsData[$modelKey]['same_day_count'] += is_numeric($modelItem['same_day_count'] ?? '') ? (int)$modelItem['same_day_count'] : 0;
                            $modelsData[$modelKey]['same_day_days'] += is_numeric($modelItem['same_day_days'] ?? '') ? (int)$modelItem['same_day_days'] : 0;
                            $modelsData[$modelKey]['same_day_amount'] += is_numeric($modelItem['same_day_amount'] ?? '') ? (int)$modelItem['same_day_amount'] : 0;
                            $modelsData[$modelKey]['overnight_count'] += is_numeric($modelItem['overnight_count'] ?? '') ? (int)$modelItem['overnight_count'] : 0;
                            $modelsData[$modelKey]['overnight_days'] += is_numeric($modelItem['overnight_days'] ?? '') ? (int)$modelItem['overnight_days'] : 0;
                            $modelsData[$modelKey]['overnight_amount'] += is_numeric($modelItem['overnight_amount'] ?? '') ? (int)$modelItem['overnight_amount'] : 0;
                        }
                    }
                }
            } elseif (isset($dateItem['models']) && is_array($dateItem['models'])) {
                // 如果已經是 models 格式，直接使用
                $modelsData = $dateItem['models'];
            }
            
            foreach ($this->models as $model) {
                $modelData = $modelsData[$model] ?? [
                    'same_day_count' => 0,
                    'same_day_days' => 0,
                    'same_day_amount' => 0,
                    'overnight_count' => 0,
                    'overnight_days' => 0,
                    'overnight_amount' => 0,
                ];
                
                $hasSameDayFee = ($modelData['same_day_amount'] ?? 0) > 0;
                $hasOvernightFee = ($modelData['overnight_amount'] ?? 0) > 0;
                
                $sheet->setCellValueByColumnAndRow($col, $row, $hasSameDayFee ? $modelData['same_day_count'] : '');
                $col++;
                $sheet->setCellValueByColumnAndRow($col, $row, $hasOvernightFee ? $modelData['overnight_count'] : '');
                $col++;
                $sheet->setCellValueByColumnAndRow($col, $row, $hasOvernightFee ? $modelData['overnight_days'] : '');
                $col++;
                $sheet->setCellValueByColumnAndRow($col, $row, $hasOvernightFee ? $modelData['overnight_amount'] : '');
                $col++;
            }
            
            $row++;
        }
        
        // 月結總計
        // 總台數/天數行
        $col = 1;
        $sheet->setCellValueByColumnAndRow($col, $row, '月結總計');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '總台數/天數');
        $col++;
        
        $grandTotalAmount = 0;
        
        foreach ($this->models as $model) {
            $modelSameDayTotalCount = 0;
            $modelSameDayTotalDays = 0;
            $modelSameDayTotalAmount = 0;
            $modelOvernightTotalCount = 0;
            $modelOvernightTotalDays = 0;
            $modelOvernightTotalAmount = 0;
            
            foreach ($this->dates as $dateItem) {
                // 處理數據：如果 dates 中有 orders 數組，需要合併為 models 格式
                $modelsData = [];
                if (isset($dateItem['orders']) && is_array($dateItem['orders'])) {
                    foreach ($dateItem['orders'] as $order) {
                        if (isset($order['models']) && is_array($order['models'])) {
                            foreach ($order['models'] as $modelItem) {
                                $modelKey = ($modelItem['model'] ?? '') . ' ' . ($modelItem['type'] ?? '');
                                $modelKey = trim($modelKey);
                                
                                if (!isset($modelsData[$modelKey])) {
                                    $modelsData[$modelKey] = [
                                        'same_day_count' => 0,
                                        'same_day_days' => 0,
                                        'same_day_amount' => 0,
                                        'overnight_count' => 0,
                                        'overnight_days' => 0,
                                        'overnight_amount' => 0,
                                    ];
                                }
                                
                                $modelsData[$modelKey]['same_day_count'] += is_numeric($modelItem['same_day_count'] ?? '') ? (int)$modelItem['same_day_count'] : 0;
                                $modelsData[$modelKey]['same_day_days'] += is_numeric($modelItem['same_day_days'] ?? '') ? (int)$modelItem['same_day_days'] : 0;
                                $modelsData[$modelKey]['same_day_amount'] += is_numeric($modelItem['same_day_amount'] ?? '') ? (int)$modelItem['same_day_amount'] : 0;
                                $modelsData[$modelKey]['overnight_count'] += is_numeric($modelItem['overnight_count'] ?? '') ? (int)$modelItem['overnight_count'] : 0;
                                $modelsData[$modelKey]['overnight_days'] += is_numeric($modelItem['overnight_days'] ?? '') ? (int)$modelItem['overnight_days'] : 0;
                                $modelsData[$modelKey]['overnight_amount'] += is_numeric($modelItem['overnight_amount'] ?? '') ? (int)$modelItem['overnight_amount'] : 0;
                            }
                        }
                    }
                } elseif (isset($dateItem['models']) && is_array($dateItem['models'])) {
                    $modelsData = $dateItem['models'];
                }
                
                $modelData = $modelsData[$model] ?? [
                    'same_day_count' => 0,
                    'same_day_days' => 0,
                    'same_day_amount' => 0,
                    'overnight_count' => 0,
                    'overnight_days' => 0,
                    'overnight_amount' => 0,
                ];
                $modelSameDayTotalCount += $modelData['same_day_count'] ?? 0;
                $modelSameDayTotalDays += $modelData['same_day_days'] ?? 0;
                $modelSameDayTotalAmount += $modelData['same_day_amount'] ?? 0;
                $modelOvernightTotalCount += $modelData['overnight_count'] ?? 0;
                $modelOvernightTotalDays += $modelData['overnight_days'] ?? 0;
                $modelOvernightTotalAmount += $modelData['overnight_amount'] ?? 0;
            }
            
            $grandTotalAmount += $modelSameDayTotalAmount + $modelOvernightTotalAmount;
            
            $sheet->setCellValueByColumnAndRow($col, $row, $modelSameDayTotalCount > 0 ? $modelSameDayTotalCount : '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, $modelOvernightTotalCount > 0 ? $modelOvernightTotalCount : '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, $modelOvernightTotalDays > 0 ? $modelOvernightTotalDays : '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, $modelOvernightTotalAmount > 0 ? $modelOvernightTotalAmount : '');
            $col++;
        }
        
        $row++;
        
        // 小計行
        $col = 1;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '小計');
        $col++;
        
        foreach ($this->models as $model) {
            $modelTotalAmount = 0;
            foreach ($this->dates as $dateItem) {
                // 處理數據：如果 dates 中有 orders 數組，需要合併為 models 格式
                $modelsData = [];
                if (isset($dateItem['orders']) && is_array($dateItem['orders'])) {
                    foreach ($dateItem['orders'] as $order) {
                        if (isset($order['models']) && is_array($order['models'])) {
                            foreach ($order['models'] as $modelItem) {
                                $modelKey = ($modelItem['model'] ?? '') . ' ' . ($modelItem['type'] ?? '');
                                $modelKey = trim($modelKey);
                                
                                if (!isset($modelsData[$modelKey])) {
                                    $modelsData[$modelKey] = [
                                        'same_day_amount' => 0,
                                        'overnight_amount' => 0,
                                    ];
                                }
                                
                                $modelsData[$modelKey]['same_day_amount'] += is_numeric($modelItem['same_day_amount'] ?? '') ? (int)$modelItem['same_day_amount'] : 0;
                                $modelsData[$modelKey]['overnight_amount'] += is_numeric($modelItem['overnight_amount'] ?? '') ? (int)$modelItem['overnight_amount'] : 0;
                            }
                        }
                    }
                } elseif (isset($dateItem['models']) && is_array($dateItem['models'])) {
                    $modelsData = $dateItem['models'];
                }
                
                $modelData = $modelsData[$model] ?? [
                    'same_day_amount' => 0,
                    'overnight_amount' => 0,
                ];
                $modelTotalAmount += ($modelData['same_day_amount'] ?? 0) + ($modelData['overnight_amount'] ?? 0);
            }
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, $modelTotalAmount > 0 ? $modelTotalAmount : '');
            $col++;
        }
        
        $row++;
        
        // 總金額行
        $col = 1;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '總金額');
        $col++;
        
        // 第一個型號的跨日租金額欄位位置
        // $col 現在指向第一個型號的「當日租台數」欄位
        // 每個型號有 4 列：當日租台數(0)、跨日租台數(1)、跨日租天數(2)、跨日租金額(3)
        // 所以第一個型號的「跨日租金額」欄位 = $col + 3
        $firstModelOvernightAmountCol = $col + 3;
        // 最後一個型號的「跨日租金額」欄位 = 第一個型號的「跨日租金額」 + (型號數量-1) * 4
        $lastModelOvernightAmountCol = $firstModelOvernightAmountCol + (count($this->models) - 1) * 4;
        
        // 填充第一個型號的前三列（當日租台數、跨日租台數、跨日租天數）為空白
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        // 在第一個型號的「跨日租金額」欄位設置總金額
        $sheet->setCellValueByColumnAndRow($col, $row, $grandTotalAmount > 0 ? $grandTotalAmount : '');
        $col++;
        
        // 填充其他型號的欄位為空白
        for ($i = 1; $i < count($this->models); $i++) {
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
        }
        
        // 合併總金額欄位（從第一個型號的「跨日租金額」到最後一個型號的「跨日租金額」）
        if (count($this->models) > 1) {
            $sheet->mergeCells(Coordinate::stringFromColumnIndex($firstModelOvernightAmountCol) . $row . ':' . Coordinate::stringFromColumnIndex($lastModelOvernightAmountCol) . $row);
        }
        
        // 設置列寬
        $sheet->getColumnDimension('A')->setWidth(15); // 日期列
        $sheet->getColumnDimension('B')->setWidth(10); // 星期列
        for ($c = 3; $c <= $totalCols; $c++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($c))->setWidth(12);
        }
        
        // 設置所有儲存格的邊框
        $highestRow = $sheet->getHighestRow();
        $highestCol = $sheet->getHighestColumn();
        $sheet->getStyle('A1:' . $highestCol . $highestRow)->applyFromArray([
            'borders' => [
                'allBorders' => [
                    'borderStyle' => Border::BORDER_THIN,
                    'color' => ['rgb' => '000000'],
                ],
            ],
        ]);
        
        // 設置第一行高度
        $sheet->getRowDimension(1)->setRowHeight(40);
        
        return $spreadsheet;
    }
}
