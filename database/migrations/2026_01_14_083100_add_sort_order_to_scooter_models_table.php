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
        Schema::table('scooter_models', function (Blueprint $table) {
            if (!Schema::hasColumn('scooter_models', 'sort_order')) {
                $table->integer('sort_order')->default(0)->after('image_path')->comment('排序順序，數字越大越靠前');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scooter_models', function (Blueprint $table) {
            if (Schema::hasColumn('scooter_models', 'sort_order')) {
                $table->dropColumn('sort_order');
            }
        });
    }
};
