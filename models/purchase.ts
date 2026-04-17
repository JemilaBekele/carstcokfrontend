import { IEmployee } from './employee';
import { IProduct } from './Product';
import { IShop } from './shop';
import { IStore } from './store';
import { ISupplier } from './supplier';

export interface PurchaseItem {
    productId: string;

 isBox: boolean; // ✅ Box or Piece
    product: IProduct;

  quantity: number;
  unitPrice: number;
  totalPrice: number;
  id?: string;

}
export enum PaymentStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export interface IPurchase {
  id: string;
  invoiceNo: string;
  supplierId: string;
  storeId?: string;
    shopId?: string;
    shop?: IShop;
  purchaseDate: Date;
  paymentStatus: PaymentStatus;
  notes?: string;
  totalProducts: number;
  subTotal: number;
  grandTotal: number;
  items: PurchaseItem[];
  supplier?: ISupplier;
  store?: Partial<IStore>;
  createdBy?: IEmployee;
  updatedBy?: IEmployee;
}
