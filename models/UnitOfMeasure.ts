export interface IUnitOfMeasure {
  id: string;
  name: string;
  symbol?: string;
  createdAt?: string; // optional if you add timestamps later
  updatedAt?: string;
}
