<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'date_of_birth',
        'gender',
        'chronic_conditions',
        'height_cm',
        'weight_kg',
        'avatar',
        'telegram_chat_id',
        'telegram_username',
        'telegram_connected_at',
        'telegram_alerts_enabled',
        'telegram_recommendations_enabled',
        'telegram_daily_summary_enabled',
        'latest_recommendation',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
        'password' => 'hashed',
        'date_of_birth' => 'date',
        'chronic_conditions' => 'array',
        'height_cm' => 'integer',
        'weight_kg' => 'integer',
        'telegram_connected_at' => 'datetime',
        'telegram_alerts_enabled' => 'boolean',
        'telegram_recommendations_enabled' => 'boolean',
        'telegram_daily_summary_enabled' => 'boolean',
    ];

    protected $attributes = [
        'chronic_conditions' => '[]',
    ];

    public function vitalSigns()
    {
        return $this->hasMany(VitalSign::class);
    }

    public function aiAnalyses()
    {
        return $this->hasMany(AIAnalysis::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function telegramConnectTokens()
    {
        return $this->hasMany(TelegramConnectToken::class);
    }
}
