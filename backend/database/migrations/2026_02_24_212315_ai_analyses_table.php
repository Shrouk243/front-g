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
    Schema::create('ai_analyses', function (Blueprint $table) {
        $table->id();
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        $table->enum('risk_level', ['low', 'medium', 'high']);
        $table->text('summary');
        $table->json('recommendations'); // مصفوفة نصائح AI
        $table->text('explanation');
        $table->integer('health_score');
        $table->timestamps();
    });
}

public function down(): void
{
    Schema::dropIfExists('ai_analyses');
}
};