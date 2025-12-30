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
                // 獲取該 model 的類型（如果有多個，取第一個）
                $firstScooter = $group->first();
                $type = $firstScooter->type ?? null;
                // 顏色將由前端通過機車型號顏色 API 獲取
                return [
                    'model' => $firstScooter->model,
                    'type' => $type,
                    'count' => $group->count(),
                ];
            })->values();
        }, []);

        // 獲取機車 ID 列表（用於編輯）
        $scooterIds = $this->whenLoaded('scooters', function () {
            return $this->scooters->pluck('id')->toArray();
        }, []);

        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'partner_id' => $this->partner_id,
            'partner' => $this->whenLoaded('partner', function () {
                return $this->partner ? new PartnerResource($this->partner) : null;
            }),
            'tenant' => $this->tenant,
            'appointment_date' => $this->appointment_date ? $this->appointment_date->format('Y-m-d') : null,
            'sort_order' => $this->sort_order ?? 0,
            'start_time' => $this->start_time ? $this->start_time->format('Y-m-d H:i:s') : null,
            'end_time' => $this->end_time ? $this->end_time->format('Y-m-d H:i:s') : null,
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
            'scooter_ids' => $scooterIds, // 添加機車 ID 列表
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}

