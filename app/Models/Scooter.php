<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Scooter extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'plate_number',
        'model',
        'type',
        'color',
        'status',
        'photo_path',
    ];

    /**
     * Get the store that owns the scooter.
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }

    /**
     * Get the orders for the scooter.
     */
    public function orders()
    {
        return $this->belongsToMany(Order::class, 'order_scooter');
    }

    /**
     * Get the fines for the scooter.
     */
    public function fines()
    {
        return $this->hasMany(Fine::class);
    }
}

