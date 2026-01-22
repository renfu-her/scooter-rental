<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 創建系統管理員（super_admin）
        User::updateOrCreate(
            ['email' => 'admin@admin.com'],
            [
                'name' => 'admin',
                'email' => 'admin@admin.com',
                'password' => Hash::make('admin123'),
                'role' => 'super_admin',
                'status' => 'active',
                'store_id' => 3, // super_admin 預設 store_id 為 3
                'can_manage_stores' => true,
                'can_manage_content' => true,
            ]
        );
    }
}
