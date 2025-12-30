<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Scooter;
use App\Models\ScooterModelColor;
use Illuminate\Support\Facades\DB;

class ScooterModelColorSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 獲取所有唯一的機車型號
        $models = Scooter::select('model')
            ->distinct()
            ->whereNotNull('model')
            ->where('model', '!=', '')
            ->pluck('model')
            ->toArray();

        if (empty($models)) {
            $this->command->info('沒有找到機車型號，跳過顏色分配。');
            return;
        }

        $this->command->info('找到 ' . count($models) . ' 個唯一的機車型號。');

        $created = 0;
        $skipped = 0;

        foreach ($models as $model) {
            // 檢查是否已經存在
            $existing = ScooterModelColor::where('model', $model)->first();
            
            if ($existing) {
                $this->command->line("型號 '{$model}' 已存在，跳過。");
                $skipped++;
                continue;
            }

            // 使用自動分配顏色方法
            $color = ScooterModelColor::assignColorForModel($model);
            
            $this->command->line("為型號 '{$model}' 分配顏色: {$color}");
            $created++;
        }

        $this->command->info("完成！創建了 {$created} 個顏色記錄，跳過了 {$skipped} 個已存在的記錄。");
    }
}
