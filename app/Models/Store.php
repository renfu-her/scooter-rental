<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Store extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'address',
        'phone',
        'manager',
        'photo_path',
    ];

    /**
     * Get the scooters for the store.
     */
    public function scooters()
    {
        return $this->hasMany(Scooter::class);
    }
}

