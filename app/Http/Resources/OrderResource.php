<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $scooters = $this->whenLoaded('scooters', function () {
            return $this->scooters->groupBy('model')->map(function ($group) {
                return [
                    'model' => $group->first()->model,
                    'count' => $group->count(),
                ];
            })->values();
        }, []);

        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'partner_id' => $this->partner_id,
            'partner' => $this->whenLoaded('partner', function () {
                return $this->partner ? new PartnerResource($this->partner) : null;
            }),
            'tenant' => $this->tenant,
            'appointment_date' => $this->appointment_date->format('Y-m-d'),
            'start_time' => $this->start_time->format('Y-m-d H:i:s'),
            'end_time' => $this->end_time->format('Y-m-d H:i:s'),
            'expected_return_time' => $this->expected_return_time ? $this->expected_return_time->format('Y-m-d H:i:s') : null,
            'phone' => $this->phone,
            'shipping_company' => $this->shipping_company,
            'ship_arrival_time' => $this->ship_arrival_time ? $this->ship_arrival_time->format('Y-m-d H:i:s') : null,
            'ship_return_time' => $this->ship_return_time ? $this->ship_return_time->format('Y-m-d H:i:s') : null,
            'payment_method' => $this->payment_method,
            'payment_amount' => (float) $this->payment_amount,
            'status' => $this->status,
            'remark' => $this->remark,
            'scooters' => $scooters,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

