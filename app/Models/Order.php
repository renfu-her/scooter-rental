<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_number',
        'partner_id',
        'tenant',
        'appointment_date',
        'start_time',
        'end_time',
        'expected_return_time',
        'phone',
        'shipping_company',
        'ship_arrival_time',
        'ship_return_time',
        'payment_method',
        'payment_amount',
        'status',
        'remark',
    ];

    protected $casts = [
        'appointment_date' => 'date',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'expected_return_time' => 'datetime',
        'ship_arrival_time' => 'datetime',
        'ship_return_time' => 'datetime',
        'payment_amount' => 'decimal:2',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($order) {
            if (empty($order->order_number)) {
                // 格式：ORD-年月-流水號（例如：ORD-202601-00001）
                $yearMonth = date('Ym'); // 例如：202601
                $prefix = 'ORD-' . $yearMonth . '-';
                
                // 查詢該月份的最大訂單編號
                $lastOrder = self::where('order_number', 'like', $prefix . '%')
                    ->orderBy('order_number', 'desc')
                    ->first();
                
                // 獲取下一個流水號
                if ($lastOrder) {
                    // 從訂單編號中提取流水號（例如：ORD-202601-00005 -> 00005）
                    $lastNumber = (int) substr($lastOrder->order_number, -5);
                    $nextNumber = $lastNumber + 1;
                } else {
                    // 該月份還沒有訂單，從 00001 開始
                    $nextNumber = 1;
                }
                
                // 格式化為5位數（前面補0）
                $sequence = str_pad($nextNumber, 5, '0', STR_PAD_LEFT);
                
                $order->order_number = $prefix . $sequence;
            }
        });
    }

    /**
     * Get the partner that owns the order.
     */
    public function partner()
    {
        return $this->belongsTo(Partner::class);
    }

    /**
     * Get the scooters for the order.
     */
    public function scooters()
    {
        return $this->belongsToMany(Scooter::class, 'order_scooter');
    }

    /**
     * Get the order_scooter pivot records for the order.
     */
    public function orderScooters()
    {
        return $this->hasMany(OrderScooter::class);
    }

    /**
     * Get the fines for the order.
     */
    public function fines()
    {
        return $this->hasMany(Fine::class);
    }
}

