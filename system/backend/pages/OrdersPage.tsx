import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Plus, Filter, FileText, ChevronLeft, ChevronRight, MoreHorizontal, Bike, X, TrendingUp, Loader2, Edit3, Trash2, ChevronDown, ChevronUp, Download, Bell, XCircle } from 'lucide-react';
import AddOrderModal from '../components/AddOrderModal';
import ConvertBookingModal from '../components/ConvertBookingModal';
import { ordersApi, partnersApi, bookingsApi, rentalPlansApi, scooterModelsApi } from '../lib/api';
import { useStore } from '../contexts/StoreContext';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface Store {
  id: number;
  name: string;
}

interface Order {
  id: number;
  order_number: string;
  status: string;
  tenant: string;
  appointment_date: string;
  sort_order?: number;
  start_time: string;
  end_time: string;
  expected_return_time: string | null;
  scooters: Array<{ model: string; type?: string; count: number }>;
  scooter_ids?: number[]; // 機車 ID 列表（用於編輯）
  shipping_company: string | null;
  ship_arrival_time: string | null;
  ship_return_time: string | null;
  phone: string | null;
  partner: { id: number; name: string } | null;
  store?: { id: number; name: string } | null;
  store_id?: number | null;
  payment_method: string | null;
  payment_amount: number;
  remark: string | null;
}

interface Statistics {
  partner_stats: Record<string, { count: number; amount: number }>;
  total_count: number;
  total_amount: number;
  month: string;
}

const StatsModal: React.FC<{ isOpen: boolean; onClose: () => void; stats: Statistics | null; currentStore: Store | null }> = ({ isOpen, onClose, stats, currentStore }) => {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPartnerReport = async (partnerName: string, partnerId?: number) => {
    if (!stats || !partnerId) return;
    
    setIsExporting(true);
    try {
      const selectedMonthString = stats.month;
      const [year, month] = selectedMonthString.split('-');
      
      // 1. 從後端獲取 JSON 數據
      const response = await ordersApi.partnerDailyReport(selectedMonthString, partnerId, 'json', currentStore?.id);
      const reportData = response.data;
      
      // 找到對應的合作商數據
      const partnerData = reportData.partners?.find((p: any) => p.partner_id === partnerId);
      if (!partnerData) {
        alert('找不到合作商數據');
        return;
      }

      const dates = partnerData.dates || [];
      const allModels = reportData.models || [];
      const storeName = partnerData.store_name || reportData.store_name || null;

      // 驗證數據
      if (!Array.isArray(allModels) || allModels.length === 0) {
        alert('機車型號列表為空，無法匯出');
        return;
      }

      // 2. 使用 ExcelJS 產生帶樣式的 Excel（支持顏色）
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('月報表');

      // 計算總列數：日期(1) + 星期(1) + 每個型號(4列：當日租台數(1) + 跨日租台數(1) + 跨日租天數(1) + 金額(1，共用))
      const totalCols = 2 + allModels.length * 4;
      
      // 驗證總列數（Excel 最大列數為 16384）
      if (totalCols < 1 || totalCols > 16384) {
        alert(`總列數超出有效範圍: ${totalCols}`);
        return;
      }
      
      // 星期對應表
      const weekdayMap: Record<string, string> = {
        'Monday': '星期一',
        'Tuesday': '星期二',
        'Wednesday': '星期三',
        'Thursday': '星期四',
        'Friday': '星期五',
        'Saturday': '星期六',
        'Sunday': '星期日',
      };

      let rowNumber = 1;

      // 設置列寬
      for (let i = 1; i <= totalCols; i++) {
        if (i === 1) {
          // 日期欄位使用自動寬度或較大寬度
          worksheet.getColumn(i).width = 18; // 日期欄位較寬
        } else if (i === 2) {
          // 星期欄位加寬
          worksheet.getColumn(i).width = 15; // 星期欄位較寬
        } else {
          worksheet.getColumn(i).width = 12;
        }
      }

      // 定義邊框樣式（通用）- 必須在使用前定義
      const borderStyle = {
        top: { style: 'thin' as const, color: { argb: 'FF000000' } },
        bottom: { style: 'thin' as const, color: { argb: 'FF000000' } },
        left: { style: 'thin' as const, color: { argb: 'FF000000' } },
        right: { style: 'thin' as const, color: { argb: 'FF000000' } }
      };

      // 定義樣式 - 必須在使用前定義
      const titleStyle = {
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFB4C6E7' } // 淺藍色背景
        },
        font: { bold: true, size: 14, color: { argb: 'FF000000' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: borderStyle
      };

      const headerStyle = {
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFD9E1F2' } // 淺灰色背景
        },
        font: { bold: true, color: { argb: 'FF000000' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: borderStyle
      };

      const dataRowStyle = {
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFFFFFFF' } // 白色背景
        },
        font: { color: { argb: 'FF000000' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: borderStyle
      };

      const dataRowAlternateStyle = {
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFF2F2F2' } // 淺灰色背景（交替行）
        },
        font: { color: { argb: 'FF000000' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: borderStyle
      };

      const totalRowStyle = {
        fill: {
          type: 'pattern' as const,
          pattern: 'solid' as const,
          fgColor: { argb: 'FFFFD966' } // 黃色背景
        },
        font: { bold: true, color: { argb: 'FF000000' } },
        alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
        border: borderStyle
      };

      // 第一行：標題「合作商機車出租月報表」（合併所有列）
      const titleCell = worksheet.getCell(rowNumber, 1);
      titleCell.value = `${partnerName}機車出租月報表`;
      worksheet.mergeCells(rowNumber, 1, rowNumber, totalCols);
      titleCell.font = titleStyle.font;
      titleCell.fill = titleStyle.fill;
      titleCell.alignment = titleStyle.alignment;
      titleCell.border = titleStyle.border;
      // 為標題行的所有單元格設置邊框
      for (let c = 1; c <= totalCols; c++) {
        const cell = worksheet.getCell(rowNumber, c);
        cell.border = borderStyle;
      }
      rowNumber++;

      // 第二行：店家名稱（如果有的話）
      if (storeName) {
        const storeNameCell = worksheet.getCell(rowNumber, 1);
        storeNameCell.value = storeName;
        worksheet.mergeCells(rowNumber, 1, rowNumber, totalCols);
        storeNameCell.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
        storeNameCell.fill = titleStyle.fill;
        storeNameCell.alignment = titleStyle.alignment;
        storeNameCell.border = titleStyle.border;
        // 為店家名稱行的所有單元格設置邊框
        for (let c = 1; c <= totalCols; c++) {
          const cell = worksheet.getCell(rowNumber, c);
          cell.border = borderStyle;
        }
        rowNumber++;
      }

      // 第三行：前面兩欄空白，然後機車型號標題（每個型號佔 4 欄）
      const headerRow2 = worksheet.getRow(rowNumber);
      let colIndex = 1;
      // 為前兩欄設置樣式和邊框
      const blankCell1 = headerRow2.getCell(colIndex++);
      blankCell1.value = ''; // 第一欄空白
      blankCell1.font = headerStyle.font;
      blankCell1.fill = headerStyle.fill;
      blankCell1.alignment = headerStyle.alignment;
      blankCell1.border = headerStyle.border;
      const blankCell2 = headerRow2.getCell(colIndex++);
      blankCell2.value = ''; // 第二欄空白
      blankCell2.font = headerStyle.font;
      blankCell2.fill = headerStyle.fill;
      blankCell2.alignment = headerStyle.alignment;
      blankCell2.border = headerStyle.border;
      
      allModels.forEach((model: string, modelIndex: number) => {
        const modelStartCol = colIndex;
        headerRow2.getCell(modelStartCol).value = model;
        // 合併每個型號的標題（4 列）
        worksheet.mergeCells(rowNumber, modelStartCol, rowNumber, modelStartCol + 3);
        headerRow2.getCell(modelStartCol).font = headerStyle.font;
        headerRow2.getCell(modelStartCol).fill = headerStyle.fill;
        headerRow2.getCell(modelStartCol).alignment = headerStyle.alignment;
        
        // 為合併的單元格設置樣式
        for (let c = modelStartCol; c <= modelStartCol + 3; c++) {
          const cell = headerRow2.getCell(c);
          cell.font = headerStyle.font;
          cell.fill = headerStyle.fill;
          cell.alignment = headerStyle.alignment;
          cell.border = headerStyle.border;
        }
        
        colIndex += 4;
      });
      rowNumber++;

      // 第四行：當日租（1 欄）、跨日租（3 欄）
      const headerRow3 = worksheet.getRow(rowNumber);
      colIndex = 1;
      // 為前兩欄設置樣式和邊框
      const blankCell3_1 = headerRow3.getCell(colIndex++);
      blankCell3_1.value = ''; // 第一欄空白
      blankCell3_1.font = headerStyle.font;
      blankCell3_1.fill = headerStyle.fill;
      blankCell3_1.alignment = headerStyle.alignment;
      blankCell3_1.border = headerStyle.border;
      const blankCell3_2 = headerRow3.getCell(colIndex++);
      blankCell3_2.value = ''; // 第二欄空白
      blankCell3_2.font = headerStyle.font;
      blankCell3_2.fill = headerStyle.fill;
      blankCell3_2.alignment = headerStyle.alignment;
      blankCell3_2.border = headerStyle.border;
      
      allModels.forEach(() => {
        const sameDayCell = headerRow3.getCell(colIndex++);
        sameDayCell.value = '當日租';
        sameDayCell.font = headerStyle.font;
        sameDayCell.fill = headerStyle.fill;
        sameDayCell.alignment = headerStyle.alignment;
        sameDayCell.border = headerStyle.border;
        
        // 跨日租合併 3 列（台數、天數、金額）
        const overnightStartCol = colIndex;
        headerRow3.getCell(overnightStartCol).value = '跨日租';
        worksheet.mergeCells(rowNumber, overnightStartCol, rowNumber, overnightStartCol + 2);
        const overnightCell = headerRow3.getCell(overnightStartCol);
        overnightCell.font = headerStyle.font;
        overnightCell.fill = headerStyle.fill;
        overnightCell.alignment = headerStyle.alignment;
        overnightCell.border = headerStyle.border;
        
        // 為合併的單元格設置樣式
        for (let c = overnightStartCol; c <= overnightStartCol + 2; c++) {
          const cell = headerRow3.getCell(c);
          cell.font = headerStyle.font;
          cell.fill = headerStyle.fill;
          cell.alignment = headerStyle.alignment;
          cell.border = headerStyle.border;
        }
        
        colIndex += 3;
      });
      rowNumber++;

      // 第五行：日期、星期（前兩欄），然後是台數（當日租下）、台數、天數、金額（跨日租下，金額共用）
      const headerRow4 = worksheet.getRow(rowNumber);
      colIndex = 1;
      // 為前兩欄設置樣式和邊框（日期和星期）
      const dateCell = headerRow4.getCell(colIndex++);
      dateCell.value = '日期'; // 第一欄：日期
      dateCell.font = headerStyle.font;
      dateCell.fill = headerStyle.fill;
      dateCell.alignment = headerStyle.alignment;
      dateCell.border = headerStyle.border;
      const weekdayCell = headerRow4.getCell(colIndex++);
      weekdayCell.value = '星期'; // 第二欄：星期
      weekdayCell.font = headerStyle.font;
      weekdayCell.fill = headerStyle.fill;
      weekdayCell.alignment = headerStyle.alignment;
      weekdayCell.border = headerStyle.border;
      
      allModels.forEach(() => {
        headerRow4.getCell(colIndex++).value = '台數'; // 當日租：台數
        headerRow4.getCell(colIndex++).value = '台數'; // 跨日租：台數
        headerRow4.getCell(colIndex++).value = '天數'; // 跨日租：天數
        headerRow4.getCell(colIndex++).value = '金額'; // 金額（共用）
        
        // 為表頭行設置樣式
        for (let c = colIndex - 4; c < colIndex; c++) {
          const cell = headerRow4.getCell(c);
          cell.font = headerStyle.font;
          cell.fill = headerStyle.fill;
          cell.alignment = headerStyle.alignment;
          cell.border = headerStyle.border;
        }
      });
      rowNumber++;

      // 凍結表頭行（根據是否有店家名稱決定）
      // 如果有店家名稱：凍結前 5 行（標題、店家名稱、機車型號、當日租/跨日租、日期/星期）
      // 如果沒有店家名稱：凍結前 4 行
      const frozenRows = storeName ? 5 : 4;
      worksheet.views = [{ state: 'frozen', ySplit: frozenRows }];

      // 數據行開始：日期、星期、數據

      // 數據行（按 order_number 分開顯示）
      dates.forEach((dateItem: any) => {
        const dateStr = dateItem.date;
        const dateObj = new Date(dateStr + 'T00:00:00');
        const formattedDate = `${dateObj.getFullYear()}年${String(dateObj.getMonth() + 1).padStart(2, '0')}月${String(dateObj.getDate()).padStart(2, '0')}日`;
        const weekday = weekdayMap[dateItem.weekday] || dateItem.weekday;

        // 如果該日期有多個訂單，每個訂單顯示一行
        const orders = dateItem.orders || [];
        
        if (orders.length === 0) {
          // 沒有訂單的日期，顯示空行
          const emptyRow = worksheet.getRow(rowNumber);
          emptyRow.getCell(1).value = formattedDate;
          emptyRow.getCell(2).value = weekday;
          // 其他欄位為空
          const dataStartRow = storeName ? 6 : 5; // 數據行開始的行號
          const isAlternate = (rowNumber - dataStartRow) % 2 === 1;
          const rowStyle = isAlternate ? dataRowAlternateStyle : dataRowStyle;
          for (let c = 1; c <= totalCols; c++) {
            const cell = emptyRow.getCell(c);
            cell.fill = rowStyle.fill;
            cell.font = rowStyle.font;
            cell.alignment = rowStyle.alignment;
            cell.border = rowStyle.border;
          }
          rowNumber++;
        } else {
          // 每個訂單顯示一行
          orders.forEach((order: any, orderIndex: number) => {
            const dataRow = worksheet.getRow(rowNumber);
            let cellIndex = 1;
            
            dataRow.getCell(cellIndex++).value = orderIndex === 0 ? formattedDate : '';
            dataRow.getCell(cellIndex++).value = orderIndex === 0 ? weekday : '';

            const dataStartRow = storeName ? 6 : 5; // 數據行開始的行號
            const isAlternate = (rowNumber - dataStartRow) % 2 === 1;
            const rowStyle = isAlternate ? dataRowAlternateStyle : dataRowStyle;
            
            allModels.forEach((model: string) => {
              const modelData = order.models?.find((m: any) => `${m.model} ${m.type}` === model) || {
                same_day_count: '',
                same_day_days: '',
                same_day_amount: '',
                overnight_count: '',
                overnight_days: '',
                overnight_amount: '',
              };

              // 將空字符串轉換為數字 0 進行比較
              const sameDayCount = modelData.same_day_count === '' ? 0 : Number(modelData.same_day_count) || 0;
              const sameDayAmount = modelData.same_day_amount === '' ? 0 : Number(modelData.same_day_amount) || 0;
              const overnightCount = modelData.overnight_count === '' ? 0 : Number(modelData.overnight_count) || 0;
              const overnightDays = modelData.overnight_days === '' ? 0 : Number(modelData.overnight_days) || 0;
              const overnightAmount = modelData.overnight_amount === '' ? 0 : Number(modelData.overnight_amount) || 0;

              const hasSameDay = sameDayCount > 0;
              const hasOvernight = overnightCount > 0;

              // 每個型號：當日租台數(1欄)、跨日租台數(1欄)、跨日租天數(1欄)、金額(1欄，共用)
              // 金額全部寫在第 4 欄（當日租和跨日租共用）
              const amount = hasSameDay ? sameDayAmount : (hasOvernight ? overnightAmount : '');
              
              dataRow.getCell(cellIndex++).value = hasSameDay ? sameDayCount : '';
              dataRow.getCell(cellIndex++).value = hasOvernight ? overnightCount : '';
              dataRow.getCell(cellIndex++).value = hasOvernight ? overnightDays : '';
              // 金額欄位：設置黑色字體（只有總金額行的總金額數值才是紅色）
              const amountCell = dataRow.getCell(cellIndex++);
              amountCell.value = amount;
              amountCell.fill = rowStyle.fill;
              amountCell.alignment = rowStyle.alignment;
              amountCell.border = rowStyle.border;
              // 所有數據行的金額都設置為黑色字體
              amountCell.font = rowStyle.font;
            });

            // 設置數據行樣式（跳過已設置的金額欄位）
            for (let c = 1; c <= totalCols; c++) {
              const cell = dataRow.getCell(c);
              // 檢查是否是金額欄位（每 4 列中的第 4 列，從第 3 列開始計算）
              const isAmountColumn = (c - 2) > 0 && (c - 2) % 4 === 0;
              if (!isAmountColumn) {
                // 非金額欄位，正常設置樣式
                cell.fill = rowStyle.fill;
                cell.font = rowStyle.font;
                cell.alignment = rowStyle.alignment;
                cell.border = rowStyle.border;
              } else {
                // 金額欄位，設置樣式（字體已在上面設置為黑色）
                cell.fill = rowStyle.fill;
                cell.font = rowStyle.font; // 確保為黑色字體
                cell.alignment = rowStyle.alignment;
                cell.border = rowStyle.border;
              }
            }
            
            rowNumber++;
          });
        }
      });

      // 計算總計數據
      let grandTotalAmount = 0;
      const modelTotals: Record<string, {
        sameDayCount: number;
        sameDayDays: number;
        sameDayAmount: number;
        overnightCount: number;
        overnightDays: number;
        overnightAmount: number;
        totalAmount: number;
      }> = {};

      allModels.forEach((model: string) => {
        modelTotals[model] = {
          sameDayCount: 0,
          sameDayDays: 0,
          sameDayAmount: 0,
          overnightCount: 0,
          overnightDays: 0,
          overnightAmount: 0,
          totalAmount: 0,
        };

        dates.forEach((dateItem: any) => {
          const orders = dateItem.orders || [];
          orders.forEach((order: any) => {
            const modelData = order.models?.find((m: any) => `${m.model} ${m.type}` === model) || {
              same_day_count: '',
              same_day_days: '',
              same_day_amount: '',
              overnight_count: '',
              overnight_days: '',
              overnight_amount: '',
            };
            
            modelTotals[model].sameDayCount += modelData.same_day_count === '' ? 0 : Number(modelData.same_day_count) || 0;
            modelTotals[model].sameDayDays += modelData.same_day_days === '' ? 0 : Number(modelData.same_day_days) || 0;
            modelTotals[model].sameDayAmount += modelData.same_day_amount === '' ? 0 : Number(modelData.same_day_amount) || 0;
            modelTotals[model].overnightCount += modelData.overnight_count === '' ? 0 : Number(modelData.overnight_count) || 0;
            modelTotals[model].overnightDays += modelData.overnight_days === '' ? 0 : Number(modelData.overnight_days) || 0;
            modelTotals[model].overnightAmount += modelData.overnight_amount === '' ? 0 : Number(modelData.overnight_amount) || 0;
          });
        });

        modelTotals[model].totalAmount = modelTotals[model].sameDayAmount + modelTotals[model].overnightAmount;
        grandTotalAmount += modelTotals[model].totalAmount;
      });

      // 月結總計 - 總台數/天數行
      const totalRow1 = worksheet.getRow(rowNumber);
      totalRow1.getCell(1).value = '月結總計';
      totalRow1.getCell(2).value = '總台數/天數';
      let colIdx = 3;
      
      allModels.forEach((model: string) => {
        const totals = modelTotals[model];
        totalRow1.getCell(colIdx++).value = totals.sameDayCount > 0 ? totals.sameDayCount : '';
        totalRow1.getCell(colIdx++).value = totals.overnightCount > 0 ? totals.overnightCount : '';
        totalRow1.getCell(colIdx++).value = totals.overnightDays > 0 ? totals.overnightDays : '';
        // 金額欄位：設置黑色字體（只有總金額行的總金額數值才是紅色）
        const amountCell = totalRow1.getCell(colIdx++);
        amountCell.value = totals.totalAmount > 0 ? totals.totalAmount : '';
        // 所有數值都設置為黑色字體
      });
      
      // 設置整行的總計行樣式（包括前兩列）- 所有數值都為黑色
      for (let c = 1; c <= totalCols; c++) {
        const cell = totalRow1.getCell(c);
        cell.fill = totalRowStyle.fill;
        cell.alignment = totalRowStyle.alignment;
        cell.border = totalRowStyle.border;
        // 所有數值都設置為黑色字體
        cell.font = totalRowStyle.font;
      }
      rowNumber++;

      // 小計行：每個型號顯示該型號的總金額（當日租 + 跨日租）
      const subtotalRow = worksheet.getRow(rowNumber);
      subtotalRow.getCell(1).value = '';
      // 「小計」文字保持黑色
      const subtotalLabelCell = subtotalRow.getCell(2);
      subtotalLabelCell.value = '小計';
      subtotalLabelCell.font = totalRowStyle.font; // 黑色字體
      subtotalLabelCell.fill = totalRowStyle.fill;
      subtotalLabelCell.alignment = totalRowStyle.alignment;
      subtotalLabelCell.border = totalRowStyle.border;
      
      // 計算所有小計的總和（用於總金額行）
      let allSubtotalsSum = 0;
      
      // 每個車款有 4 個欄位（當日租台數、跨日租台數、跨日租天數、金額）
      // 第一個車款從第 3 列開始（日期=1, 星期=2）
      allModels.forEach((model: string, modelIndex: number) => {
        const totals = modelTotals[model];
        const modelSubtotalAmount = totals.sameDayAmount + totals.overnightAmount;
        allSubtotalsSum += modelSubtotalAmount; // 累加所有小計
        
        // 計算每個車款的起始列和結束列
        const modelStartCol = 3 + modelIndex * 4; // 第 3 列開始，每個車款佔 4 列
        const modelEndCol = modelStartCol + 3; // 結束列（包含 4 個欄位）
        
        // 將該車款的 4 個欄位合併成一個單元格
        if (modelStartCol < modelEndCol) {
          try {
            worksheet.mergeCells(rowNumber, modelStartCol, rowNumber, modelEndCol);
          } catch (mergeError) {
            console.warn(`合併車款 ${model} 小計欄位時發生錯誤:`, mergeError);
          }
        }
        
        // 在合併後的單元格中設置小計金額（黑色字體）
        const subtotalCell = subtotalRow.getCell(modelStartCol);
        subtotalCell.value = modelSubtotalAmount > 0 ? modelSubtotalAmount : '';
        subtotalCell.font = totalRowStyle.font; // 黑色字體
        subtotalCell.fill = totalRowStyle.fill;
        subtotalCell.alignment = totalRowStyle.alignment;
        subtotalCell.border = totalRowStyle.border;
      });
      
      // 設置整行的其他單元格樣式（「小計」文字已在上面設置，合併的單元格也已在上面設置）
      // 這裡只需要確保沒有遺漏的單元格（實際上應該都已經設置了）
      for (let c = 3; c <= totalCols; c++) {
        const cell = subtotalRow.getCell(c);
        // 只設置還沒有設置過的單元格（理論上應該都已經設置了）
        if (!cell.value && cell.value !== 0) {
          cell.fill = totalRowStyle.fill;
          cell.font = totalRowStyle.font;
          cell.alignment = totalRowStyle.alignment;
          cell.border = totalRowStyle.border;
        }
      }
      rowNumber++;

      // 總金額行：顯示所有小計加起來的總金額
      // 第一個型號的金額欄位：日期(1) + 星期(1) + 當日租台數(1) + 跨日租台數(1) + 跨日租天數(1) = 6
      const firstModelAmountCol = 6; // 第一個型號的金額欄位（第 6 列）
      const lastModelAmountCol = firstModelAmountCol + (allModels.length - 1) * 4; // 最後一個型號的金額欄位
      
      const totalAmountRow = worksheet.getRow(rowNumber);
      // 第一欄：空白（與「月結總計」合併），設置黑色字體
      const totalBlankCell1 = totalAmountRow.getCell(1);
      totalBlankCell1.value = '';
      totalBlankCell1.font = totalRowStyle.font; // 黑色字體
      totalBlankCell1.fill = totalRowStyle.fill;
      totalBlankCell1.alignment = totalRowStyle.alignment;
      totalBlankCell1.border = totalRowStyle.border;
      
      // 第二欄：「總金額」標籤，設置紅色字體
      const totalLabelCell = totalAmountRow.getCell(2);
      totalLabelCell.value = '總金額';
      totalLabelCell.font = { ...totalRowStyle.font, color: { argb: 'FFFF0000' } }; // 紅色字體
      totalLabelCell.fill = totalRowStyle.fill;
      totalLabelCell.alignment = totalRowStyle.alignment;
      totalLabelCell.border = totalRowStyle.border;
      
      // 在「總金額」之後，將所有型號的欄位（當日租台數、跨日租台數、跨日租天數、金額）合併成一個大單元格
      // 起始列：第 3 列（「總金額」之後的第一列）
      // 結束列：最後一列（totalCols）
      const totalAmountStartCol = 3;
      const totalAmountEndCol = totalCols;
      
      // 設置第一個單元格的值為總金額（紅色字體）
      const totalAmountCell = totalAmountRow.getCell(totalAmountStartCol);
      totalAmountCell.value = allSubtotalsSum > 0 ? allSubtotalsSum : '';
      // 直接設置紅色字體，確保總金額數值為紅色
      if (allSubtotalsSum > 0) {
        totalAmountCell.font = { ...totalRowStyle.font, color: { argb: 'FFFF0000' } }; // 紅色字體
      }
      totalAmountCell.fill = totalRowStyle.fill;
      totalAmountCell.alignment = totalRowStyle.alignment;
      totalAmountCell.border = totalRowStyle.border;
      
      // 合併「總金額」之後的所有欄位（從第 3 列到最後一列）
      if (totalAmountStartCol < totalAmountEndCol) {
        try {
          worksheet.mergeCells(rowNumber, totalAmountStartCol, rowNumber, totalAmountEndCol);
        } catch (mergeError) {
          console.warn('合併總金額欄位時發生錯誤:', mergeError);
        }
      }
      
      // 合併「月結總計」垂直方向（合併總台數/天數、小計、總金額三行）
      if (rowNumber >= 3) {
        try {
          worksheet.mergeCells(rowNumber - 2, 1, rowNumber, 1);
        } catch (mergeError) {
          console.warn('合併月結總計欄位時發生錯誤:', mergeError);
        }
      }
      
      // 設置總金額行樣式：總金額數值為紅色，其他為黑色
      // 注意：合併後的單元格使用第一個單元格的樣式，所以只需要確保第一個單元格是紅色即可
      for (let c = 3; c <= totalCols; c++) {
        const cell = totalAmountRow.getCell(c);
        cell.fill = totalRowStyle.fill;
        cell.alignment = totalRowStyle.alignment;
        cell.border = totalRowStyle.border;
        // 如果是總金額數值單元格（合併區域的第一個單元格），設置紅色字體
        // 其他單元格（如果沒有被合併）設置黑色字體
        if (c === totalAmountStartCol && allSubtotalsSum > 0) {
          cell.font = { ...totalRowStyle.font, color: { argb: 'FFFF0000' } }; // 紅色字體
        } else if (c > totalAmountStartCol && c <= totalAmountEndCol) {
          // 合併區域內的其他單元格（不會顯示，但為保險起見設置樣式）
          cell.font = { ...totalRowStyle.font, color: { argb: 'FFFF0000' } }; // 紅色字體（與合併單元格一致）
        } else {
          cell.font = totalRowStyle.font; // 黑色字體
        }
      }

      // 生成文件名
      const fileName = `${partnerName}-${year}${String(parseInt(month)).padStart(2, '0')}.xlsx`;

      // 下載文件（使用 ExcelJS）
      try {
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } catch (writeError) {
        console.error('ExcelJS writeBuffer 錯誤:', writeError);
        throw writeError;
      }

    } catch (error) {
      console.error('匯出合作商月報表時發生錯誤:', error);
      alert('匯出合作商月報表時發生錯誤，請稍後再試');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen || !stats) return null;
  
  const startDate = new Date(stats.month + '-01');
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            合作商單月詳細統計
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">全平台總業績</p>
                <p className="text-2xl font-black text-blue-800 dark:text-blue-300">${stats.total_amount.toLocaleString()}</p>
             </div>
             <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">全平台總車次</p>
                <p className="text-2xl font-black text-orange-800 dark:text-orange-300">{stats.total_count} 台</p>
             </div>
          </div>
          <div className="space-y-3">
             <p className="text-sm font-bold text-gray-700 dark:text-gray-300">各店業績分佈</p>
             <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">
                {Object.entries(stats.partner_stats).map(([partner, data], index) => {
                  // 生成隨機顏色（不重複）
                  const colors = [
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                    'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                    'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                    'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
                    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
                  ];
                  const colorClass = colors[index % colors.length];
                  
                  return (
                    <div key={partner} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg ${colorClass} flex items-center justify-center text-xs font-bold`}>
                          {partner.charAt(0)}
                        </div>
                        <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{partner}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100">${(data as { count: number; amount: number }).amount.toLocaleString()}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{(data as { count: number; amount: number }).count} 台租借</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const partnerId = (data as any).partner_id;
                            handleExportPartnerReport(partner, partnerId);
                          }}
                          disabled={isExporting}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isExporting ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              <span>匯出中...</span>
                            </>
                          ) : (
                            <>
                              <Download size={14} />
                              <span>Export</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
             </div>
          </div>
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-700">
           <p className="text-xs text-gray-400 dark:text-gray-500 italic">
             統計週期：{startDate.getFullYear()}/{String(startDate.getMonth() + 1).padStart(2, '0')}/01 - {endDate.getFullYear()}/{String(endDate.getMonth() + 1).padStart(2, '0')}/{endDate.getDate()}
           </p>
        </div>
      </div>
    </div>
  );
};

// 合作商分類 Modal
interface PartnerMonthlyStatisticsData {
  partners: Array<{
    partner_id: number;
    partner_name: string;
    dates: Array<{
      date: string;
      weekday: string;
      models: Array<{
        model: string;
        same_day_count: number;
        same_day_days: number;
        same_day_amount: number;
        overnight_count: number;
        overnight_days: number;
        overnight_amount: number;
        total_count: number;
        total_days: number;
        total_amount: number;
      }>;
    }>;
  }>;
  headers: string[];
}

const PartnerCategoryModal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  month: string;
}> = ({ isOpen, onClose, month }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<PartnerMonthlyStatisticsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && month) {
      fetchData();
    }
  }, [isOpen, month]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await ordersApi.partnerMonthlyStatistics(month);
      setData(response.data);
    } catch (err: any) {
      console.error('獲取合作商分類數據失敗:', err);
      setError(err.response?.data?.message || '獲取數據失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const weekdayMap: Record<string, string> = {
    'Monday': '星期一',
    'Tuesday': '星期二',
    'Wednesday': '星期三',
    'Thursday': '星期四',
    'Friday': '星期五',
    'Saturday': '星期六',
    'Sunday': '星期日',
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            合作商單月分類統計
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12">
              <XCircle size={48} className="text-red-500 mb-4" />
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : data && data.partners.length > 0 ? (
            <div className="space-y-6">
              {data.partners.map((partner) => {
                // 只顯示有 partner_id 的合作商
                if (!partner.partner_id) return null;

                // 計算總台數和總金額（包含當日租和跨日租）
                const totalCount = partner.dates.reduce((sum, date) => 
                  sum + date.models.reduce((s, m) => s + (m.total_count || 0), 0), 0
                );
                const totalAmount = partner.dates.reduce((sum, date) => 
                  sum + date.models.reduce((s, m) => s + (m.total_amount || 0), 0), 0
                );

                return (
                  <div key={partner.partner_id} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                          {partner.partner_name}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm">
                          <span className="text-gray-600 dark:text-gray-400">
                            總台數: <span className="font-bold text-gray-800 dark:text-gray-100">{totalCount}</span>
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">
                            總金額: <span className="font-bold text-green-600 dark:text-green-400">${totalAmount.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                          <tr>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                              日期
                            </th>
                            <th rowSpan={2} className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                              星期
                            </th>
                            {data.headers.map((header) => (
                              <th key={header} colSpan={2} className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600">
                                {header}
                              </th>
                            ))}
                            <th rowSpan={2} className="px-4 py-3 text-center text-xs font-bold text-green-700 dark:text-green-300 border-l-2 border-green-500 dark:border-green-400 bg-green-100 dark:bg-green-900/30">
                              總金額
                            </th>
                          </tr>
                          <tr>
                            {data.headers.map((header) => (
                              <React.Fragment key={header}>
                                <th className="px-2 py-2 text-center text-xs font-semibold text-blue-600 dark:text-blue-400 border-r border-gray-200 dark:border-gray-600 bg-blue-50 dark:bg-blue-900/20">
                                  當日租
                                </th>
                                <th className="px-2 py-2 text-center text-xs font-semibold text-orange-600 dark:text-orange-400 border-r border-gray-200 dark:border-gray-600 bg-orange-50 dark:bg-orange-900/20">
                                  跨日租
                                </th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {partner.dates.map((dateItem) => {
                            const dateObj = new Date(dateItem.date + 'T00:00:00');
                            const formattedDate = `${dateObj.getFullYear()}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${String(dateObj.getDate()).padStart(2, '0')}`;
                            const weekday = weekdayMap[dateItem.weekday] || dateItem.weekday;

                            return (
                              <tr key={dateItem.date} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                <td className="px-4 py-3 text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600 font-medium">
                                  {formattedDate}
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-600">
                                  {weekday}
                                </td>
                                {data.headers.map((header) => {
                                  const modelData = dateItem.models.find(m => m.model === header);
                                  return (
                                    <React.Fragment key={header}>
                                      {/* 當日租 */}
                                      <td className="px-2 py-3 text-center border-r border-gray-200 dark:border-gray-600 bg-blue-50/30 dark:bg-blue-900/10">
                                        {modelData && (modelData.same_day_count > 0 || modelData.same_day_amount > 0) ? (
                                          <div className="space-y-1">
                                            <div className="text-gray-800 dark:text-gray-200 font-medium text-xs">
                                              台數: {modelData.same_day_count}
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-400 text-xs">
                                              天數: {modelData.same_day_days}
                                            </div>
                                            <div className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                                              ${modelData.same_day_amount.toLocaleString()}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                                        )}
                                      </td>
                                      {/* 跨日租 */}
                                      <td className="px-2 py-3 text-center border-r border-gray-200 dark:border-gray-600 bg-orange-50/30 dark:bg-orange-900/10">
                                        {modelData && (modelData.overnight_count > 0 || modelData.overnight_amount > 0) ? (
                                          <div className="space-y-1">
                                            <div className="text-gray-800 dark:text-gray-200 font-medium text-xs">
                                              台數: {modelData.overnight_count}
                                            </div>
                                            <div className="text-gray-600 dark:text-gray-400 text-xs">
                                              天數: {modelData.overnight_days}
                                            </div>
                                            <div className="text-orange-600 dark:text-orange-400 font-bold text-xs">
                                              ${modelData.overnight_amount.toLocaleString()}
                                            </div>
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                                        )}
                                      </td>
                                    </React.Fragment>
                                  );
                                })}
                                {/* 該日期的總金額 */}
                                <td className="px-4 py-3 text-center border-l-2 border-green-500 dark:border-green-400 bg-green-50/30 dark:bg-green-900/10">
                                  {(() => {
                                    const dateTotalAmount = dateItem.models.reduce((sum, m) => sum + (m.total_amount || 0), 0);
                                    return dateTotalAmount > 0 ? (
                                      <div className="text-green-700 dark:text-green-300 font-bold">
                                        ${dateTotalAmount.toLocaleString()}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                                    );
                                  })()}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* 總計行 */}
                        <tfoot className="bg-gray-100 dark:bg-gray-700/50">
                          <tr className="font-bold">
                            <td colSpan={2} className="px-4 py-3 text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                              總計
                            </td>
                            {data.headers.map((header) => {
                              // 計算該型號的總計
                              const modelTotalCount = partner.dates.reduce((sum, date) => {
                                const modelData = date.models.find(m => m.model === header);
                                return sum + (modelData?.total_count || 0);
                              }, 0);
                              const modelTotalDays = partner.dates.reduce((sum, date) => {
                                const modelData = date.models.find(m => m.model === header);
                                return sum + (modelData?.total_days || 0);
                              }, 0);
                              const modelTotalAmount = partner.dates.reduce((sum, date) => {
                                const modelData = date.models.find(m => m.model === header);
                                return sum + (modelData?.total_amount || 0);
                              }, 0);
                              
                              const modelSameDayTotal = partner.dates.reduce((sum, date) => {
                                const modelData = date.models.find(m => m.model === header);
                                return sum + (modelData?.same_day_amount || 0);
                              }, 0);
                              
                              const modelOvernightTotal = partner.dates.reduce((sum, date) => {
                                const modelData = date.models.find(m => m.model === header);
                                return sum + (modelData?.overnight_amount || 0);
                              }, 0);

                              return (
                                <React.Fragment key={header}>
                                  {/* 當日租總計 */}
                                  <td className="px-2 py-3 text-center border-r border-gray-200 dark:border-gray-600 bg-blue-50/50 dark:bg-blue-900/20">
                                    {modelSameDayTotal > 0 ? (
                                      <div className="space-y-1">
                                        <div className="text-gray-800 dark:text-gray-200 font-medium text-xs">
                                          台數: {partner.dates.reduce((sum, date) => {
                                            const modelData = date.models.find(m => m.model === header);
                                            return sum + (modelData?.same_day_count || 0);
                                          }, 0)}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                                          天數: {partner.dates.reduce((sum, date) => {
                                            const modelData = date.models.find(m => m.model === header);
                                            return sum + (modelData?.same_day_days || 0);
                                          }, 0)}
                                        </div>
                                        <div className="text-blue-600 dark:text-blue-400 font-bold text-xs">
                                          ${modelSameDayTotal.toLocaleString()}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                                    )}
                                  </td>
                                  {/* 跨日租總計 */}
                                  <td className="px-2 py-3 text-center border-r border-gray-200 dark:border-gray-600 bg-orange-50/50 dark:bg-orange-900/20">
                                    {modelOvernightTotal > 0 ? (
                                      <div className="space-y-1">
                                        <div className="text-gray-800 dark:text-gray-200 font-medium text-xs">
                                          台數: {partner.dates.reduce((sum, date) => {
                                            const modelData = date.models.find(m => m.model === header);
                                            return sum + (modelData?.overnight_count || 0);
                                          }, 0)}
                                        </div>
                                        <div className="text-gray-600 dark:text-gray-400 text-xs">
                                          天數: {partner.dates.reduce((sum, date) => {
                                            const modelData = date.models.find(m => m.model === header);
                                            return sum + (modelData?.overnight_days || 0);
                                          }, 0)}
                                        </div>
                                        <div className="text-orange-600 dark:text-orange-400 font-bold text-xs">
                                          ${modelOvernightTotal.toLocaleString()}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                                    )}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            {/* 總計行的總金額欄（所有型號的當日租+跨日租總計） */}
                            <td className="px-4 py-3 text-center border-l-2 border-green-500 dark:border-green-400 bg-green-100 dark:bg-green-900/30">
                              <div className="space-y-1">
                                <div className="text-gray-800 dark:text-gray-200 font-medium text-xs">
                                  總台數: {totalCount}
                                </div>
                                <div className="text-green-700 dark:text-green-300 font-bold">
                                  ${totalAmount.toLocaleString()}
                                </div>
                              </div>
                            </td>
                          </tr>
                          {/* 總金額行 */}
                          <tr className="bg-green-50 dark:bg-green-900/20 font-bold">
                            <td colSpan={2} className="px-4 py-3 text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-600">
                              總金額
                            </td>
                            {data.headers.map((header) => {
                              const modelTotalAmount = partner.dates.reduce((sum, date) => {
                                const modelData = date.models.find(m => m.model === header);
                                return sum + (modelData?.total_amount || 0);
                              }, 0);
                              
                              return (
                                <React.Fragment key={header}>
                                  <td colSpan={2} className="px-2 py-3 text-center border-r border-gray-200 dark:border-gray-600">
                                    {modelTotalAmount > 0 ? (
                                      <div className="text-green-600 dark:text-green-400 font-bold">
                                        ${modelTotalAmount.toLocaleString()}
                                      </div>
                                    ) : (
                                      <span className="text-gray-400 dark:text-gray-500 text-xs">-</span>
                                    )}
                                  </td>
                                </React.Fragment>
                              );
                            })}
                            {/* 總金額欄：所有機車型號的總金額加總 */}
                            <td colSpan={2} className="px-4 py-3 text-center border-l-2 border-green-500 dark:border-green-400 bg-green-100 dark:bg-green-900/30">
                              <div className="text-green-700 dark:text-green-300 font-bold text-lg">
                                ${totalAmount.toLocaleString()}
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                全部總計
                              </div>
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-gray-500 dark:text-gray-400">該月份沒有合作商數據</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            統計月份：{month}
          </p>
        </div>
      </div>
    </div>
  );
};

const ChartModal: React.FC<{ isOpen: boolean; onClose: () => void; stats: Statistics | null }> = ({ isOpen, onClose, stats }) => {
  if (!isOpen || !stats) return null;
  
  const startDate = new Date(stats.month + '-01');
  const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0);
  
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl relative animate-in fade-in zoom-in duration-200 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
            <TrendingUp size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            合作商業績統計圖表
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto max-h-[80vh]">
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">全平台總業績</p>
                <p className="text-2xl font-black text-blue-800 dark:text-blue-300">${stats.total_amount.toLocaleString()}</p>
             </div>
             <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                <p className="text-xs text-orange-600 dark:text-orange-400 font-bold mb-1">全平台總車次</p>
                <p className="text-2xl font-black text-orange-800 dark:text-orange-300">{stats.total_count} 台</p>
             </div>
          </div>
          {stats.partner_stats && Object.keys(stats.partner_stats).length > 0 ? (
            <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl">
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">各合作商業績對比</h3>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={Object.entries(stats.partner_stats).map(([name, data]) => ({
                  name: name,
                  訂單數: (data as { count: number; amount: number }).count,
                  金額: (data as { count: number; amount: number }).amount,
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis yAxisId="left" orientation="left" label={{ value: '訂單數', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: '金額 (TWD)', angle: 90, position: 'insideRight' }} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="訂單數" fill="#3b82f6" name="訂單數" />
                  <Bar yAxisId="right" dataKey="金額" fill="#10b981" name="金額 (TWD)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-500 dark:text-gray-400">
              <p>目前沒有統計資料</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-center border-t border-gray-100 dark:border-gray-700">
           <p className="text-xs text-gray-400 dark:text-gray-500 italic">
             統計週期：{startDate.getFullYear()}/{String(startDate.getMonth() + 1).padStart(2, '0')}/01 - {endDate.getFullYear()}/{String(endDate.getMonth() + 1).padStart(2, '0')}/{endDate.getDate()}
           </p>
        </div>
      </div>
    </div>
  );
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentStore } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [isPartnerCategoryModalOpen, setIsPartnerCategoryModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [pendingAppointmentDate, setPendingAppointmentDate] = useState<string | undefined>(undefined);
  const [selectedYear, setSelectedYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return now.getMonth() + 1;
  });
  
  // 計算 selectedMonth 字符串（用於 API）
  const selectedMonthString = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [monthsWithOrders, setMonthsWithOrders] = useState<number[]>([]);
  const [partnerColorMap, setPartnerColorMap] = useState<Record<string, string>>({});
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null);
  const [pendingBookingsCount, setPendingBookingsCount] = useState(0);
  const [pendingBookings, setPendingBookings] = useState<any[]>([]);
  const [showPendingBookings, setShowPendingBookings] = useState(false);
  const [partners, setPartners] = useState<any[]>([]);
  const [rentalPlans, setRentalPlans] = useState<any[]>([]);
  const [bookingPartners, setBookingPartners] = useState<Record<number, number | null>>({});
  const [bookingPrices, setBookingPrices] = useState<Record<number, Record<string, number>>>({});
  const [expandedBookings, setExpandedBookings] = useState<Record<number, boolean>>({});
  const prevModalOpenRef = useRef<boolean>(false);

  // 車款類型對應的顏色（與機車管理頁面一致）
  const typeColorMap: Record<string, string> = {
    '白牌': '#7DD3FC', // 天藍色 (sky-300)
    '綠牌': '#86EFAC', // 綠色 (green-300)
    '電輔車': '#FED7AA', // 橘色 (orange-200)
    '三輪車': '#FDE047', // 黃色 (yellow-300)
  };
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const dropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const buttonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<number | null>(null);
  const [statusDropdownPosition, setStatusDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const statusDropdownRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const statusButtonRefs = useRef<Record<number, HTMLButtonElement | null>>({});
  
  // 表格滾動條同步引用
  const tableHeaderScrollRef = useRef<HTMLDivElement>(null);
  const tableBodyScrollRef = useRef<HTMLDivElement>(null);
  
  // 點擊表頭排序狀態（默認按狀態排序）
  const [activeSortColumn, setActiveSortColumn] = useState<'status' | 'appointment_date' | 'start_time' | 'end_time' | 'expected_return_time' | null>('status');
  
  // 臨時拖拽排序（不保存，僅用於顯示）
  const [draggedOrderId, setDraggedOrderId] = useState<number | null>(null);
  const [draggedOverOrderId, setDraggedOverOrderId] = useState<number | null>(null);
  const [temporaryOrder, setTemporaryOrder] = useState<number[]>([]); // 臨時排序順序
  
  // 備註展開狀態（顯示彈窗的訂單ID）
  const [expandedRemarkId, setExpandedRemarkId] = useState<number | null>(null);


  // Fetch available years from API
  const fetchYears = async () => {
    try {
      const response = await ordersApi.getYears();
      const years = response.data || [];
      setAvailableYears(years);
      
      // 如果當前選中的年份不在列表中，且列表不為空，則選擇第一個年份
      if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
      }
    } catch (error) {
      console.error('Failed to fetch years:', error);
      // 如果 API 失敗，至少顯示當前年份
      setAvailableYears([selectedYear]);
    }
  };

  // Fetch months with orders for selected year
  const fetchMonthsWithOrders = async (year: number) => {
    try {
      const response = await ordersApi.getMonthsByYear(year);
      setMonthsWithOrders(response.data || []);
    } catch (error) {
      console.error('Failed to fetch months with orders:', error);
      setMonthsWithOrders([]);
    }
  };

  useEffect(() => {
    fetchYears();
  }, []);

  useEffect(() => {
    fetchMonthsWithOrders(selectedYear);
  }, [selectedYear]);

  // Fetch pending bookings count and list
  const fetchPendingBookings = async () => {
    try {
      // 根據選擇的商店過濾預約訂單
      const params = currentStore?.id ? { store_id: currentStore.id } : undefined;
      const [countResponse, listResponse] = await Promise.all([
        bookingsApi.pendingCount(params),
        bookingsApi.pending(params),
      ]);
      setPendingBookingsCount(countResponse.count || 0);
      const bookings = listResponse.data || [];
      setPendingBookings(bookings);
      
      // 初始化每個預約的合作商
      const initialPartners: Record<number, number | null> = {};
      bookings.forEach((booking: any) => {
        // 設置預設合作商：優先使用 booking 的 partner_id，否則使用該商店的預設合作商
        let defaultPartnerId: number | null = booking.partner_id || null;
        if (!defaultPartnerId && partners.length > 0) {
          // 根據 booking 的 store_id 查找該商店的預設合作商
          const bookingStoreId = booking.store_id || booking.store?.id;
          const defaultPartner = partners.find((p: any) => 
            p.is_default_for_booking && 
            (p.store_id === bookingStoreId || (!p.store_id && !bookingStoreId))
          );
          defaultPartnerId = defaultPartner ? defaultPartner.id : null;
        }
        initialPartners[booking.id] = defaultPartnerId;
      });
      setBookingPartners(initialPartners);
      
      // 初始化每個預約的基本價格
      const initialPrices: Record<number, Record<string, number>> = {};
      bookings.forEach((booking: any) => {
        const prices: Record<string, number> = {};
        if (booking.scooters && Array.isArray(booking.scooters)) {
          booking.scooters.forEach((scooter: any) => {
            const parts = scooter.model.split(' ', 2);
            const model = parts[0] || '';
            const plan = rentalPlans.find((p: any) => p.model === model);
            const basePrice = plan ? parseFloat(plan.price.toString()) : 0;
            prices[scooter.model] = basePrice;
          });
        }
        initialPrices[booking.id] = prices;
      });
      setBookingPrices(initialPrices);
    } catch (error) {
      console.error('Failed to fetch pending bookings:', error);
      setPendingBookingsCount(0);
      setPendingBookings([]);
    }
  };

  useEffect(() => {
    fetchPendingBookings();
    // 每 30 秒刷新一次未確認預約數量
    const interval = setInterval(fetchPendingBookings, 30000);
    return () => clearInterval(interval);
  }, [partners, rentalPlans, currentStore]);

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await ordersApi.list({
          month: selectedMonthString,
          search: searchTerm || undefined,
          page: currentPage,
          store_id: currentStore?.id,
        });
        // API 返回結構: { data: [...], meta: {...} }
        // response 本身就是 { data: [...], meta: {...} }
        console.log('API Response:', response);
        const ordersData = response.data || [];
        const fetchedOrders = Array.isArray(ordersData) ? ordersData : [];
        setOrders(fetchedOrders);
        // 清除臨時拖拽排序
        setTemporaryOrder([]);
        if (response.meta) {
          setTotalPages(response.meta.last_page);
        }
      } catch (error) {
        console.error('Failed to fetch orders:', error);
        setOrders([]);
        setTemporaryOrder([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [selectedYear, selectedMonth, searchTerm, currentPage, currentStore]);


  // 滾動時關閉狀態下拉選單
  useEffect(() => {
    const handleScroll = () => {
      if (openStatusDropdownId !== null) {
        setOpenStatusDropdownId(null);
        setStatusDropdownPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openStatusDropdownId]);

  // Fetch statistics
  const fetchStatistics = async () => {
    setStatsLoading(true);
    try {
      const response = await ordersApi.statistics(selectedMonthString, currentStore?.id);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, [selectedYear, selectedMonth, currentStore]);

  // 當路由改變時，清除 pending 狀態，避免影響其他頁面
  useEffect(() => {
    if (location.pathname !== '/orders') {
      setPendingAppointmentDate(undefined);
      setIsAddModalOpen(false);
      setEditingOrder(null);
    }
  }, [location.pathname]);

  // 處理 Modal 關閉後的異步操作（避免影響其他連結）
  useEffect(() => {
    // 只在 Modal 從開啟變為關閉時執行，且確保當前在訂單頁面
    if (prevModalOpenRef.current && !isAddModalOpen && pendingAppointmentDate !== undefined && location.pathname === '/orders') {
      let isCancelled = false;
      
      const processAfterClose = async () => {
        // 再次檢查是否還在訂單頁面
        if (location.pathname !== '/orders' || isCancelled) {
          setPendingAppointmentDate(undefined);
          return;
        }
        
        // 重新獲取年份列表（因為可能有新的年份）
        await fetchYears();
        
        // 再次檢查是否還在訂單頁面
        if (location.pathname !== '/orders' || isCancelled) {
          setPendingAppointmentDate(undefined);
          return;
        }
        
        // 如果有預約日期，跳轉到該月份
        let monthChanged = false;
        if (pendingAppointmentDate && typeof pendingAppointmentDate === 'string') {
          const [year, month] = pendingAppointmentDate.split('-').map(Number);
          if (year && month) {
            if (year !== selectedYear || month !== selectedMonth) {
              setSelectedYear(year);
              setSelectedMonth(month);
              setCurrentPage(1);
              fetchMonthsWithOrders(year);
              monthChanged = true;
            }
          }
        }
        
        // 如果月份沒有改變，手動刷新訂單列表和統計
        if (!monthChanged && location.pathname === '/orders' && !isCancelled) {
          try {
            const response = await ordersApi.list({
              month: selectedMonthString,
              search: searchTerm || undefined,
              page: currentPage,
              store_id: currentStore?.id,
            });
            const ordersData = response.data || [];
            setOrders(Array.isArray(ordersData) ? ordersData : []);
            if (response.meta) {
              setTotalPages(response.meta.last_page);
            }
            fetchStatistics();
          } catch (error) {
            console.error('Failed to refresh orders:', error);
          }
        }
        
        // 清除 pending 狀態
        setPendingAppointmentDate(undefined);
      };
      
      // 使用 setTimeout 確保 DOM 更新完成，Modal 完全移除
      const timeoutId = setTimeout(() => {
        processAfterClose();
      }, 100);
      
      // 清理函數：如果組件卸載或路由改變，取消操作
      return () => {
        isCancelled = true;
        clearTimeout(timeoutId);
      };
    }
    
    // 更新前一個狀態
    prevModalOpenRef.current = isAddModalOpen;
  }, [isAddModalOpen, pendingAppointmentDate, location.pathname, selectedYear, selectedMonth, selectedMonthString, searchTerm, currentPage, currentStore]);

  // 點擊外部關閉下拉菜單（現在通過遮罩層處理）
  // 滾動時關閉下拉菜單
  useEffect(() => {
    const handleScroll = () => {
      if (openDropdownId !== null) {
        setOpenDropdownId(null);
        setDropdownPosition(null);
      }
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [openDropdownId]);

  const handleYearChange = (year: number) => {
    setSelectedYear(year);
    setCurrentPage(1);
    fetchMonthsWithOrders(year);
  };

  const handleMonthChange = (month: number) => {
    setSelectedMonth(month);
    setCurrentPage(1);
  };

  const handleExportExcel = async () => {
    if (!stats) {
      alert('目前沒有統計資料可匯出');
      return;
    }

    try {
      // 獲取合作商列表以匹配統編
      const partnersResponse = await partnersApi.list();
      const partners = (partnersResponse.data || []) as Array<{ name: string; tax_id: string | null }>;
      const partnerMap = new Map<string, string>();
      partners.forEach((partner) => {
        partnerMap.set(partner.name, partner.tax_id || '');
      });

      // 創建工作簿
      const wb = XLSX.utils.book_new();
      
      // 創建單一工作表（按照圖片格式）
      const ws = XLSX.utils.aoa_to_sheet([]);
      
      // 第一行：年份和月份（例如：2025年01月）
      XLSX.utils.sheet_add_aoa(ws, [[`${selectedYear}年${String(selectedMonth).padStart(2, '0')}月`]], { origin: 'A1' });
      
      // 空一行（第2行）
      
      // 第3行：單月總台數
      XLSX.utils.sheet_add_aoa(ws, [['單月總台數', stats.total_count || 0]], { origin: 'A3' });
      
      // 第4行：單月總金額
      XLSX.utils.sheet_add_aoa(ws, [['單月總金額', stats.total_amount || 0]], { origin: 'A4' });
      
      // 空一行（第5行）
      
      // 第6行：表頭
      XLSX.utils.sheet_add_aoa(ws, [['合作商名稱', '統編', '台數', '金額']], { origin: 'A6' });
      
      // 準備合作商統計數據
      const partnerData = Object.entries(stats.partner_stats || {})
        .map(([partnerName, data]) => [
          partnerName,
          partnerMap.get(partnerName) || '',
          (data as { count: number; amount: number }).count || 0,
          (data as { count: number; amount: number }).amount || 0
        ])
        .sort((a, b) => (b[3] as number) - (a[3] as number)); // 按金額降序排列
      
      // 添加數據行（從第7行開始）
      if (partnerData.length > 0) {
        XLSX.utils.sheet_add_aoa(ws, partnerData, { origin: 'A7' });
      }
      
      // 設置列寬
      ws['!cols'] = [
        { wch: 20 }, // 合作商名稱
        { wch: 12 }, // 統編
        { wch: 10 }, // 台數
        { wch: 15 }  // 金額
      ];
      
      // 添加工作表
      XLSX.utils.book_append_sheet(wb, ws, '合作商單月統計');

      // 生成文件名：export-YYYYMM.xlsx
      const fileName = `export-${selectedYear}${String(selectedMonth).padStart(2, '0')}.xlsx`;

      // 下載文件
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('匯出 Excel 時發生錯誤:', error);
      alert('匯出 Excel 時發生錯誤，請稍後再試');
    }
  };


  // 獲取可選的年份列表（從 API 獲取）
  const getAvailableYears = () => {
    // 確保當前選中的年份也在列表中（即使 API 沒有返回）
    const yearsSet = new Set<number>(availableYears);
    yearsSet.add(selectedYear);
    
    // 轉換為數組並排序
    const years = Array.from(yearsSet).sort((a: number, b: number) => a - b);
    
    // 如果沒有年份，至少顯示當前年份
    return years.length > 0 ? years : [selectedYear];
  };

  // 獲取可選的月份列表（固定 1-12 月）
  const getAvailableMonths = () => {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  };

  // 獲取合作商顏色（返回 hex 顏色值或 null）
  const getPartnerColor = (partnerName: string | null | undefined): string | null => {
    if (!partnerName) return null;
    
    // 使用合作商設定的顏色（hex 格式）
    if (partnerColorMap[partnerName]) {
      return partnerColorMap[partnerName];
    }
    
    return null;
  };

  // 獲取合作商列表並建立顏色映射
  useEffect(() => {
    const fetchPartners = async () => {
      try {
        const response = await partnersApi.list();
        const partnersList = response.data || [];
        setPartners(partnersList);
        const colorMap: Record<string, string> = {};
        partnersList.forEach((partner: { name: string; color: string | null }) => {
          if (partner.color) {
            colorMap[partner.name] = partner.color;
          }
        });
        setPartnerColorMap(colorMap);
      } catch (error) {
        console.error('Failed to fetch partners:', error);
      }
    };
    fetchPartners();
  }, []);

  // 獲取租車方案價格
  useEffect(() => {
    const fetchRentalPlans = async () => {
      try {
        const response = await rentalPlansApi.list({ active_only: true });
        setRentalPlans(response.data || []);
      } catch (error) {
        console.error('Failed to fetch rental plans:', error);
      }
    };
    fetchRentalPlans();
  }, []);


  // 獲取航運別顏色
  const getShippingCompanyColor = (company: string | null | undefined): string => {
    if (!company) return 'text-gray-500 dark:text-gray-400';
    
    const companyLower = company.toLowerCase();
    if (companyLower.includes('藍白')) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (companyLower.includes('泰富')) {
      return 'text-red-600 dark:text-red-400';
    } else if (companyLower.includes('聯營')) {
      return 'text-green-600 dark:text-green-400';
    } else if (companyLower.includes('大福')) {
      return 'text-yellow-700 dark:text-yellow-500';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  // 獲取付款方式顏色
  const getPaymentMethodColor = (method: string | null | undefined): string => {
    if (!method) return 'text-gray-400 dark:text-gray-500';
    
    const methodLower = method.toLowerCase();
    if (methodLower.includes('現金')) {
      return 'text-emerald-600 dark:text-emerald-400';
    } else if (methodLower.includes('月結')) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (methodLower.includes('日結')) {
      return 'text-cyan-600 dark:text-cyan-400';
    } else if (methodLower.includes('匯款')) {
      return 'text-indigo-600 dark:text-indigo-400';
    } else if (methodLower.includes('刷卡')) {
      return 'text-purple-600 dark:text-purple-400';
    } else if (methodLower.includes('行動支付') || methodLower.includes('行動')) {
      return 'text-pink-600 dark:text-pink-400';
    }
    return 'text-gray-400 dark:text-gray-500';
  };

  // 獲取機車型號顏色（根據車款類型獲取）
  // 對應關係：訂單中的機車型號 → 機車的車款類型 (type) → 車款類型對應的顏色
  const getScooterModelColor = (type: string | undefined): { colorClass: string; displayColor: string | null } => {
    // 根據車款類型獲取對應的顏色
    if (type && typeColorMap[type]) {
      return { colorClass: '', displayColor: typeColorMap[type] };
    }
    
    // 如果沒有車款類型或類型不在映射中，使用灰色作為默認顏色
    return { colorClass: 'bg-gray-100 text-gray-900 dark:bg-gray-900/30 dark:text-gray-100', displayColor: null };
  };

  const handleEdit = (order: Order) => {
    setEditingOrder(order);
    setIsAddModalOpen(true);
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const handleDelete = async (orderId: number) => {
    if (!confirm('確定要刪除此訂單嗎？此操作無法復原。')) {
      return;
    }

    try {
      await ordersApi.delete(orderId);
      // 重新載入訂單列表
      const response = await ordersApi.list({
        month: selectedMonthString,
        search: searchTerm || undefined,
        page: currentPage,
        store_id: currentStore?.id,
      });
      const ordersData = response.data || [];
      setOrders(Array.isArray(ordersData) ? ordersData : []);
      if (response.meta) {
        setTotalPages(response.meta.last_page);
      }
      fetchStatistics();
    } catch (error: any) {
      console.error('Failed to delete order:', error);
      // 如果是 404 錯誤（訂單不存在），只顯示警告
      if (error.response?.status === 404) {
        alert('訂單不存在或已被刪除。');
      } else {
        alert('刪除訂單失敗，請稍後再試。');
      }
    }
    setOpenDropdownId(null);
    setDropdownPosition(null);
  };

  const toggleDropdown = (orderId: number) => {
    if (openDropdownId === orderId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      const button = buttonRefs.current[orderId];
      if (button) {
        const rect = button.getBoundingClientRect();
        // 計算下拉菜單位置
        // top: 按鈕頂部位置 + 滾動距離 + 按鈕高度的一半 + 向下 6px
        // right: 從右邊計算，減少 30px 使其靠右邊約 30px
        setDropdownPosition({
          top: rect.top + window.scrollY + (rect.height / 2) + 6, // 對齊到按鈕垂直中心並向下 6px
          right: window.innerWidth - rect.right - 30, // 靠右邊約 30px（減少 right 值等於向右移動）
        });
      }
      setOpenDropdownId(orderId);
    }
  };

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return '-';
    const date = new Date(dateTime);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const formatDate = (date: string) => {
    return date;
  };

  // 狀態排序順序：進行中、待接送、在合作商、已預訂、已完成
  const statusOrder = ['進行中', '待接送', '在合作商', '已預訂', '已完成'];
  const getStatusOrder = (status: string) => {
    const index = statusOrder.indexOf(status);
    return index === -1 ? 999 : index;
  };

  // 點擊表頭排序後的訂單列表（支持臨時拖拽排序）
  const sortedOrders = useMemo(() => {
    let sorted = [...orders];

    // 如果有排序選項，先應用排序
    if (activeSortColumn) {
      switch (activeSortColumn) {
        case 'status':
          // 狀態排序：進行中、待接送、在合作商、已預訂、已完成
          sorted.sort((a, b) => getStatusOrder(a.status) - getStatusOrder(b.status));
          break;
        
        case 'appointment_date':
          // 預約日期排序：由近而遠（降序）
          sorted.sort((a, b) => {
            const dateA = a.appointment_date ? new Date(a.appointment_date).getTime() : 0;
            const dateB = b.appointment_date ? new Date(b.appointment_date).getTime() : 0;
            return dateB - dateA;
          });
          break;
        
        case 'start_time':
          // 租借開始時間排序：由近而遠（降序）
          sorted.sort((a, b) => {
            const dateA = a.start_time ? new Date(a.start_time).getTime() : 0;
            const dateB = b.start_time ? new Date(b.start_time).getTime() : 0;
            return dateB - dateA;
          });
          break;
        
        case 'end_time':
          // 租借結束時間排序：由近而遠（降序）
          sorted.sort((a, b) => {
            const dateA = a.end_time ? new Date(a.end_time).getTime() : 0;
            const dateB = b.end_time ? new Date(b.end_time).getTime() : 0;
            return dateB - dateA;
          });
          break;
        
        case 'expected_return_time':
          // 預計還車時間排序：由近而遠（降序）
          sorted.sort((a, b) => {
            const dateA = a.expected_return_time ? new Date(a.expected_return_time).getTime() : 0;
            const dateB = b.expected_return_time ? new Date(b.expected_return_time).getTime() : 0;
            return dateB - dateA;
          });
          break;
      }
    }

    // 如果有臨時拖拽排序，應用臨時排序（覆蓋當前排序結果）
    if (temporaryOrder.length > 0) {
      const orderMap = new Map(sorted.map(o => [o.id, o]));
      const temporarilyOrdered = temporaryOrder.map(id => orderMap.get(id)).filter(Boolean) as Order[];
      // 添加不在temporaryOrder中的訂單到末尾
      const temporaryOrderSet = new Set(temporaryOrder);
      const remaining = sorted.filter(o => !temporaryOrderSet.has(o.id));
      return [...temporarilyOrdered, ...remaining];
    }

    return sorted;
  }, [orders, activeSortColumn, temporaryOrder]);

  // 點擊表頭排序處理函數
  const handleHeaderClick = (column: 'status' | 'appointment_date' | 'start_time' | 'end_time' | 'expected_return_time') => {
    // 如果點擊的是當前排序列，則取消排序（恢復為狀態排序）；否則設置為新的排序列
    if (activeSortColumn === column) {
      setActiveSortColumn('status'); // 取消排序時恢復為默認狀態排序
    } else {
      setActiveSortColumn(column);
    }
    // 清除臨時拖拽排序
    setTemporaryOrder([]);
  };

  // 拖拽處理函數（始終可用，即使有排序選項）
  const handleDragStart = (e: React.DragEvent, orderId: number) => {
    setDraggedOrderId(orderId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, orderId: number) => {
    if (draggedOrderId !== orderId) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDraggedOverOrderId(orderId);
    }
  };

  const handleDragEnd = () => {
    if (draggedOrderId && draggedOverOrderId && draggedOrderId !== draggedOverOrderId) {
      // 使用當前 sortedOrders 的順序作為基礎
      const currentOrder = sortedOrders.map(o => o.id);
      const draggedIndex = currentOrder.indexOf(draggedOrderId);
      const draggedOverIndex = currentOrder.indexOf(draggedOverOrderId);
      
      if (draggedIndex !== -1 && draggedOverIndex !== -1) {
        const newOrder = [...currentOrder];
        // 移除被拖拽的項目
        newOrder.splice(draggedIndex, 1);
        // 插入到新位置
        newOrder.splice(draggedOverIndex, 0, draggedOrderId);
        setTemporaryOrder(newOrder);
      }
    }
    setDraggedOrderId(null);
    setDraggedOverOrderId(null);
  };

  const handleDragLeave = () => {
    setDraggedOverOrderId(null);
  };

  // 切換備註展開（彈窗顯示）
  const toggleRemark = (orderId: number) => {
    setExpandedRemarkId(expandedRemarkId === orderId ? null : orderId);
  };

  // 處理預約轉訂單 - 直接轉換
  const handleConvertBookingClick = async (booking: any) => {
    // 檢查 email
    if (!booking.email) {
      alert('此預約沒有填寫 email，無法確認轉為訂單。請先編輯預約資料添加 email。');
      return;
    }

    if (!confirm('確定要將此預約轉為訂單嗎？')) return;

    try {
      const partnerId = bookingPartners[booking.id] || null;
      
      // 確保預約的 store_id 被傳遞到訂單轉換
      const storeId = booking.store_id || booking.store?.id || null;
      
      // 不傳入 payment_amount，讓後端根據合作商的機車型號費用自動計算調車費用
      await bookingsApi.convertToOrder(booking.id, {
        partner_id: partnerId,
        payment_method: '現金',
        store_id: storeId, // 確保預約的 store_id 被寫入訂單
      });
      
      await handleConvertSuccess(booking.id);
    } catch (error: any) {
      console.error('Failed to convert booking:', error);
      const errorMessage = error.response?.data?.message || '轉換訂單時發生錯誤，請稍後再試。';
      alert(errorMessage);
    }
  };

  // 處理轉換成功
  const handleConvertSuccess = async (bookingId?: number) => {
    // 重新載入預約列表和訂單列表
    await fetchPendingBookings();
    const response = await ordersApi.list({
      month: selectedMonthString,
      search: searchTerm || undefined,
      page: currentPage,
      store_id: currentStore?.id,
    });
    const ordersData = response.data || [];
    setOrders(Array.isArray(ordersData) ? ordersData : []);
    
    // 跳轉到預約管理頁面的 detail 視圖
    if (bookingId) {
      navigate(`/bookings?detail=${bookingId}`);
    } else if (selectedBooking) {
      navigate(`/bookings?detail=${selectedBooking.id}`);
    }
  };

  // 處理拒絕預約
  const handleRejectBooking = async (bookingId: number) => {
    if (!confirm('確定要拒絕此預約嗎？')) return;

    try {
      await bookingsApi.updateStatus(bookingId, '取消');
      await fetchPendingBookings();
      // 直接跳轉到預約管理頁面的 detail 視圖
      navigate(`/bookings?detail=${bookingId}`);
    } catch (error: any) {
      console.error('Failed to reject booking:', error);
      alert(error.message || '拒絕失敗');
    }
  };

  // 處理合作商變更
  const handlePartnerChange = (bookingId: number, partnerId: number | null) => {
    setBookingPartners(prev => ({ ...prev, [bookingId]: partnerId }));
  };

  // 處理價格變更
  const handlePriceChange = (bookingId: number, model: string, price: number) => {
    setBookingPrices(prev => ({
      ...prev,
      [bookingId]: {
        ...prev[bookingId],
        [model]: price,
      },
    }));
  };

  // 計算租借天數
  const calculateRentalDays = (booking: any): number => {
    const startDate = new Date(booking.booking_date);
    const endDate = booking.end_date ? new Date(booking.end_date) : startDate;
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const inclusiveDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    // 如果是同一天（1天），返回1天；否則返回（總天數 - 1）天
    if (inclusiveDays === 1) {
      return 1;
    }
    return inclusiveDays - 1;
  };

  // 計算總金額
  const calculateTotalAmount = (booking: any): number => {
    const days = calculateRentalDays(booking);
    const prices = bookingPrices[booking.id] || {};
    let total = 0;
    
    if (booking.scooters && Array.isArray(booking.scooters)) {
      booking.scooters.forEach((scooter: any) => {
        const basePrice = prices[scooter.model] || 0;
        total += basePrice * scooter.count * days;
      });
    }
    
    return total;
  };

  return (
    <div className="px-6 pb-6 pt-0 max-w-full dark:text-gray-100">
      {/* 未確認預約通知區域 */}
      {pendingBookingsCount > 0 && (
        <div className="mb-6 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Bell size={24} className="text-orange-600 dark:text-orange-400" />
                {pendingBookingsCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {pendingBookingsCount}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                  有 {pendingBookingsCount} 筆未確認的預約訂單
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  點擊下方按鈕查看並確認預約
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowPendingBookings(!showPendingBookings)}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {showPendingBookings ? '隱藏' : '查看預約'}
            </button>
          </div>
        </div>
      )}

      {/* 未確認預約列表 */}
      {showPendingBookings && pendingBookings.length > 0 && (
        <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">未確認預約列表</h2>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {pendingBookings.map((booking) => {
              const isExpanded = expandedBookings[booking.id] || false;

              return (
                <div key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  {/* 預約標題欄（可點擊展開/收合） */}
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    onClick={() => setExpandedBookings(prev => ({ ...prev, [booking.id]: !prev[booking.id] }))}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronRight size={20} className="text-gray-500 dark:text-gray-400" />
                      )}
                      <span className="font-bold text-gray-800 dark:text-gray-200">#{booking.id}</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{booking.name}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-500">
                        {new Date(booking.booking_date).toLocaleDateString('zh-TW')}
                      </span>
                    </div>
                  </div>

                  {/* 預約詳細內容（可展開/收合） */}
                  {isExpanded && (
                    <div className="px-4 pb-6 pt-0 border-t border-gray-200 dark:border-gray-700">
                      <div className="pt-4 space-y-3">
                        {/* Email 與按鈕同一行 */}
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-sm text-gray-700 dark:text-gray-300">Email: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.email || '-'}</span></div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRejectBooking(booking.id);
                              }}
                              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center space-x-1 h-[42px]"
                            >
                              <XCircle size={16} />
                              <span>拒絕</span>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleConvertBookingClick(booking);
                              }}
                              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition-colors h-[42px]"
                            >
                              確認轉為訂單
                            </button>
                          </div>
                        </div>

                        {/* 其他欄位以三列形式顯示 */}
                        <div className="grid grid-cols-3 gap-x-6 gap-y-2 text-sm text-gray-700 dark:text-gray-300">
                          <div>承租人姓名: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.name}</span></div>
                          <div>LINE ID: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.line_id || '-'}</span></div>
                          <div>行動電話: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.phone || '-'}</span></div>
                          <div>商店名稱: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.store?.name || '-'}</span></div>
                          <div>預約日期: <span className="font-medium text-gray-800 dark:text-gray-100">{new Date(booking.booking_date).toLocaleDateString('zh-TW')}</span></div>
                          <div>結束日期: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.end_date ? new Date(booking.end_date).toLocaleDateString('zh-TW') : '-'}</span></div>
                          <div>船運公司: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.shipping_company || '-'}</span></div>
                          <div>船班時間（來）: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.ship_arrival_time ? new Date(booking.ship_arrival_time).toLocaleString('zh-TW') : '-'}</span></div>
                          <div>大人 / 人數: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.adults !== null ? booking.adults : '-'}</span></div>
                          <div>小孩 (12歲以下) / 人數: <span className="font-medium text-gray-800 dark:text-gray-100">{booking.children !== null ? booking.children : '-'}</span></div>
                        </div>

                        {/* 所需租車類型/數量 */}
                        <div className="text-sm text-gray-700 dark:text-gray-300">
                          <span className="font-medium text-gray-800 dark:text-gray-100">所需租車類型/數量: </span>
                          {booking.scooters && Array.isArray(booking.scooters) && booking.scooters.length > 0 ? (
                            <span className="font-medium text-gray-800 dark:text-gray-100">
                              {booking.scooters.map((scooter: any, idx: number) => {
                                // 從 model 字串中提取車款類型（格式：model + " " + type，例如 "EB-500 電輔車"）
                                const parts = scooter.model.split(' ', 2);
                                const type = parts[1] || ''; // 例如 "電輔車"
                                
                                // 根據車款類型獲取對應的背景顏色
                                const backgroundColor = type && typeColorMap[type] ? typeColorMap[type] : '#E5E7EB'; // 默認灰色
                                
                                return (
                                  <span 
                                    key={idx}
                                    className="px-2 py-0.5 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-900 inline-block mr-1"
                                    style={{ backgroundColor }}
                                  >
                                    {scooter.model} x {scooter.count}
                                  </span>
                                );
                              })}
                            </span>
                          ) : (
                            <span className="font-medium text-gray-800 dark:text-gray-100">-</span>
                          )}
                        </div>


                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100">訂單管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">管理與統計全平台租賃訂單 (每月上限 200 組一頁)</p>
        </div>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1 flex items-center shadow-sm">
               <select 
                className="bg-transparent border-none focus:ring-0 text-sm px-4 py-2 cursor-pointer outline-none font-medium text-gray-600 dark:text-gray-300"
                value={selectedYear}
                onChange={(e) => handleYearChange(Number(e.target.value))}
               >
                  {getAvailableYears().map(year => (
                    <option key={year} value={year}>{year} 年</option>
                  ))}
               </select>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 flex items-center gap-1 shadow-sm overflow-x-auto">
              {getAvailableMonths().map(month => (
                <button
                  key={month}
                  onClick={() => handleMonthChange(month)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center space-x-1 ${
                    month === selectedMonth
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                      : monthsWithOrders.includes(month)
                      ? 'bg-orange-100 hover:bg-orange-200 dark:bg-orange-900/30 dark:hover:bg-orange-900/40 text-gray-700 dark:text-gray-300'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{month} 月</span>
                  {monthsWithOrders.includes(month) && (
                    <span className="text-blue-600 dark:text-blue-400 text-xs">●</span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleExportExcel}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-sm active:scale-95 text-xs font-medium h-[42px]"
            >
              <Download size={14} />
              <span>匯出 Excel</span>
            </button>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2.5 rounded-xl flex items-center space-x-2 transition-all shadow-sm active:scale-95 font-bold h-[42px]"
            >
              <Plus size={18} />
              <span>新增訂單</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">合作商單月統計</p>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setIsStatsModalOpen(true)}
                  className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-500 transition-colors"
                >
                  點擊彈出詳細視窗
                </button>
                {/* 合作商分類功能已隱藏 */}
                {/* <span className="text-gray-400">|</span>
                <button 
                  onClick={() => setIsPartnerCategoryModalOpen(true)}
                  className="text-sm font-bold text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-500 transition-colors"
                >
                  合作商分類
                </button> */}
              </div>
           </div>
           <Filter size={24} className="text-blue-200 dark:text-blue-600" />
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">單月總台數</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {statsLoading ? <Loader2 size={20} className="animate-spin" /> : (stats?.total_count || 0)} 台
              </p>
           </div>
           <Bike size={24} className="text-orange-200" />
        </div>
        <div className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
           <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">單月總金額</p>
              <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
                {statsLoading ? <Loader2 size={20} className="animate-spin" /> : `$${(stats?.total_amount || 0).toLocaleString()}`}
              </p>
           </div>
           <FileText size={24} className="text-green-200" />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
              <span>顯示 {sortedOrders.length} 筆</span>
            </div>
            {/* 搜索框 */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text" 
                placeholder="搜尋承租人、電話或訂單號..." 
                className="w-full pl-11 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-gray-200"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <Loader2 size={32} className="animate-spin mx-auto text-orange-600" />
            <p className="mt-4 text-gray-500">載入中...</p>
          </div>
        ) : (
          <div className="relative">
            {/* 頂部滾動條（表頭） */}
            <div 
              ref={tableHeaderScrollRef}
              className="overflow-x-auto overflow-y-hidden border-b border-gray-200 dark:border-gray-700"
              style={{ scrollbarWidth: 'thin' }}
              onScroll={(e) => {
                if (tableBodyScrollRef.current && tableBodyScrollRef.current.scrollLeft !== e.currentTarget.scrollLeft) {
                  tableBodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              <table className="w-full text-left text-sm whitespace-nowrap" style={{ tableLayout: 'fixed', minWidth: '1400px' }}>
                <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 font-medium">
                  <tr>
                    <th className="px-4 py-4 w-[80px] text-center">操作</th>
                    <th 
                      className="px-4 py-4 w-[100px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                      onClick={() => handleHeaderClick('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>狀態</span>
                        {activeSortColumn === 'status' && (
                          <span className="text-orange-600 dark:text-orange-400">↓</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-4 w-[120px]">承租人</th>
                    <th 
                      className="px-4 py-4 w-[110px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                      onClick={() => handleHeaderClick('appointment_date')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>預約日期</span>
                        {activeSortColumn === 'appointment_date' && (
                          <span className="text-orange-600 dark:text-orange-400">↓</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-4 w-[140px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                      onClick={() => handleHeaderClick('start_time')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>租借開始</span>
                        {activeSortColumn === 'start_time' && (
                          <span className="text-orange-600 dark:text-orange-400">↓</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-4 w-[140px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                      onClick={() => handleHeaderClick('end_time')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>租借結束</span>
                        {activeSortColumn === 'end_time' && (
                          <span className="text-orange-600 dark:text-orange-400">↓</span>
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-4 py-4 w-[140px] cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors select-none"
                      onClick={() => handleHeaderClick('expected_return_time')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>預計還車</span>
                        {activeSortColumn === 'expected_return_time' && (
                          <span className="text-orange-600 dark:text-orange-400">↓</span>
                        )}
                      </div>
                    </th>
                    <th className="px-4 py-4 w-[130px]">租借機車 (款x台)</th>
                    <th className="px-4 py-4 w-[160px]">航運(來/回)</th>
                    <th className="px-4 py-4 w-[120px]">連絡電話</th>
                    <th className="px-4 py-4 w-[120px]">合作商</th>
                    <th className="px-4 py-4 w-[110px]">方式/金額</th>
                    <th className="px-4 py-4 w-[150px]">備註</th>
                  </tr>
                </thead>
              </table>
            </div>
            {/* 底部滾動條（表體） */}
            <div 
              ref={tableBodyScrollRef}
              className="overflow-x-auto"
              style={{ scrollbarWidth: 'thin' }}
              onScroll={(e) => {
                if (tableHeaderScrollRef.current && tableHeaderScrollRef.current.scrollLeft !== e.currentTarget.scrollLeft) {
                  tableHeaderScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                }
              }}
            >
              <table className="w-full text-left text-sm whitespace-nowrap" style={{ tableLayout: 'fixed', minWidth: '1400px' }}>
                <tbody className="divide-y divide-gray-100">
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                      目前沒有訂單資料
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order) => (
                  <tr 
                    key={order.id} 
                    draggable={true} // 始終可拖拽
                    onDragStart={(e) => handleDragStart(e, order.id)}
                    onDragOver={(e) => handleDragOver(e, order.id)}
                    onDragEnd={handleDragEnd}
                    onDragLeave={handleDragLeave}
                    className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/50 group transition-colors cursor-move ${
                      draggedOrderId === order.id ? 'opacity-50' : ''
                    } ${
                      draggedOverOrderId === order.id ? 'border-t-2 border-orange-500' : ''
                    }`}
                  >
                    <td className="px-4 py-4 w-[80px] text-center">
                      <div className="relative">
                        <button 
                          ref={(el) => { buttonRefs.current[order.id] = el; }}
                          onClick={() => toggleDropdown(order.id)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl text-gray-400 dark:text-gray-500 transition-colors"
                        >
                          <MoreHorizontal size={18} />
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 w-[100px]">
                      <div className="relative">
                        <button
                          ref={(el) => { statusButtonRefs.current[order.id] = el; }}
                          onClick={() => {
                            if (openStatusDropdownId === order.id) {
                              setOpenStatusDropdownId(null);
                              setStatusDropdownPosition(null);
                            } else {
                              const button = statusButtonRefs.current[order.id];
                              if (button) {
                                const rect = button.getBoundingClientRect();
                                setStatusDropdownPosition({
                                  top: rect.bottom + window.scrollY + 4,
                                  left: rect.left + window.scrollX,
                                });
                              }
                              setOpenStatusDropdownId(order.id);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center space-x-1.5 ${
                            order.status === '進行中' ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800' :
                            order.status === '已完成' ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800' :
                            order.status === '已預訂' ? 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-800' :
                            order.status === '待接送' ? 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800' :
                            order.status === '在合作商' ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800' :
                            'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                          }`}
                        >
                          <span>{order.status}</span>
                          <ChevronDown size={14} className={`transition-transform ${openStatusDropdownId === order.id ? 'rotate-180' : ''}`} />
                        </button>
                        
                      </div>
                    </td>
                    <td className="px-4 py-4 w-[120px] font-bold text-gray-900 dark:text-gray-100">{order.tenant}</td>
                    <td className="px-4 py-4 w-[110px] text-gray-500 dark:text-gray-400">{formatDate(order.appointment_date)}</td>
                    <td className="px-4 py-4 w-[140px] text-gray-500 dark:text-gray-400">{formatDate(order.start_time)}</td>
                    <td className="px-4 py-4 w-[140px] text-gray-500 dark:text-gray-400">{formatDate(order.end_time)}</td>
                    <td className="px-4 py-4 w-[140px] text-gray-500 dark:text-gray-400 font-bold">{formatDateTime(order.expected_return_time)}</td>
                    <td className="px-4 py-4 w-[130px]">
                      <div className="flex flex-col gap-1">
                        {order.scooters.map((s, idx) => {
                          // 根據機車的車款類型獲取對應的顏色
                          const { colorClass, displayColor } = getScooterModelColor(s.type);
                          
                          // 如果有顏色（根據車款類型獲取），使用該顏色作為背景色，文字保持黑色
                          if (displayColor) {
                            return (
                              <span 
                                key={idx} 
                                className="px-2 py-0.5 rounded-lg text-[10px] w-fit font-medium text-gray-900 dark:text-gray-900"
                                style={{ backgroundColor: displayColor }}
                              >
                                {s.model} x {s.count}
                              </span>
                            );
                          }
                          
                          // 否則使用灰色背景和黑色文字（默認顏色）
                          return (
                            <span key={idx} className="px-2 py-0.5 rounded-lg text-[10px] w-fit font-medium bg-gray-100 dark:bg-gray-900/30 text-gray-900 dark:text-gray-900">
                              {s.model} x {s.count}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-4 w-[160px] text-xs leading-tight">
                      {order.shipping_company && (
                        <>
                          <div className={`font-bold mb-1 ${getShippingCompanyColor(order.shipping_company)}`}>{order.shipping_company}</div>
                          {order.ship_arrival_time && (
                            <div className="text-gray-400">來: {formatDateTime(order.ship_arrival_time)}</div>
                          )}
                          {order.ship_return_time && (
                            <div className="text-gray-400">回: {formatDateTime(order.ship_return_time)}</div>
                          )}
                        </>
                      )}
                      {!order.shipping_company && '-'}
                    </td>
                    <td className="px-4 py-4 w-[120px] text-gray-500 dark:text-gray-400 font-medium">{order.phone || '-'}</td>
                    <td className="px-4 py-4 w-[120px] font-bold">
                      {order.partner?.name ? (
                        (() => {
                          const color = getPartnerColor(order.partner.name);
                          return color ? (
                            <span style={{ color }}>{order.partner.name}</span>
                          ) : (
                            <span className="text-gray-600 dark:text-gray-400">{order.partner.name}</span>
                          );
                        })()
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-4 w-[110px]">
                      <div className={`text-xs mb-0.5 font-medium ${getPaymentMethodColor(order.payment_method)}`}>{order.payment_method || '-'}</div>
                      <div className="font-black text-gray-900 dark:text-gray-100">${order.payment_amount.toLocaleString()}</div>
                    </td>
                    <td 
                      className="px-4 py-4 w-[150px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      onClick={() => order.remark && toggleRemark(order.id)}
                    >
                      {order.remark ? (
                        <div className="text-gray-400 dark:text-gray-500 truncate max-w-[150px]">
                          {order.remark}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                  </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/30 dark:bg-gray-800/50">
          <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            本月總計: <span className="font-bold text-orange-600 dark:text-orange-400">{stats?.total_count || 0} 台</span>, 
            總金額: <span className="font-bold text-green-600 dark:text-green-400">${(stats?.total_amount || 0).toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                if (page > totalPages) return null;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-xl text-sm font-bold shadow-sm transition-all ${
                      page === currentPage
                        ? 'bg-orange-600 text-white shadow-orange-200'
                        : 'hover:bg-white dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 transition-all shadow-sm"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      <ConvertBookingModal
        isOpen={isConvertModalOpen}
        onClose={() => {
          setIsConvertModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onSuccess={handleConvertSuccess}
      />

      <AddOrderModal
        isOpen={isAddModalOpen}
        editingOrder={editingOrder}
        onYearChange={(year) => {
          if (year && year !== selectedYear) {
            setSelectedYear(year);
          }
        }}
        onClose={(appointmentDate) => {
          // 立即同步關閉 Modal，避免影響其他連結
          setIsAddModalOpen(false);
          setEditingOrder(null);
          
          // 如果有預約日期，表示是成功提交（新增或編輯），更新 pendingAppointmentDate 以觸發 useEffect 刷新數據
          setPendingAppointmentDate(appointmentDate);
        }} 
      />
      {/* 備註內容彈窗 */}
      {expandedRemarkId !== null && (() => {
        const order = orders.find(o => o.id === expandedRemarkId);
        return order?.remark ? (
          <div 
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            onClick={() => setExpandedRemarkId(null)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl relative animate-in fade-in zoom-in duration-200 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                  備註內容
                </h2>
                <button 
                  onClick={() => setExpandedRemarkId(null)} 
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-400 dark:text-gray-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6">
                <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                  {order.remark}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700">
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  點選其他任一位置會自行關閉
                </p>
              </div>
            </div>
          </div>
        ) : null;
      })()}

      <StatsModal isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)} stats={stats} currentStore={currentStore} />
      
      <ChartModal isOpen={isChartModalOpen} onClose={() => setIsChartModalOpen(false)} stats={stats} />

      {/* 合作商分類 Modal 已隱藏 */}
      {/* <PartnerCategoryModal 
        isOpen={isPartnerCategoryModalOpen} 
        onClose={() => setIsPartnerCategoryModalOpen(false)} 
        month={selectedMonthString}
      /> */}
      
      {/* 狀態下拉選單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openStatusDropdownId !== null && statusDropdownPosition && orders.find(o => o.id === openStatusDropdownId) && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setOpenStatusDropdownId(null);
              setStatusDropdownPosition(null);
            }}
          />
          <div 
            className="fixed bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-[120px] overflow-hidden backdrop-blur-sm"
            style={{
              top: `${statusDropdownPosition.top}px`,
              left: `${statusDropdownPosition.left}px`,
            }}
            ref={(el) => { if (openStatusDropdownId) statusDropdownRefs.current[openStatusDropdownId] = el; }}
          >
            {(() => {
              const order = orders.find(o => o.id === openStatusDropdownId);
              if (!order) return null;
              return (
                <>
                  {['已預訂', '進行中', '待接送', '已完成', '在合作商'].map((status) => (
                    <button
                      key={status}
                      onClick={async () => {
                        if (status !== order.status) {
                          try {
                            // 使用專門的狀態更新 API
                            await ordersApi.updateStatus(order.id, status);
                            // 重新載入訂單列表
                            const response = await ordersApi.list({
                              month: selectedMonthString,
                              search: searchTerm || undefined,
                              page: currentPage,
                              store_id: currentStore?.id,
                            });
                            const ordersData = response.data || [];
                            setOrders(Array.isArray(ordersData) ? ordersData : []);
                            if (response.meta) {
                              setTotalPages(response.meta.last_page);
                            }
                            fetchStatistics();
                          } catch (error) {
                            console.error('Failed to update order status:', error);
                            alert('更新狀態失敗，請稍後再試。');
                          }
                        }
                        setOpenStatusDropdownId(null);
                        setStatusDropdownPosition(null);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-medium transition-colors ${
                        status === order.status
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </>
              );
            })()}
          </div>
        </>
      )}

      {/* 操作下拉菜單使用 fixed 定位，避免被表格 overflow 裁剪 */}
      {openDropdownId !== null && dropdownPosition && orders.find(o => o.id === openDropdownId) && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => {
              setOpenDropdownId(null);
              setDropdownPosition(null);
            }}
          />
          <div 
            className="fixed w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
            style={{
              top: `${dropdownPosition.top}px`,
              right: `${dropdownPosition.right}px`,
            }}
            ref={(el) => { if (openDropdownId) dropdownRefs.current[openDropdownId] = el; }}
          >
            {(() => {
              const order = orders.find(o => o.id === openDropdownId);
              if (!order) return null;
              return (
                <>
                  <button
                    onClick={() => handleEdit(order)}
                    className="w-full px-4 py-3 text-center flex items-center justify-center space-x-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Edit3 size={16} className="text-orange-600 dark:text-orange-400" />
                    <span className="text-sm font-medium">編輯</span>
                  </button>
                  <button
                    onClick={() => handleDelete(order.id)}
                    className="w-full px-4 py-3 text-center flex items-center justify-center space-x-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-700 dark:text-gray-300 transition-colors"
                  >
                    <Trash2 size={16} className="text-red-600 dark:text-red-400" />
                    <span className="text-sm font-medium">刪除</span>
                  </button>
                </>
              );
            })()}
          </div>
        </>
      )}

    </div>
  );
};

export default OrdersPage;
