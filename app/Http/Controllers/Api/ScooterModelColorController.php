<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ScooterModelColor;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ScooterModelColorController extends Controller
{
    /**
     * Get all model colors
     */
    public function index()
    {
        $colors = ScooterModelColor::orderBy('model')->get();
        return response()->json([
            'data' => $colors,
        ]);
    }

    /**
     * Get color for a specific model (auto-assign if not exists)
     */
    public function show(string $model)
    {
        $color = ScooterModelColor::getColorForModel($model);
        return response()->json([
            'model' => $model,
            'color' => $color,
        ]);
    }

    /**
     * Get colors for multiple models
     */
    public function getColors(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'models' => 'required|array',
            'models.*' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $models = $request->input('models');
        $colors = [];

        foreach ($models as $model) {
            $colors[$model] = ScooterModelColor::getColorForModel($model);
        }

        return response()->json([
            'data' => $colors,
        ]);
    }

    /**
     * Update color for a model
     */
    public function update(Request $request, string $model)
    {
        $validator = Validator::make($request->all(), [
            'color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $colorRecord = ScooterModelColor::where('model', $model)->first();
        
        if ($colorRecord) {
            $colorRecord->color = $request->input('color');
            $colorRecord->save();
        } else {
            $colorRecord = ScooterModelColor::create([
                'model' => $model,
                'color' => $request->input('color'),
            ]);
        }

        return response()->json([
            'data' => $colorRecord,
        ]);
    }

    /**
     * Delete color for a model
     */
    public function destroy(string $model)
    {
        $colorRecord = ScooterModelColor::where('model', $model)->first();
        
        if ($colorRecord) {
            $colorRecord->delete();
            return response()->json([
                'message' => 'Color deleted successfully',
            ]);
        }

        return response()->json([
            'message' => 'Color not found',
        ], 404);
    }
}
