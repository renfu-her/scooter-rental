<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'line_id',
        'phone',
        'email',
        'scooter_type',
        'booking_date',
        'end_date',
        'rental_days',
        'shipping_company',
        'ship_arrival_time',
        'adults',
        'children',
        'scooters',
        'note',
        'status',
        'partner_id',
        'total_amount',
    ];

    protected $casts = [
        'booking_date' => 'date',
        'end_date' => 'date',
        'ship_arrival_time' => 'datetime',
        'scooters' => 'array',
        'adults' => 'integer',
        'children' => 'integer',
        'total_amount' => 'integer',
    ];
}
