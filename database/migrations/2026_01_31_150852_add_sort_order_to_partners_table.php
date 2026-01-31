<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->integer('sort_order')->default(0)->after('id');
        });

        // Initialize sort_order for existing partners
        $partners = DB::table('partners')->orderBy('id')->get();
        $sortOrder = 1;
        foreach ($partners as $partner) {
            DB::table('partners')
                ->where('id', $partner->id)
                ->update(['sort_order' => $sortOrder++]);
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('partners', function (Blueprint $table) {
            $table->dropColumn('sort_order');
        });
    }
};
