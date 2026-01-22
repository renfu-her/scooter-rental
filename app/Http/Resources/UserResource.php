<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
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
            'email' => $this->email,
            'role' => $this->role,
            'phone' => $this->phone,
            'status' => $this->status,
            'store_id' => $this->store_id,
            'can_manage_stores' => $this->can_manage_stores,
            'can_manage_content' => $this->can_manage_content,
            'store' => $this->whenLoaded('store'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
