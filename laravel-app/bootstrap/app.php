<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Console\Scheduling\Schedule;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum SPA cookie auth (opsional; token Bearer tetap bekerja)
        $middleware->statefulApi();

        // Alias RBAC granuler: Route::middleware(['auth:sanctum', 'role:doctor|nurse'])
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureRole::class,
        ]);
    })
    ->withSchedule(function (Schedule $schedule): void {
        // Smart Reminder ≤ 2 jam — terproses tiap menit (scheduler + queue worker)
        $schedule->call(fn () => app(\App\Http\Controllers\AppointmentController::class)->processDueReminders())
            ->everyMinute()
            ->name('appointment-reminders-sub2h')
            ->withoutOverlapping();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
