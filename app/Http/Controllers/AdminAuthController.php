<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuthController extends Controller
{
    /**
     * Kredensial sementara. Nanti diganti dengan data dari database
     * beserta hashing password.
     */
    private const ADMIN_USERNAME = 'my-workspace';

    private const ADMIN_PASSWORD = 'admin123';

    public function showLogin(Request $request): Response|RedirectResponse
    {
        if ($request->session()->get('admin_authenticated')) {
            return redirect()->route('admin.index');
        }

        return Inertia::render('auth/admin-login', [
            'status' => $request->session()->get('status'),
        ]);
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $isValid = hash_equals(self::ADMIN_USERNAME, $credentials['username'])
            && hash_equals(self::ADMIN_PASSWORD, $credentials['password']);

        if (! $isValid) {
            return back()
                ->withErrors([
                    'username' => 'Username atau password salah.',
                ])
                ->onlyInput('username');
        }

        $request->session()->regenerate();
        $request->session()->put('admin_authenticated', true);
        $request->session()->put('admin_username', self::ADMIN_USERNAME);

        return redirect()->intended(route('admin.index'));
    }

    public function logout(Request $request): RedirectResponse
    {
        $request->session()->forget(['admin_authenticated', 'admin_username']);
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }
}
