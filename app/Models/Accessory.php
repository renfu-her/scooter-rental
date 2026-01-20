<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Accessory extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'category',
        'stock',
        'rent_price',
        'status',
        'store_id',
    ];

    protected $casts = [
        'stock' => 'integer',
        'rent_price' => 'decimal:2',
        'store_id' => 'integer',
    ];

    /**
     * Get the store that owns the accessory.
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Update status based on stock
     */
    public function updateStatus(): void
    {
        if ($this->stock === 0) {
            $this->status = '缺貨';
        } elseif ($this->stock < 10) {
            $this->status = '低庫存';
        } else {
            $this->status = '充足';
        }
        $this->save();
    }
}

