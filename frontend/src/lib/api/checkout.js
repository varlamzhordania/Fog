import apiClient from "@/lib/api/client";
import {API_ENDPOINTS} from "@/lib/config";

export async function fetchPaymentMethods() {
    const response = await apiClient.get(API_ENDPOINTS.checkout.paymentMethods);
    return response.data
}

export async function fetchCart() {
    const response = await apiClient.get(API_ENDPOINTS.checkout.cart)
    return response.data
}

export async function deleteCart() {
    const response = await apiClient.delete(API_ENDPOINTS.checkout.cart)
    return response.status
}

export async function addItemToCart(data) {
    const response = await apiClient.post(API_ENDPOINTS.checkout.cartItem, data)
    return response.data
}

export async function updateCartItem({id, quantity}) {
    const response = await apiClient.post(API_ENDPOINTS.checkout.cartItemDetail(id), {quantity})
    return response.data
}

export async function deleteCartItem(id) {
    const response = await apiClient.delete(API_ENDPOINTS.checkout.cartItemDetail(id), )
    return response.status
}

export async function postOrder(data) {
    return await fetchWithAuth(API_ENDPOINTS.checkout.orderCreate, {
        method: "POST",
        body: data
    })
}

export async function fetchOrders({page = 1, page_size = 25}) {
    return await fetchWithAuth(API_ENDPOINTS.checkout.orderList(page, page_size), {
        method: "GET"
    })
}

export async function fetchOrderDetail(id) {
    return await fetchWithAuth(API_ENDPOINTS.checkout.orderDetail(id), {
        method: "GET"
    })
}

export async function stripeOrderPayment(data) {
    return await fetchWithAuth(API_ENDPOINTS.checkout.stripe, {
        method: "POST",
        body: data
    })
}