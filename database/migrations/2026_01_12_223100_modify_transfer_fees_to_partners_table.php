<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            // 先檢查並刪除舊的欄位（如果存在）
            if (Schema::hasColumn('partners', 'same_day_transfer_fee')) {
                $table->dropColumn('same_day_transfer_fee');
            }
            if (Schema::hasColumn('partners', 'overnight_transfer_fee')) {
                $table->dropColumn('overnight_transfer_fee');
            }
        });

        Schema::table('partners', function (Blueprint $table) {
            // 當日調車費用（按車型）
            $table->decimal('same_day_transfer_fee_white', 10, 2)->nullable()->after('default_shipping_company')->comment('當日調車費用-白牌');
            $table->decimal('same_day_transfer_fee_green', 10, 2)->nullable()->after('same_day_transfer_fee_white')->comment('當日調車費用-綠牌');
            $table->decimal('same_day_transfer_fee_electric', 10, 2)->nullable()->after('same_day_transfer_fee_green')->comment('當日調車費用-電輔車');
            $table->decimal('same_day_transfer_fee_tricycle', 10, 2)->nullable()->after('same_day_transfer_fee_electric')->comment('當日調車費用-三輪車');
            
            // 跨日調車費用（按車型）
            $table->decimal('overnight_transfer_fee_white', 10, 2)->nullable()->after('same_day_transfer_fee_tricycle')->comment('跨日調車費用-白牌');
            $table->decimal('overnight_transfer_fee_green', 10, 2)->nullable()->after('overnight_transfer_fee_white')->comment('跨日調車費用-綠牌');
            $table->decimal('overnight_transfer_fee_electric', 10, 2)->nullable()->after('overnight_transfer_fee_green')->comment('跨日調車費用-電輔車');
            $table->decimal('overnight_transfer_fee_tricycle', 10, 2)->nullable()->after('overnight_transfer_fee_electric')->comment('跨日調車費用-三輪車');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            // 刪除新的8個欄位
            $columnsToDrop = [
                'same_day_transfer_fee_white',
                'same_day_transfer_fee_green',
                'same_day_transfer_fee_electric',
                'same_day_transfer_fee_tricycle',
                'overnight_transfer_fee_white',
                'overnight_transfer_fee_green',
                'overnight_transfer_fee_electric',
                'overnight_transfer_fee_tricycle',
            ];
            
            foreach ($columnsToDrop as $column) {
                if (Schema::hasColumn('partners', $column)) {
                    $table->dropColumn($column);
                }
            }
        });

        // 回復舊的兩個欄位（如果需要）
        Schema::table('partners', function (Blueprint $table) {
            if (!Schema::hasColumn('partners', 'same_day_transfer_fee')) {
                $table->decimal('same_day_transfer_fee', 10, 2)->nullable()->after('default_shipping_company')->comment('當日調車費用');
            }
            if (!Schema::hasColumn('partners', 'overnight_transfer_fee')) {
                $table->decimal('overnight_transfer_fee', 10, 2)->nullable()->after('same_day_transfer_fee')->comment('跨日調車費用');
            }
        });
    }
};
