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
        Schema::create('scooter_model_colors', function (Blueprint $table) {
            $table->id();
            $table->string('model', 100)->unique()->comment('機車型號');
            $table->string('color', 7)->comment('顏色 (hex 格式)');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('scooter_model_colors');
    }
};
