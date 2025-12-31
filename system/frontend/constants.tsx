
import React from 'react';
import { NavItem, ScooterPlan, FAQItem, Guesthouse } from './types';

export const NAV_ITEMS: NavItem[] = [
  { label: '關於我們', path: '/about' },
  { label: '租車方案', path: '/rental' },
  { label: '租車須知', path: '/guidelines' },
  { label: '線上預約', path: '/booking' },
  { label: '交通位置', path: '/location' },
  { label: '民宿推薦', path: '/guesthouses' },
  { label: '聯絡我們', path: '/contact' },
];

export const SCOOTER_PLANS: ScooterPlan[] = [
  {
    id: 'viva-mix',
    name: 'VIVA MIX 白牌',
    type: 'white',
    price: 800,
    description: '兩天一夜起',
    details: ['隨車附贈安全帽、衛生帽套', '長租有更多優惠'],
    image: 'https://picsum.photos/seed/scoot1/800/800',
    colorClass: 'bg-[#76e3b0]',
  },
  {
    id: 'viva-green',
    name: 'VIVA 綠牌',
    type: 'green',
    price: 600,
    description: '兩天一夜起',
    details: ['隨車附贈安全帽、衛生帽套', '長租有更多優惠', '注意：逾時以$100/小時計算；逾時4小時以上以1日計算'],
    image: 'https://picsum.photos/seed/scoot2/800/800',
    colorClass: 'bg-white',
  },
];

export const FAQS: FAQItem[] = [
  {
    category: '租車須知',
    question: '須具備那些駕照？',
    answer: '租借白牌電動車（如VIVA MIX）需具備普通重型機車駕照。租借綠牌電動車（如VIVA）需具備普通輕型機車駕照或汽車駕照。',
  },
  {
    category: '租車須知',
    question: '機車有提供那些配件？',
    answer: '每輛車皆隨附兩頂安全帽及拋棄式衛生帽套。',
  },
  {
    category: '門市資訊',
    question: '門市營運時間？',
    answer: '週一至週日 08:00 - 18:00，全年無休（除不可抗力因素如颱風）。',
  },
];

export const GUESTHOUSES: Guesthouse[] = [
  {
    name: '海景民宿 A',
    description: '坐擁無敵海景，步行即可到達碼頭。',
    image: 'https://picsum.photos/seed/house1/600/400',
  },
  {
    name: '特色老屋 B',
    description: '結合現代裝潢與在地文化，給您溫馨的家。',
    image: 'https://picsum.photos/seed/house2/600/400',
  },
];

export const Logo = () => (
  <div className="flex flex-col items-center">
    <div className="text-2xl font-bold tracking-tighter serif">蘭光租賃中心</div>
    <div className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">Languang Rental</div>
  </div>
);
