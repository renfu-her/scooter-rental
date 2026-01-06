
import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, Bike, AlertCircle, Image as ImageIcon, Settings, Shield, User, FileText, MapPin, Home } from 'lucide-react';

export const NAV_ITEMS = [
  { 
    title: '租借管理', 
    icon: <LayoutDashboard size={20} />, 
    children: [
      { name: '訂單管理', path: '/orders' },
      { name: '罰單管理', path: '/fines' }
    ]
  },
  { 
    title: '機車管理', 
    icon: <Bike size={20} />, 
    children: [
      { name: '機車清單', path: '/scooters' },
      { name: '機車配件', path: '/accessories' }
    ]
  },
  { 
    title: '合作商管理', 
    icon: <Users size={20} />, 
    path: '/partners'
  },
  { 
    title: '商店管理', 
    icon: <ShoppingCart size={20} />, 
    path: '/stores'
  },
  { 
    title: '網站內容管理', 
    icon: <Home size={20} />, 
    children: [
      { name: '首頁 Banner', path: '/banners' },
      { name: '租車方案', path: '/rental-plans' },
      { name: '租車須知', path: '/guidelines' },
      { name: '門市據點', path: '/locations' },
      { name: '民宿推薦', path: '/guesthouses' },
      { name: '預約管理', path: '/bookings' }
    ]
  },
  { 
    title: '系統', 
    icon: <Settings size={20} />, 
    children: [
      { name: '系統管理者管理', path: '/admins' }
    ]
  }
];
