<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StoreEnvironmentImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'store_id',
        'image_path',
        'sort_order',
    ];

    protected $casts = [
        'sort_order' => 'integer',
    ];

    /**
     * Get the store that owns the environment image.
     */
    public function store()
    {
        return $this->belongsTo(Store::class);
    }
}
