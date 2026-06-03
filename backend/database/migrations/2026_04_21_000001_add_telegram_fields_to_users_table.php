<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('telegram_chat_id')->nullable()->after('avatar');
            $table->string('telegram_username')->nullable()->after('telegram_chat_id');
            $table->timestamp('telegram_connected_at')->nullable()->after('telegram_username');
            $table->boolean('telegram_alerts_enabled')->default(true)->after('telegram_connected_at');
            $table->boolean('telegram_recommendations_enabled')->default(true)->after('telegram_alerts_enabled');
            $table->boolean('telegram_daily_summary_enabled')->default(false)->after('telegram_recommendations_enabled');
            $table->text('latest_recommendation')->nullable()->after('telegram_daily_summary_enabled');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'telegram_chat_id',
                'telegram_username',
                'telegram_connected_at',
                'telegram_alerts_enabled',
                'telegram_recommendations_enabled',
                'telegram_daily_summary_enabled',
                'latest_recommendation',
            ]);
        });
    }
};
