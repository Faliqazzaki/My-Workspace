<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $username = (string) config('admin.username');
        $email = (string) config('admin.email');
        $password = (string) config('admin.password');

        User::query()->updateOrCreate(
            ['username' => $username],
            [
                'name' => 'Administrator',
                'email' => $email,
                'password' => $password,
                'is_admin' => true,
                'email_verified_at' => now(),
            ],
        );
    }
}
