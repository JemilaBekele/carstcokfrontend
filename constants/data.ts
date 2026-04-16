import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    permission: 'VIEW_MAIN_DASHBOARD',
    items: [] // Empty array as there are no child items for Dashboard Own_dashboard
  },
  // {
  //   title: 'Company',
  //   url: '/dashboard/Company',
  //   icon: 'billing',
  //   permission: 'VIEW_COMPANY'
  // },
  {
    title: 'Report',
    url: '/dashboard/',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    permission: 'VIEW_SALES_REPORT_VIEW_DASHBOARD',

    items: [
      {
        title: 'All Sells Trend',
        url: '/dashboard/Selllist',
        // icon: 'userPen',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_ALL_SELLS_TREND'
      },
      {
        title: 'Sales Rank',
        url: '/dashboard/Reportsellstatic',
        // icon: 'userPen',
        shortcut: ['ps', 'ps'],
        permission: 'VIEW_SALES_RANK'
      }
    ] // Empty  array as there are no child items for Dashboard Own_dashboard
  },
  {
    title: 'POS',
    url: '/dashboard/',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    permission: 'VIEW_SELL_DASHBOARD',

    items: [
      // {
      //   title: 'My Sales Report',
      //   url: '/dashboard/SalesCreatorDashboard',
      //   icon: 'userPen',
      //   shortcut: ['ro', 'ro'],
      //   permission: 'CREATE_SELL'
      // },
      {
        title: 'Order',
        url: '/dashboard/Pos',
        // icon: 'userPen',
        shortcut: ['ro', 'ro'],
        permission: 'CREATE_SELL'
      },
      {
        title: 'View All Orders',
        url: '/dashboard/Sell',
        // icon: 'userPen',
        shortcut: ['rs', 'rs'],
        permission: 'VIEW_ALL_SELLS'
      },
      {
        title: 'My Orders ',
        url: '/dashboard/UserBasedSell',
        // icon: 'userPen',
        shortcut: ['rs', 'rs'],
        permission: 'CREATE_SELL'
      }
    ] // Empty array as there are no child items for Dashboard Own_dashboard
  },
  {
    title: 'Manage Store and shops',
    url: '/dashboard/',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    permission: 'VIEW_AND_MANAGE_STORE_AND_SHOPS',

    items: [
      // {
      //   title: 'Report',
      //   url: '/dashboard/StoreUserDashboard',
      //   icon: 'userPen',
      //   shortcut: ['ps', 'ps'],
      //   permission: 'VIEW_AND_MANAGE_STORE_AND_SHOPS'
      // },
      {
        title: 'Orders',
        url: '/dashboard/StoreOrder',
        // icon: 'userPen',
        shortcut: ['so', 'so'],
        permission: 'VIEW_AND_MANAGE_STORE_AND_SHOPS'
      }

      // {
      //   title: 'Shop Stock',
      //   url: '/dashboard/ShopStock', // Update to your actual subcategory page route UnitOfMeasure
      //   icon: 'userPen',
      //   shortcut: ['l', 'l'],
      //   permission: 'VIEW_AND_MANAGE_STORE_AND_SHOPS'
      // },

      // {
      //   title: 'Store Stock',
      //   url: '/dashboard/StoreStock', // Update to your actual subcategory page route UnitOfMeasure purchase
      //   icon: 'userPen',
      //   shortcut: ['s', 's'],
      //   permission: 'VIEW_AND_MANAGE_STORE_AND_SHOPS'
      // }
    ] // Empty  array as there are no child items for Dashboard Own_dashboard
  },
  {
    title: 'Product Management',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,
    permission: 'VIEW_PRODUCT_DASHBOARD',

    items: [
      {
        title: 'Category',
        url: '/dashboard/category', // Update to your actual category page route
        // icon: 'userPen',
        shortcut: ['c', 'c'],
        permission: 'VIEW_ALL_CATEGORIES'
      },
      // {
      //   title: 'Brand',
      //   url: '/dashboard/brand', // Update to your actual category page route
      //   // icon: 'userPen',
      //   shortcut: ['b', 'b'],
      //   permission: 'VIEW_ALL_CATEGORIES'
      // },
      // {
      //   title: 'Products',
      //   url: '/dashboard/Products', // Update to your actual subcategory page route UnitOfMeasure ProductBatch
      //   // icon: 'userPen',
      //   shortcut: ['u', 'u'],
      //   permission: 'VIEW_PRODUCT_ALL'
      // },
      {
        title: 'Purchase',
        url: '/dashboard/purchase', // Update to your actual subcategory page route UnitOfMeasure  Transfer
        // icon: 'userPen',
        shortcut: ['P', 'P'],
        permission: 'VIEW_ALL_PURCHASES'
      },
      {
        title: 'Transfer',
        url: '/dashboard/Transfer', // Update to your actual subcategory page route UnitOfMeasure
        // icon: 'userPen',
        shortcut: ['y', 'y'],
        permission: 'VIEW_ALL_TRANSFERS'
      },
      {
        title: 'Stock Correction',
        url: '/dashboard/StockCorrection', // Update to your actual subcategory page route UnitOfMeasure
        // icon: 'userPen',
        shortcut: ['s', 's'],
        permission: 'VIEW_ALL_STOCK_CORRECTIONS'
      }
    ]
  },
  {
    title: 'User',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,
    permission: 'VIEW_Users_DASHBOARD',

    items: [
      {
        title: 'Employee',
        url: '/dashboard/employee',
        icon: 'userPen',
        shortcut: ['eb', 'eb'],
        permission: 'VIEW_ALL_EMPLOYEES'
      },
      {
        title: 'Customer',
        url: '/dashboard/customer',
        icon: 'userPen',
        shortcut: ['b', 'b'],
        permission: 'VIEW_ALL_CUSTOMERS'
      },
      {
        title: 'Supplier',
        url: '/dashboard/supplier',
        icon: 'userPen',
        shortcut: ['l', 'l'],
        permission: 'VIEW_ALL_SUPPLIERS'
      }
    ]
  },
  {
    title: 'System',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,
    permission: 'VIEW_SYSTEM_DASHBOARD',
    items: [
      {
        title: 'Branch',
        url: '/dashboard/Branch',
        // icon: 'userPen',
        shortcut: ['b', 'b'],
        permission: 'VIEW_ALL_BRANCHES'
      },
      {
        title: 'Shop',
        url: '/dashboard/Shop',
        // icon: 'userPen',
        shortcut: ['h', 'h'],
        permission: 'VIEW_ALL_SHOPS'
      },
      {
        title: 'Store',
        url: '/dashboard/store',
        // icon: 'userPen',
        shortcut: ['sm', 'sm'],
        permission: 'VIEW_ALL_STORES'
      }
    ]
  },
  {
    title: 'Account',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,

    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        // icon: 'userPen',
        shortcut: ['m', 'm']
      }
    ]
  },
  {
    title: 'Role and Permission',
    url: '#', // Placeholder as there is no direct link for the parent
    icon: 'billing',
    isActive: true,
    permission: 'VIEW_ROLE_PERMISSION_DASHBOARD',

    items: [
      {
        title: 'Role',
        url: '/dashboard/Role',
        // icon: 'userPen',
        shortcut: ['ro', 'ro'],
        permission: 'VIEW_ALL_ROLES'
      },
      {
        title: 'Role Permission',
        url: '/dashboard/RolePermission',
        // icon: 'userPen',
        shortcut: ['po', 'po'],
        permission: 'VIEW_ALL_ROLE_PERMISSIONS'
      }, 
      {
        title: 'Permission',
        url: '/dashboard/Permission',
        // icon: 'userPen',
        shortcut: ['pr', 'pr'],
        permission: 'VIEW_ALL_PERMISSIONS'
      },
      //   {
      //   title: 'SellProduct',
      //   url: '/dashboard/SellProduct',
      //   // icon: 'userPen',
      //   shortcut: ['pr', 'pr'],
      //   permission: 'VIEW_ALL_PERMISSIONS'
      // },
      //     {
      //   title: 'Permis',
      //   url: '/dashboard/missstlege',
      //   // icon: 'userPen',
      //   shortcut: ['pr', 'pr'],
      //   permission: 'VIEW_ALL_PERMISSIONS'
      // }
    ]
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://github.com/JemilaBekele',
    initials: 'SD'
  }
];
