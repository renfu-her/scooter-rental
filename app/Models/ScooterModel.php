<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScooterModel extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'scooter_type_id',
        'type',
        'image_path',
    ];

    /**
     * Get the scooter type for this model.
     */
    public function scooterType()
    {
        return $this->belongsTo(ScooterType::class);
    }

    /**
     * Get the scooters for this model.
     */
    public function scooters()
    {
        return $this->hasMany(Scooter::class);
    }

    /**
     * Get the transfer fees for this model.
     */
    public function transferFees()
    {
        return $this->hasMany(PartnerScooterModelTransferFee::class);
    }

    /**
     * Get the type from scooter type relationship.
     */
    public function getTypeAttribute()
    {
        return $this->scooterType ? $this->scooterType->name : $this->attributes['type'] ?? null;
    }

    /**
     * Get the color from scooter type relationship.
     */
    public function getColorAttribute()
    {
        return $this->scooterType ? $this->scooterType->color : null;
    }
}
