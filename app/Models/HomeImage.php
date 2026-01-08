<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HomeImage extends Model
{
    use HasFactory;

    protected $fillable = [
        'key',
        'image_path',
        'alt_text',
    ];
}
