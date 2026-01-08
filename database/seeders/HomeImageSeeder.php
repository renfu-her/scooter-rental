<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\HomeImage;

class HomeImageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $images = [
            [
                'key' => 'hero_image',
                'alt_text' => 'Scooter riding at sunset',
            ],
            [
                'key' => 'featured_image_1',
                'alt_text' => 'Scenic',
            ],
            [
                'key' => 'featured_image_2',
                'alt_text' => 'Scooter Detail',
            ],
            [
                'key' => 'featured_image_3',
                'alt_text' => 'Couple Riding',
            ],
            [
                'key' => 'featured_image_4',
                'alt_text' => 'Shop Interior',
            ],
        ];

        foreach ($images as $image) {
            HomeImage::updateOrCreate(
                ['key' => $image['key']],
                ['alt_text' => $image['alt_text']]
            );
        }
    }
}
