import { IBranch } from './Branch';
import { ICustomer } from './customer';
import { IEmployee } from './employee';
import { IShop } from './shop';
import { IProduct } from './Product'; // Replaces IProductBatch

export enum SaleStatus {
  NOT_APPROVED = 'NOT_APPROVED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  APPROVED = 'APPROVED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export enum ItemSaleStatus {
  PENDING = 'PENDING',
  DELIVERED = 'DELIVERED'
}
export enum SellPaymentStatus {
  PENDING = "PENDING",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  CANCELLED = "CANCELLED",
}
export interface ISellPayment {
  id: string;

  sellId: string;

  amount: number;

  createdById?: string;
  createdBy?: IEmployee;

  createdAt: string;
  updatedAt: string;
}
// ✅ Sell Model Interface
export interface ISell {
  id: string; // UUID
  invoiceNo: string;
  imageUrl      ? : string;
  documentUrl?  : string;
  locked: boolean;
  saleStatus: SaleStatus; // Matches enum
  paymentStatus: SellPaymentStatus;

  balance: number;
  totalPaid: number;
  branchId?: string;
  branch?: IBranch;

  customerId?: string;
  customer?: ICustomer;

  totalProducts: number;
  subTotal: number;
  discount: number;
  vat: number;
  grandTotal: number;
  NetTotal: number;

  notes?: string;
  saleDate: string; // ISO string date

  createdById?: string;
  createdBy?: IEmployee;

  updatedById?: string;
  updatedBy?: IEmployee;

  createdAt: string;
  updatedAt: string;

  // Relations
  items?: ISellItem[];
}

// ✅ SellItem Model Interface
export interface ISellItem {
  id: string;
  sellId: string;
  sell?: ISell;

  productId: string;
  product?: IProduct;

  shopId: string;
  shop?: IShop;

 isBox: boolean; // ✅ Box or Piece

  itemSaleStatus: ItemSaleStatus;

  quantity: number;

  givenQuantity?:  number;
  remainingQuantity ? :  number;       
  unitPrice: number;
  totalPrice: number;

  createdAt: string;
  updatedAt: string;

}

// ✅ SellItemBatch Model Interface

