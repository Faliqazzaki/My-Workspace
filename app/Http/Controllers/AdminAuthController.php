<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AdminAuthController extends Controller
{
    public function showLogin(Request $request): Response|RedirectResponse
    {
        if ($this->isAuthenticatedAdmin($request)) {
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
            'remember' => ['nullable', 'boolean'],
        ]);

        $remember = $request->boolean('remember');

        $isValid = Auth::attempt([
            'username' => $credentials['username'],
            'password' => $credentials['password'],
            'is_admin' => true,
        ], $remember);

        if (! $isValid) {
            return back()
                ->withErrors([
                    'username' => 'Username atau password salah.',
                ])
                ->onlyInput('username');
        }

        $request->session()->regenerate();

        return redirect()->intended(route('admin.index'));
    }

    public function logout(Request $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        if ($user) {
            $user->forceFill(['remember_token' => null])->save();
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('home');
    }

    private function isAuthenticatedAdmin(Request $request): bool
    {
        return $request->user()?->is_admin === true;
    }
}
