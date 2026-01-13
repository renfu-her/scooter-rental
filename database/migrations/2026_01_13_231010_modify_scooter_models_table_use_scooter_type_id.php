<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 步驟 1: 從現有 scooter_models 表中提取唯一的 type，創建 ScooterType 記錄
        $uniqueTypes = DB::table('scooter_models')
            ->select('type')
            ->distinct()
            ->get();

        $typeMap = []; // 儲存 type => scooter_type_id 的對應關係

        foreach ($uniqueTypes as $item) {
            // 檢查是否已存在相同的類型名稱
            $existingType = DB::table('scooter_types')
                ->where('name', $item->type)
                ->first();

            if ($existingType) {
                $typeMap[$item->type] = $existingType->id;
            } else {
                // 創建新的 ScooterType 記錄（使用預設顏色）
                $defaultColors = [
                    '白牌' => '#7DD3FC',
                    '綠牌' => '#86EFAC',
                    '電輔車' => '#FED7AA',
                    '三輪車' => '#FDE047',
                ];
                
                $scooterTypeId = DB::table('scooter_types')->insertGetId([
                    'name' => $item->type,
                    'color' => $defaultColors[$item->type] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
                $typeMap[$item->type] = $scooterTypeId;
            }
        }

        // 步驟 2: 在 scooter_models 表中新增 scooter_type_id 欄位（暫時允許 null）
        Schema::table('scooter_models', function (Blueprint $table) {
            $table->foreignId('scooter_type_id')->nullable()->after('name')->constrained('scooter_types')->onDelete('restrict');
        });

        // 步驟 3: 將現有的 type 字串轉換為 scooter_type_id
        foreach ($typeMap as $type => $scooterTypeId) {
            DB::table('scooter_models')
                ->where('type', $type)
                ->update(['scooter_type_id' => $scooterTypeId]);
        }

        // 步驟 4: 將 scooter_type_id 設為必填（NOT NULL）
        Schema::table('scooter_models', function (Blueprint $table) {
            $table->foreignId('scooter_type_id')->nullable(false)->change();
        });

        // 步驟 5: 移除 color 欄位（顏色從 scooter_types 取得）
        Schema::table('scooter_models', function (Blueprint $table) {
            $table->dropColumn('color');
        });

        // 步驟 6: 保留 type 欄位作為冗余，方便查詢（但之後會改用 scooter_type_id）
        // 注意：我們不刪除 type 欄位，而是保留它以便向後兼容
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 步驟 1: 將 scooter_type_id 轉換回 type 字串
        $models = DB::table('scooter_models')
            ->join('scooter_types', 'scooter_models.scooter_type_id', '=', 'scooter_types.id')
            ->select('scooter_models.id', 'scooter_types.name as type')
            ->get();

        foreach ($models as $model) {
            DB::table('scooter_models')
                ->where('id', $model->id)
                ->update(['type' => $model->type]);
        }

        // 步驟 2: 新增 color 欄位
        Schema::table('scooter_models', function (Blueprint $table) {
            $table->string('color')->nullable()->after('image_path');
        });

        // 步驟 3: 從 scooter_types 取得顏色並更新到 scooter_models
        $types = DB::table('scooter_types')->get();
        foreach ($types as $type) {
            DB::table('scooter_models')
                ->where('scooter_type_id', $type->id)
                ->update(['color' => $type->color]);
        }

        // 步驟 4: 移除 scooter_type_id 欄位
        Schema::table('scooter_models', function (Blueprint $table) {
            $table->dropForeign(['scooter_type_id']);
            $table->dropColumn('scooter_type_id');
        });
    }
};
