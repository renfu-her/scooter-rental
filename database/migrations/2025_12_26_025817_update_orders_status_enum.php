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
        // 步驟 1: 先將 enum 改為包含所有新舊狀態值，這樣才能更新資料
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('進行中', '已完成', '已取消', '預約中', '已預訂', '待接送', '在合作商') DEFAULT '預約中'");
        
        // 步驟 2: 將舊的狀態值更新為新的狀態值
        // 預約中 -> 已預訂
        DB::table('orders')->where('status', '預約中')->update(['status' => '已預訂']);
        // 已取消 -> 已完成
        DB::table('orders')->where('status', '已取消')->update(['status' => '已完成']);
        
        // 步驟 3: 修改 status enum 值為只包含新狀態值
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('已預訂', '進行中', '待接送', '已完成', '在合作商') DEFAULT '已預訂'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 先將新的狀態值更新回舊的狀態值
        // 已預訂 -> 預約中
        DB::table('orders')->where('status', '已預訂')->update(['status' => '預約中']);
        // 待接送、在合作商 -> 進行中（或可以改為其他合適的狀態）
        DB::table('orders')->whereIn('status', ['待接送', '在合作商'])->update(['status' => '進行中']);
        
        // 恢復原來的 enum 值
        DB::statement("ALTER TABLE orders MODIFY COLUMN status ENUM('進行中', '已完成', '已取消', '預約中') DEFAULT '預約中'");
    }
};
