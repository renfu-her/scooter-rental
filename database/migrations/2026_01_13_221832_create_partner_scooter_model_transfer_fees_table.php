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
        if (!Schema::hasTable('partner_scooter_model_transfer_fees')) {
            Schema::create('partner_scooter_model_transfer_fees', function (Blueprint $table) {
                $table->id();
                $table->foreignId('partner_id')->constrained('partners')->onDelete('cascade');
                $table->foreignId('scooter_model_id')->constrained('scooter_models')->onDelete('cascade');
                $table->unsignedInteger('same_day_transfer_fee')->nullable()->comment('當日調車費用');
                $table->unsignedInteger('overnight_transfer_fee')->nullable()->comment('跨日調車費用');
                $table->timestamps();
                
                // 確保每個合作商對每個機車型號只有一筆記錄（使用較短的索引名稱）
                $table->unique(['partner_id', 'scooter_model_id'], 'partner_scooter_model_unique');
            });
        } else {
            // 如果表已存在，檢查並添加缺失的索引（如果不存在）
            $indexes = DB::select("SHOW INDEX FROM partner_scooter_model_transfer_fees WHERE Key_name = 'partner_scooter_model_unique'");
            if (empty($indexes)) {
                Schema::table('partner_scooter_model_transfer_fees', function (Blueprint $table) {
                    $table->unique(['partner_id', 'scooter_model_id'], 'partner_scooter_model_unique');
                });
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('partner_scooter_model_transfer_fees');
    }
};
