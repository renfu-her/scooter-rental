
import React from 'react';
import { LayoutDashboard, ShoppingCart, Users, Bike, AlertCircle, Image as ImageIcon, Settings } from 'lucide-react';

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
    title: '網站管理', 
    icon: <Settings size={20} />, 
    children: [
      { name: '首頁輪播圖', path: '/banners' }
    ]
  },
  { 
    title: '合作商管理', 
    icon: <Users size={20} />, 
    path: '/partners'
  }
];
