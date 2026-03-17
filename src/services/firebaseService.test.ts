import { describe, it, expect, vi, beforeEach } from 'vitest';
import { transferOrderItems } from './firebaseService';
import { getDoc, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../firebase';
import { OrderItem } from '../types';

// Mock the entire firebase/firestore module
vi.mock('firebase/firestore', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    getDoc: vi.fn(),
    doc: vi.fn(),
    updateDoc: vi.fn(),
    createOrder: vi.fn(),
  };
});

// Mock the local firebase file
vi.mock('../firebase', () => ({
  db: {},
  OperationType: { UPDATE: 'update', GET: 'get', CREATE: 'create' },
  handleFirestoreError: vi.fn()
}));

describe('transferOrderItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should handle errors using handleFirestoreError', async () => {
    // Force getDoc to throw an error to simulate a database failure
    const mockError = new Error('Database connection failed');
    (getDoc as any).mockRejectedValueOnce(mockError);

    // Some dummy input data
    const dummyItems: OrderItem[] = [{
      id: 'item-1',
      menuItemId: 'menu-1',
      name: 'Burger',
      quantity: 1,
      price: 10,
      status: 'new'
    }];

    await transferOrderItems('source-order-1', 'target-table-1', dummyItems);

    // Verify handleFirestoreError was called with the correct parameters
    expect(handleFirestoreError).toHaveBeenCalledWith(
      mockError,
      OperationType.UPDATE,
      'orders/transfer'
    );
  });
});
