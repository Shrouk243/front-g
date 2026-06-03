<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'date_of_birth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in(['male', 'female', 'other'])],
            'chronic_conditions' => ['nullable', 'array'],
            'chronic_conditions.*' => ['string', Rule::in(['diabetes', 'hypertension', 'asthma', 'heart', 'none'])],
            'height_cm' => ['nullable', 'integer', 'min:0', 'max:300'],
            'weight_kg' => ['nullable', 'integer', 'min:0', 'max:500'],
            'avatar' => ['nullable', 'url', 'max:2048'],
        ]);

        $user = $request->user();

        if (isset($validated['chronic_conditions'])) {
            $validated['chronic_conditions'] = array_values(array_unique($validated['chronic_conditions']));
        }

        $user->update($validated);

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user->fresh(),
        ]);
    }
}
