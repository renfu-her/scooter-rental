<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Make image_path nullable in banners table
        DB::statement('ALTER TABLE `banners` MODIFY `image_path` VARCHAR(255) NULL');

        // Make image_path nullable in rental_plans table
        DB::statement('ALTER TABLE `rental_plans` MODIFY `image_path` VARCHAR(255) NULL');

        // Make image_path nullable in guesthouses table
        DB::statement('ALTER TABLE `guesthouses` MODIFY `image_path` VARCHAR(255) NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revert image_path to not nullable in banners table
        DB::statement('ALTER TABLE `banners` MODIFY `image_path` VARCHAR(255) NOT NULL');

        // Revert image_path to not nullable in rental_plans table
        DB::statement('ALTER TABLE `rental_plans` MODIFY `image_path` VARCHAR(255) NOT NULL');

        // Revert image_path to not nullable in guesthouses table
        DB::statement('ALTER TABLE `guesthouses` MODIFY `image_path` VARCHAR(255) NOT NULL');
    }
};
