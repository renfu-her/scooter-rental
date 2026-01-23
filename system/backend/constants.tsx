
import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, Bike, AlertCircle, Image as ImageIcon, Settings, Shield, User, FileText, MapPin, Home } from 'lucide-react';

export const NAV_ITEMS = [
  { 
    title: '租借管理', 
    icon: <LayoutDashboard size={20} />, 
    permission: null, // 所有角色都可以使用
    children: [
      { name: '訂單管理', path: '/orders' },
      { name: '罰單管理', path: '/fines' }
    ]
  },
  { 
    title: '機車管理', 
    icon: <Bike size={20} />, 
    permission: null, // 所有角色都可以使用
    children: [
      { name: '機車清單', path: '/scooters' },
      { name: '機車型號管理', path: '/scooter-models' },
      { name: '機車類型管理', path: '/scooter-types' },
      { name: '機車配件', path: '/accessories' }
    ]
  },
  { 
    title: '合作商管理', 
    icon: <Users size={20} />, 
    permission: null, // 所有角色都可以使用
    path: '/partners'
  },
  { 
    title: '商店管理', 
    icon: <ShoppingCart size={20} />, 
    permission: 'can_manage_stores', // 需要授權商店管理
    path: '/stores'
  },
  { 
    title: '網站內容管理', 
    icon: <Home size={20} />, 
    permission: 'can_manage_content', // 需要授權網站內容管理
    children: [
      { name: '首頁 Banner', path: '/banners' },
      { name: '首頁圖片', path: '/home-images' },
      { name: '環境圖片', path: '/environment-images' },
      { name: '專車接送圖片', path: '/shuttle-images' },
      { name: '租車方案', path: '/rental-plans' },
      { name: '租車須知', path: '/guidelines' },
      { name: '聯絡我們', path: '/contact-infos' },
      { name: '門市據點', path: '/locations' },
      { name: '民宿推薦', path: '/guesthouses' },
      { name: '預約管理', path: '/bookings' }
    ]
  },
  { 
    title: '系統', 
    icon: <Settings size={20} />, 
    permission: 'super_admin', // 只有 super_admin 可以使用
    children: [image.png
      { name: '系統管理者管理', path: '/admins' }
    ]
  }
];

// 路由權限映射：路徑 -> 權限要求
export const ROUTE_PERMISSIONS: Record<string, string | null> = {
  '/orders': null, // 所有角色都可以使用
  '/fines': null,
  '/scooters': null,
  '/scooter-models': null,
  '/scooter-types': null,
  '/accessories': null,
  '/partners': null,
  '/stores': 'can_manage_stores', // 需要授權商店管理
  '/banners': 'can_manage_content', // 需要授權網站內容管理
  '/home-images': 'can_manage_content',
  '/environment-images': 'can_manage_content',
  '/shuttle-images': 'can_manage_content',
  '/rental-plans': 'can_manage_content',
  '/guidelines': 'can_manage_content',
  '/contact-infos': 'can_manage_content',
  '/locations': 'can_manage_content',
  '/guesthouses': 'can_manage_content',
  '/bookings': 'can_manage_content',
  '/admins': 'super_admin', // 只有 super_admin 可以使用
};
