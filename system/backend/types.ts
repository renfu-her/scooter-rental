
export enum OrderStatus {
  IN_PROGRESS = '進行中',
  COMPLETED = '已完成',
  CANCELLED = '已取消',
  RESERVED = '預約中'
}

export enum ScooterType {
  WHITE = '白牌',
  GREEN = '綠牌',
  ELECTRIC_ASSIST = '電輔車'
}

export enum PaymentMethod {
  CASH = '現金',
  MONTHLY = '月結',
  DAILY = '日結'
}

export enum ShippingCompany {
  TAIFU = '泰富',
  BLUEWHITE = '藍白',
  JOINT = '聯營',
  DAFU = '大福'
}

export interface Partner {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  taxId?: string; // 統編
  manager: string;
}

export interface Scooter {
  id: string;
  plateNumber: string;
  model: string; // e.g. ES-2000, ES-1000, EB-500
  color?: '黑' | '白';
  type: ScooterType;
  status: '待出租' | '出租中';
}

export interface OrderScooterInfo {
  model: string;
  count: number;
}

export interface Order {
  id: string;
  status: OrderStatus;
  tenant: string; // 承租人
  appointmentDate: string; // 預約日期
  startTime: string; // 租借開始時間
  endTime: string; // 租借結束時間
  expectedReturnTime: string; // 預計還車時間
  scooters: OrderScooterInfo[];
  shippingInfo: {
    company: ShippingCompany;
    arrival: string; // 來
    return: string;  // 回
  };
  phone: string;
  partner: string; // 合作商
  payment: {
    method: PaymentMethod;
    amount: number;
  };
  remark: string;
}
