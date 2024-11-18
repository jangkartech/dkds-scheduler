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
  const id_toko = await findMapperByEntity(
    order.customerCode,
    EntityTypes.CUSTOMER
  );
  const id_gudang = await findMapperByEntity(
    order.warehouseCode,
    EntityTypes.WAREHOUSE
  );
  const id_salesman = await findMapperByEntity(
    order.salesmanCode,
    EntityTypes.SALESMAN
  );
  return {
    id_toko,
    id_gudang,
    po_manual: order.noSalesOrder,
    tanggal: order.oderDate,
    tipe_pembayaran: order.paymentType,
    tipe_harga: order.priceType,
    id_salesman: id_salesman,
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
  const id_barang = await findMapperByEntity(
    orderItem.productCode,
    EntityTypes.PRODUCT
  );
  return {
    id_barang,
    qty: orderItem.productQty,
    qty_pcs: 0,
    disc_persen: 0,
    disc_rupiah: orderItem.discountAmount,
    id_promo: process.env.DKDS_PROMO_ID,
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
