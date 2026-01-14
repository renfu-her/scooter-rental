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
     * 獲取機車的型號（透過 scooter 關聯）
     */
    public function scooterModel()
    {
        return $this->hasOneThrough(
            ScooterModel::class,
            Scooter::class,
            'id',           // scooters 表的外鍵
            'id',           // scooter_models 表的外鍵
            'scooter_id',   // order_scooter 表的外鍵
            'scooter_model_id' // scooters 表的外鍵
        );
    }

    /**
     * 獲取機車型號名稱（透過關聯取得）
     */
    public function getModelNameAttribute()
    {
        if ($this->scooter && $this->scooter->scooterModel) {
            return $this->scooter->scooterModel->name;
        }
        return $this->scooter->model ?? null;
    }

    /**
     * 獲取機車型號類型（透過關聯取得）
     */
    public function getModelTypeAttribute()
    {
        if ($this->scooter && $this->scooter->scooterModel) {
            return $this->scooter->scooterModel->type;
        }
        return $this->scooter->type ?? null;
    }

    /**
     * 獲取機車型號字串（name + type）
     * 優先順序：scooterModel > scooter.model/type > plate_number
     */
    public function getModelStringAttribute()
    {
        // 優先使用 scooterModel 關聯的 name 和 type
        if ($this->scooter && $this->scooter->scooterModel) {
            $name = $this->scooter->scooterModel->name ?? '';
            $type = $this->scooter->scooterModel->type ?? '';
            if ($name && $type) {
                return "{$name} {$type}";
            }
            if ($name) {
                return $name;
            }
            if ($type) {
                return $type;
            }
        }
        
        // 如果沒有 scooterModel，使用 scooter 本身的 model 和 type 欄位
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
