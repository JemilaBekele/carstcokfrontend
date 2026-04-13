import { IEmployee } from './employee';
import { IProduct, IProductBatch } from './Product';
import { IShop } from './shop';
import { IStore } from './store';
import { IUnitOfMeasure } from './UnitOfMeasure';

// Types
export interface ITransferItem {
  id: string;
  transferId: string;
  productId: string;
  batchId: string;
  isBox: boolean; // ✅ Box or Piece
  quantity: number;
  unitOfMeasureId: string; // foreign key
  unitOfMeasure?: IUnitOfMeasure;
  batch: IProductBatch;
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
