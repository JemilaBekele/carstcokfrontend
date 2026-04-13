import { IEmployee } from './employee';
import { IProduct } from './Product';
import { IShop } from './shop';
import { IStore } from './store';

// Types
export interface ITransferItem {
  id: string;
  transferId: string;
  productId: string;
  batchId: string;
  isBox: boolean; // ✅ Box or Piece
  quantity: number;
  unitOfMeasureId: string; // foreign key
  
  product: IProduct;
}

export enum TransferEntityType {
  STORE = 'STORE',
  SHOP = 'SHOP'
}

export enum TransferStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export interface ITransfer {
  id: string;
  reference?: string;
  sourceType: TransferEntityType;
  sourceStoreId?: string;
  sourceShopId?: string;
  destinationType: TransferEntityType;
  destStoreId?: string;
  destShopId?: string;
  status: TransferStatus;
  notes?: string;
  createdById?: string;
  createdAt: string;
  updatedAt: string;
  items: ITransferItem[];
  sourceStore: IStore;
  sourceShop: IShop;
  destStore: IStore;
  destShop: IShop;
  createdBy?: IEmployee;
  updatedBy?: IEmployee;
}
