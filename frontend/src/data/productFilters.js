export const PRODUCTS_PAGE_SIZE = 12


export const STOCK_OPTIONS = [
    {value: "in_stock", label: "In stock"},
    {value: "out_of_stock", label: "Out of stock"},
]

export const PRODUCT_TYPE_OPTIONS = [
    {value: "physical", label: "Physical goods"},
    {value: "digital", label: "Digital service / key"},
    {value: "downloadable", label: "Downloadable file / guide"},
    {value: "other", label: "Other"},
]

export const DEFAULT_ORDERING = "-created_at"

export const ORDERING_OPTIONS = [
    {value: "-created_at", label: "Newest first"},
    {value: "created_at", label: "Oldest first"},
    {value: "store_price", label: "Price: low to high"},
    {value: "-store_price", label: "Price: high to low"},
]
