import { config } from 'dotenv';
import { EntityTypes, findMapperByEntity } from '../database/models/mapper.js';
config();
export const orderDKDSToTwin = async (
  order = {
    noRealOrder: '',
    noSalesOrder: '',
    salesmanCode: '',
    salesmanName: '',
    oderType: '',
    oderDate: '',
    createdBy: '',
    noPo: '',
    poDate: '',
    customerCode: '',
    customerName: '',
    customerAddress: '',
    paymentType: '',
    dueDate: '',
    status: '',
    warehouseCode: '',
    warehouseName: '',
    description: '',
    printCount: 0,
    taxBase: 0,
    discountValue: 0,
    discountPercentage: 0,
    amount: 0,
    taxValue: 0,
    points: 0,
    adjustmentPrice: 0,
    totalInvoice: 0,
  }
) => {
  const paymentType = order.paymentType === 'KREDIT' ? 'credit' : 'cash';
  return {
    no_acc: order.customerCode,
    po_manual: order.noSalesOrder,
    tanggal: order.oderDate,
    tipe_pembayaran: paymentType,
    kode_salesman: order.salesmanCode,
    keterangan: order.description,
  };
};

export const orderItemDKDSToTwin = async (
  orderItem = {
    no: '',
    productCode: '',
    productName: '',
    color: '',
    productQty: 0,
    productPrices: 0,
    amount: 0,
    adjustmentPrice: 0,
    discountAmount: 0,
  }
) => {
  return {
    kode_barang: orderItem.productCode,
    qty: orderItem.productQty,
    qty_pcs: 0,
    disc_persen: 0,
    disc_rupiah: orderItem.discountAmount,
    id_promo: process.env.DKDS_PROMO_ID,
    kode_promo: 'testing',
  };
};

export const orderTwinToDB = async (order) => {
  return {
    id: order.id,
    status: order.status,
    customerId: order.id_toko,
    warehouseId: order.id_gudang,
    customCode: order.po_manual,
    date: order.tanggal,
    paymentType: order.tipe_pembayaran,
    priceType: order.tipe_harga,
    salesmanId: order.id_salesman,
    remarks: order.keterangan,
  };
};

export const orderItemTwinToDB = async (orderItem) => {
  return {
    id: orderItem.id,
    orderId: orderItem.id_penjualan,
    productId: orderItem.id_barang,
    quantity: orderItem.qty,
    quantityPcs: orderItem.qty_pcs,
    discountPercent: orderItem.disc_persen,
    discountAmount: orderItem.disc_rupiah,
    promoId: orderItem.id_promo,
  };
};
