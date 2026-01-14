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
        'scooter_model_id',
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
     * Get the order_scooter pivot records for the scooter.
     */
    public function orderScooters()
    {
        return $this->hasMany(OrderScooter::class);
    }

    /**
     * Get the fines for the scooter.
     */
    public function fines()
    {
        return $this->hasMany(Fine::class);
    }

    /**
     * Get the scooter model for this scooter.
     */
    public function scooterModel()
    {
        return $this->belongsTo(ScooterModel::class);
    }

    /**
     * Get the model name from scooter model relationship.
     */
    public function getModelAttribute()
    {
        return $this->scooterModel ? $this->scooterModel->name : $this->attributes['model'] ?? null;
    }

    /**
     * Get the type from scooter model relationship.
     */
    public function getTypeAttribute()
    {
        return $this->scooterModel ? $this->scooterModel->type : $this->attributes['type'] ?? null;
    }
}

