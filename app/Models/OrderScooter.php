<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderScooter extends Model
{
    use HasFactory;

    /**
     * 表名（因為表名是 order_scooter，不是 order_scooters）
     */
    protected $table = 'order_scooter';

    /**
     * 可批量賦值的屬性
     */
    protected $fillable = [
        'order_id',
        'scooter_id',
    ];

    /**
     * 獲取所屬的訂單
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * 獲取所屬的機車
     */
    public function scooter()
    {
        return $this->belongsTo(Scooter::class);
    }

    /**
     * 獲取機車型號名稱（從 scooter 表的 model 欄位取得）
     */
    public function getModelNameAttribute()
    {
        if ($this->scooter) {
            return $this->scooter->attributes['model'] ?? null;
        }
        return null;
    }

    /**
     * 獲取機車型號類型（從 scooter 表的 type 欄位取得）
     */
    public function getModelTypeAttribute()
    {
        if ($this->scooter) {
            return $this->scooter->attributes['type'] ?? null;
        }
        return null;
    }

    /**
     * 獲取機車型號字串（model + type）
     * 優先順序：scooter.model/type > plate_number
     */
    public function getModelStringAttribute()
    {
        if ($this->scooter) {
            $modelName = $this->scooter->attributes['model'] ?? '';
            $modelType = $this->scooter->attributes['type'] ?? '';
            
            if ($modelName && $modelType) {
                return trim("{$modelName} {$modelType}");
            }
            if ($modelName) {
                return $modelName;
            }
            if ($modelType) {
                return $modelType;
            }
            
            // 最後使用車牌號
            $plateNumber = $this->scooter->plate_number ?? '';
            if ($plateNumber) {
                return $plateNumber;
            }
        }
        
        // 如果都沒有，返回空字串（會被後續 filter 過濾掉）
        return '';
    }
}
