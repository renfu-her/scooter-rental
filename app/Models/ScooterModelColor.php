<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ScooterModelColor extends Model
{
    protected $fillable = [
        'model',
        'color',
    ];

    /**
     * Get color for a model, auto-assign if not exists
     */
    public static function getColorForModel(string $model): string
    {
        $color = self::where('model', $model)->first();
        
        if ($color) {
            return $color->color;
        }
        
        // Auto-assign a new color
        return self::assignColorForModel($model);
    }

    /**
     * Assign a color for a model automatically
     */
    public static function assignColorForModel(string $model): string
    {
        // 預定義的亮色調色板（稍微亮一點的顏色）
        $brightColors = [
            '#FF6B9D', // 粉紅色
            '#4ECDC4', // 青綠色
            '#45B7D1', // 天藍色
            '#FFA07A', // 淺橙紅色
            '#98D8C8', // 薄荷綠
            '#F7DC6F', // 亮黃色
            '#BB8FCE', // 淡紫色
            '#85C1E2', // 淺藍色
            '#F8B739', // 金黃色
            '#52BE80', // 翠綠色
            '#EC7063', // 珊瑚紅
            '#5DADE2', // 亮藍色
            '#F1948A', // 淺粉紅
            '#7FB3D3', // 淡藍色
            '#82E0AA', // 淺綠色
            '#F4D03F', // 亮黃色
            '#AF7AC5', // 淡紫色
            '#85C1E9', // 天藍色
            '#F39C12', // 橙色
            '#1ABC9C', // 青綠色
        ];

        // 獲取所有已使用的顏色
        $usedColors = self::pluck('color')->toArray();
        
        // 計算顏色距離的函數
        $colorDistance = function ($color1, $color2) {
            $rgb1 = self::hexToRgb($color1);
            $rgb2 = self::hexToRgb($color2);
            
            // 使用歐幾里得距離計算顏色相似度
            $rDiff = $rgb1['r'] - $rgb2['r'];
            $gDiff = $rgb1['g'] - $rgb2['g'];
            $bDiff = $rgb1['b'] - $rgb2['b'];
            
            return sqrt($rDiff * $rDiff + $gDiff * $gDiff + $bDiff * $bDiff);
        };

        // 找到最適合的顏色（與已使用顏色距離最遠）
        $bestColor = null;
        $maxMinDistance = 0;

        foreach ($brightColors as $candidateColor) {
            // 如果顏色已被使用，跳過
            if (in_array($candidateColor, $usedColors)) {
                continue;
            }

            // 計算與所有已使用顏色的最小距離
            $minDistance = PHP_INT_MAX;
            foreach ($usedColors as $usedColor) {
                $distance = $colorDistance($candidateColor, $usedColor);
                if ($distance < $minDistance) {
                    $minDistance = $distance;
                }
            }

            // 如果沒有已使用的顏色，使用第一個候選顏色
            if (empty($usedColors)) {
                $bestColor = $candidateColor;
                break;
            }

            // 選擇與已使用顏色距離最遠的顏色
            if ($minDistance > $maxMinDistance) {
                $maxMinDistance = $minDistance;
                $bestColor = $candidateColor;
            }
        }

        // 如果所有預定義顏色都被使用，生成一個隨機亮色
        if (!$bestColor) {
            $bestColor = self::generateBrightColor($usedColors);
        }

        // 儲存顏色對應關係
        self::create([
            'model' => $model,
            'color' => $bestColor,
        ]);

        return $bestColor;
    }

    /**
     * Convert hex color to RGB
     */
    private static function hexToRgb(string $hex): array
    {
        $hex = ltrim($hex, '#');
        return [
            'r' => hexdec(substr($hex, 0, 2)),
            'g' => hexdec(substr($hex, 2, 2)),
            'b' => hexdec(substr($hex, 4, 2)),
        ];
    }

    /**
     * Generate a bright color that is different from used colors
     */
    private static function generateBrightColor(array $usedColors): string
    {
        $attempts = 0;
        $maxAttempts = 100;
        
        while ($attempts < $maxAttempts) {
            // 生成一個亮色（RGB 值都較高）
            $r = rand(150, 255);
            $g = rand(150, 255);
            $b = rand(150, 255);
            
            $newColor = sprintf('#%02X%02X%02X', $r, $g, $b);
            
            // 檢查是否與已使用顏色太接近
            $tooClose = false;
            foreach ($usedColors as $usedColor) {
                $rgb1 = self::hexToRgb($newColor);
                $rgb2 = self::hexToRgb($usedColor);
                
                $distance = sqrt(
                    pow($rgb1['r'] - $rgb2['r'], 2) +
                    pow($rgb1['g'] - $rgb2['g'], 2) +
                    pow($rgb1['b'] - $rgb2['b'], 2)
                );
                
                // 如果距離小於 50，認為太接近
                if ($distance < 50) {
                    $tooClose = true;
                    break;
                }
            }
            
            if (!$tooClose) {
                return $newColor;
            }
            
            $attempts++;
        }
        
        // 如果無法生成合適的顏色，返回一個預設亮色
        return '#FFB6C1';
    }
}
