
    
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
        Schema::create('vital_signs', function (Blueprint $table) {
            $table->id();

            // ربط القياسات بالمستخدم
            $table->foreignId('user_id')
                  ->constrained()
                  ->onDelete('cascade');

            // نوع القياس: ضغط دم، سكر، نبض، أكسجين
            $table->enum('type', ['blood_pressure', 'blood_sugar', 'heart_rate', 'oxygen']);

            // القيمة الأساسية (للنبض، السكر، الأكسجين)
            $table->decimal('value', 8, 2)->nullable();

            // خانات خاصة بضغط الدم
            $table->integer('systolic')->nullable();
            $table->integer('diastolic')->nullable();

            // الحالة
            $table->enum('status', ['normal', 'elevated', 'critical']);

            $table->timestamp('measured_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vital_signs');
    }
};


