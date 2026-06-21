<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VitalSign extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id',
    'type',
    'value',
    'systolic',
    'diastolic',
    'status',
    'measured_at',
    'source',
];

    protected $casts = [
        'measured_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
