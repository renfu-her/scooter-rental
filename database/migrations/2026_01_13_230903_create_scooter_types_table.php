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
        Schema::create('scooter_types', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique()->comment('機車類型名稱，如 白牌、綠牌、電輔車、三輪車');
            $table->string('color')->nullable()->comment('顏色（hex 格式，如 #7DD3FC）');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scooter_types');
    }
};
