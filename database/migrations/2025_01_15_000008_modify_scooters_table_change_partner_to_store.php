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
        Schema::table('scooters', function (Blueprint $table) {
            // Drop old foreign key
            $table->dropForeign(['partner_id']);
            // Drop old column
            $table->dropColumn('partner_id');
            // Add new column
            $table->foreignId('store_id')->after('id')->constrained('stores')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('scooters', function (Blueprint $table) {
            // Drop new foreign key
            $table->dropForeign(['store_id']);
            // Drop new column
            $table->dropColumn('store_id');
            // Add back old column
            $table->foreignId('partner_id')->after('id')->constrained('partners')->onDelete('cascade');
        });
    }
};

