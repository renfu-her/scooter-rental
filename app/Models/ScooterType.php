<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ScooterType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'color',
    ];

    /**
     * Get the scooter models for this type.
     */
    public function scooterModels()
    {
        return $this->hasMany(ScooterModel::class);
    }
}
