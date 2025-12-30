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
        // 在 MySQL 中修改 enum 欄位需要使用 ALTER TABLE
        DB::statement("ALTER TABLE `scooters` MODIFY COLUMN `type` ENUM('白牌', '綠牌', '電輔車', '三輪車') NOT NULL");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 還原為原本的三個選項
        DB::statement("ALTER TABLE `scooters` MODIFY COLUMN `type` ENUM('白牌', '綠牌', '電輔車') NOT NULL");
    }
};

