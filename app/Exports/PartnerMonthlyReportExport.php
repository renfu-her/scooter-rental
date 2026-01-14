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
    protected $year;
    protected $month;
    protected $dates;
    protected $models;
    protected $weekdayMap;

    public function __construct($partnerName, $year, $month, $dates, $models)
    {
        $this->partnerName = $partnerName;
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
        
        $row = 1;
        
        // 計算總列數：日期(1) + 星期(1) + 當日租200/台(1) + 跨日租300/台(1) + 每個型號(4列)
        $totalCols = 2 + 2 + count($this->models) * 4;
        $lastCol = Coordinate::stringFromColumnIndex($totalCols);
        
        // 第一行：標題
        $sheet->setCellValue('A' . $row, $this->partnerName . '機車出租月報表');
        $sheet->mergeCells('A' . $row . ':' . $lastCol . $row);
        $sheet->getStyle('A' . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $sheet->getStyle('A' . $row)->getFont()->setSize(14);
        $row++;
        
        // 第二行：當日租 200/台、跨日租 300/台，然後是機車型號
        $col = 1;
        $sheet->setCellValueByColumnAndRow($col, $row, '當日租 200/台');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '跨日租 300/台');
        $col++;
        
        // 每個型號佔 4 列
        foreach ($this->models as $model) {
            $modelStartCol = $col;
            $modelEndCol = $col + 3;
            $sheet->mergeCells(Coordinate::stringFromColumnIndex($modelStartCol) . $row . ':' . Coordinate::stringFromColumnIndex($modelEndCol) . $row);
            $sheet->setCellValueByColumnAndRow($modelStartCol, $row, $model);
            $sheet->getStyle(Coordinate::stringFromColumnIndex($modelStartCol) . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $col = $modelEndCol + 1;
        }
        $row++;
        
        // 第三行：日期、星期，然後每個型號下分為當日租(1列)和跨日租(3列)
        $col = 1;
        $sheet->setCellValueByColumnAndRow($col, $row, '日期');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '星期');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        
        foreach ($this->models as $model) {
            // 當日租 (1列)
            $sheet->setCellValueByColumnAndRow($col, $row, '當日租');
            $col++;
            
            // 跨日租 (3列合併)
            $overnightStartCol = $col;
            $overnightEndCol = $col + 2;
            $sheet->mergeCells(Coordinate::stringFromColumnIndex($overnightStartCol) . $row . ':' . Coordinate::stringFromColumnIndex($overnightEndCol) . $row);
            $sheet->setCellValueByColumnAndRow($overnightStartCol, $row, '跨日租');
            $sheet->getStyle(Coordinate::stringFromColumnIndex($overnightStartCol) . $row)->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
            $col = $overnightEndCol + 1;
        }
        $row++;
        
        // 第四行：空白、空白、空白、空白，然後每個型號下：當日租只有台數(1列)，跨日租有台數、天數、金額(3列)
        $col = 1;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        
        foreach ($this->models as $model) {
            $sheet->setCellValueByColumnAndRow($col, $row, '台數');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '台數');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '天數');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '金額');
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
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
            $sheet->setCellValueByColumnAndRow($col, $row, '');
            $col++;
            
            foreach ($this->models as $model) {
                $modelData = $dateItem['models'][$model] ?? [
                    'same_day_count' => 0,
                    'same_day_days' => 0,
                    'same_day_amount' => 0,
                    'overnight_count' => 0,
                    'overnight_days' => 0,
                    'overnight_amount' => 0,
                ];
                
                $hasSameDayFee = $modelData['same_day_amount'] > 0;
                $hasOvernightFee = $modelData['overnight_amount'] > 0;
                
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
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
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
                $modelData = $dateItem['models'][$model] ?? [
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
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        
        foreach ($this->models as $model) {
            $modelTotalAmount = 0;
            foreach ($this->dates as $dateItem) {
                $modelData = $dateItem['models'][$model] ?? [
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
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        
        // 第一個型號的跨日租金額欄位
        $firstModelOvernightAmountCol = $col + 2; // 跳過當日租台數、跨日租台數、跨日租天數
        $lastModelOvernightAmountCol = $firstModelOvernightAmountCol + (count($this->models) - 1) * 4;
        
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, '');
        $col++;
        $sheet->setCellValueByColumnAndRow($col, $row, $grandTotalAmount > 0 ? $grandTotalAmount : '');
        
        // 合併總金額欄位
        if (count($this->models) > 1) {
            $sheet->mergeCells(Coordinate::stringFromColumnIndex($firstModelOvernightAmountCol) . $row . ':' . Coordinate::stringFromColumnIndex($lastModelOvernightAmountCol) . $row);
        }
        
        // 設置列寬
        for ($c = 1; $c <= $totalCols; $c++) {
            $sheet->getColumnDimension(Coordinate::stringFromColumnIndex($c))->setWidth(12);
        }
        
        return $spreadsheet;
    }
}
