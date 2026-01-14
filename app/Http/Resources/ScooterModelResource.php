<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScooterModelResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'scooter_type_id' => $this->scooter_type_id,
            'scooter_type' => $this->whenLoaded('scooterType', function () {
                return [
                    'id' => $this->scooterType->id,
                    'name' => $this->scooterType->name,
                    'color' => $this->scooterType->color,
                ];
            }),
            'type' => $this->type,
            'image_path' => $this->image_path ? asset('storage/' . $this->image_path) : null,
            'color' => $this->color, // 從 scooterType 取得
            'sort_order' => $this->sort_order ?? 0,
            'label' => $this->name . ' ' . $this->type, // 組合顯示：例如 "ES-2000 白牌"
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
