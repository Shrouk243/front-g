<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('notifications', function (Blueprint $table) {
        $table->id(); // لارفيل بيحب الـ UUID في التنبيهات
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->enum('type', ['critical', 'ai', 'reminder', 'system']);
        $table->string('title');
        $table->text('message');
        $table->boolean('read')->default(false);
        $table->boolean('action_required')->default(false);
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('notifications');
}  
    
};
