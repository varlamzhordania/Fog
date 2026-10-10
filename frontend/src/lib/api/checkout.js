import apiClient from "@/lib/api/client";
import {API_ENDPOINTS} from "@/lib/config";

export async function fetchPaymentMethods() {
    const response = await apiClient.get(API_ENDPOINTS.checkout.paymentMethods);
    return response.data
}

export async function fetchShippingMethods() {
    const response = await apiClient.get(API_ENDPOINTS.checkout.shippingMethods);
    return response.data;
}

export async function fetchCart() {
    const response = await apiClient.get(API_ENDPOINTS.checkout.cart);
    return response.data;
}

export async function deleteCart() {
    const response = await apiClient.delete(
        API_ENDPOINTS.checkout.cart
    );

    return response.data;
}

export async function addItemToCart({id, quantity = 1, priceId}) {
    const response = await apiClient.post(API_ENDPOINTS.checkout.cartItem, {
        product_id: id, quantity, price_id: priceId,
    });
    return response.data;
}

export async function updateCartItem({productId, priceId, quantity, action = "set"}) {
    const response = await apiClient.patch(
        API_ENDPOINTS.checkout.cartItemDetail(productId),
        {quantity, action, price_id: priceId}
    );
    return response.data;
}

export async function deleteCartItem(productId, priceId) {
    const response = await apiClient.delete(
        API_ENDPOINTS.checkout.cartItemDetail(productId),
        {params: {price_id: priceId}}
    );
    return response.data;
}


export async function createOrder(data) {
    const response = await apiClient.post(API_ENDPOINTS.checkout.orderCreate, data);
    return response.data; // {order, payment_instructions}
}

export async function fetchOrders(params) {
    const response = await apiClient.get(API_ENDPOINTS.checkout.orderList, {params: params});
    return response.data;
}

export async function fetchOrderDetail(id) {
    const response = await apiClient.get(API_ENDPOINTS.checkout.orderDetail(id));
    return response.data;
}

export async function payOrder(id, data) {
    const response = await apiClient.post(API_ENDPOINTS.checkout.orderPay(id), data);
    return response.data;
}

export async function cancelOrder(id) {
    const response = await apiClient.post(API_ENDPOINTS.checkout.orderCancel(id));
    return response.data;
}