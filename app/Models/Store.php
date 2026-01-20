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
        'notice',
    ];

    /**
     * Get the scooters for the store.
     */
    public function scooters()
    {
        return $this->hasMany(Scooter::class);
    }

    /**
     * Get the environment images for the store.
     */
    public function environmentImages()
    {
        return $this->hasMany(StoreEnvironmentImage::class)->orderBy('sort_order', 'asc');
    }
}

