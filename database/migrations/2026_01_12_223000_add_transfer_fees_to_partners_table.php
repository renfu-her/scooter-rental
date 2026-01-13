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
            $table->decimal('same_day_transfer_fee', 10, 2)->nullable()->after('default_shipping_company')->comment('當日調車費用');
            $table->decimal('overnight_transfer_fee', 10, 2)->nullable()->after('same_day_transfer_fee')->comment('跨日調車費用');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn(['same_day_transfer_fee', 'overnight_transfer_fee']);
        });
    }
};
