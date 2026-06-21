<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory; // تأكد من هذا السطر
use Illuminate\Database\Eloquent\Model;

class AIAnalysis extends Model
{
    use HasFactory;

    protected $table = 'ai_analyses';

    protected $fillable = [
        'user_id', 
        'risk_level', 
        'summary', 
        'recommendations', 
        'explanation', 
        'health_score'
    ];

    protected $casts = [
        'recommendations' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
