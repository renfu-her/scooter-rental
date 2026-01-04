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
        // Create new locations table
        Schema::create('locations', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // 門市名稱，例如：蘭光電動機車小琉球店
            $table->string('address')->nullable();
            $table->string('phone')->nullable();
            $table->string('hours')->nullable();
            $table->text('description')->nullable(); // HTML 內容
            $table->string('image_path')->nullable();
            $table->text('map_embed')->nullable(); // Google Maps embed iframe 代碼
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Migrate existing data from location table to locations table
        if (Schema::hasTable('location')) {
            $existingLocation = DB::table('location')->first();
            if ($existingLocation) {
                DB::table('locations')->insert([
                    'name' => $existingLocation->title ?? '蘭光電動機車小琉球店',
                    'address' => $existingLocation->address,
                    'phone' => $existingLocation->phone,
                    'hours' => $existingLocation->hours,
                    'description' => $existingLocation->description,
                    'image_path' => $existingLocation->image_path,
                    'map_embed' => $existingLocation->map_url,
                    'sort_order' => 0,
                    'is_active' => true,
                    'created_at' => $existingLocation->created_at ?? now(),
                    'updated_at' => $existingLocation->updated_at ?? now(),
                ]);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('locations');
    }
};
