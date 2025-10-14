
export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

export interface Receipt {
  storeName: string;
  transactionDate: string;
  total: number;
  items: ReceiptItem[];
}
   