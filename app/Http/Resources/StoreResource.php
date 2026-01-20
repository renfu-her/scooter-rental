<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StoreResource extends JsonResource
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
            'address' => $this->address,
            'phone' => $this->phone,
            'manager' => $this->manager,
            'photo_path' => $this->photo_path ? asset('storage/' . $this->photo_path) : null,
            'notice' => $this->notice,
            'environment_images' => $this->whenLoaded('environmentImages', function () {
                return $this->environmentImages->map(function ($image) {
                    return [
                        'id' => $image->id,
                        'image_path' => asset('storage/' . $image->image_path),
                        'sort_order' => $image->sort_order,
                    ];
                });
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

