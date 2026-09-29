"use client"

import {
    Accordion,
    AccordionItem,
    Checkbox,
    CheckboxGroup,
    Label,
    Slider, Typography, SearchField, Skeleton,
} from "@heroui/react"
import {SlidersHorizontal} from "lucide-react"
import {usePathname, useRouter, useSearchParams} from "next/navigation"
import {useState} from "react"
import {useCategories} from "@/queries/inventory";

const ProductsFilter = () => {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const [search, setSearch] = useState(searchParams.get("search") || "")
    const [categories, setCategories] = useState([])
    const [price, setPrice] = useState([
        Number(searchParams.get("min_price") || 0),
        Number(searchParams.get("max_price") || 500),
    ])

    const updateParams = (updates = {}) => {
        const params = new URLSearchParams(searchParams.toString())

        Object.entries(updates).forEach(([key, value]) => {
            if (
                value === undefined ||
                value === null ||
                value === "" ||
                (Array.isArray(value) && value.length === 0)
            ) {
                params.delete(key)
                return
            }

            if (Array.isArray(value)) {
                params.set(key, value.join(","))
                return
            }

            params.set(key, String(value))
        })

        params.delete("page")

        const query = params.toString()

        router.push(
            query ? `${pathname}?${query}` : pathname
        )
    }

    const handleSearch = () => {
        updateParams({
            search: search.trim() || null,
        })
    }

    const handlePriceChange = (value) => {
        setPrice(value)
    }

    const handlePriceChangeEnd = (value) => {
        updateParams({
            min_price: value[0] > 0 ? value[0] : null,
            max_price: value[1] < 500 ? value[1] : null,
        })
    }




    return (
        <div className="w-full">
            {/* Mobile */}
            <div className="lg:hidden">
                <Accordion variant="splitted">
                    <AccordionItem
                        key="filters"
                        title="Filters"
                        startContent={
                            <SlidersHorizontal className="size-4"/>
                        }
                    >
                        <FilterContent
                            search={search}
                            setSearch={setSearch}
                            handleSearch={handleSearch}
                            price={price}
                            handlePriceChange={handlePriceChange}
                            handlePriceChangeEnd={handlePriceChangeEnd}
                        />
                    </AccordionItem>
                </Accordion>
            </div>

            {/* Desktop */}
            <div className="hidden lg:block">
                <div className="mb-5 flex items-center gap-3">
                    <div>
                        <Typography type={"h2"} className="font-semibold">
                            Filters
                        </Typography>
                    </div>
                </div>

                <FilterContent
                    search={search}
                    setSearch={setSearch}
                    handleSearch={handleSearch}
                    category={categories}
                    setCategory={setCategories}
                    price={price}
                    handlePriceChange={handlePriceChange}
                    handlePriceChangeEnd={handlePriceChangeEnd}
                />
            </div>
        </div>
    )
}

const FilterContent = ({
                           search,
                           setSearch,
                           handleSearch,
                           category,
                           setCategory,
                           price,
                           handlePriceChange,
                           handlePriceChangeEnd,
                       }) => {

    const {data: categories, isLoading} = useCategories({pagination: false, is_filterable: true,})

    return (
        <div className="space-y-7">

            {/* Search */}
            <div className="space-y-2">
                <SearchField
                    value={search}
                    onChange={setSearch}
                    name="search"
                    variant={"secondary"}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            handleSearch()
                        }
                    }}
                >
                    <Label>Search</Label>
                    <SearchField.Group>
                        <SearchField.SearchIcon/>
                        <SearchField.Input placeholder="Search products..."/>
                        <SearchField.ClearButton/>
                    </SearchField.Group>
                </SearchField>
            </div>

            {/* Categories */}
            <div className={"space-y-2"}>
                <CheckboxGroup name="categories" value={category} onChange={setCategory}>
                    <Label>Categories</Label>

                    {isLoading &&[12, 16, 20, 14, 24, 18].map((_, index) => (
                        <Checkbox key={index}>
                            <Checkbox.Content>
                                <Checkbox.Control>
                                    <Skeleton className={"size-4"}/>
                                </Checkbox.Control>
                                <Skeleton className={"h-4 w-[300px]"}/>
                            </Checkbox.Content>
                        </Checkbox>
                    ))}

                    {categories?.map((item, x) => <Checkbox key={x} value={item.slug}>
                        <Checkbox.Content>
                            <Checkbox.Control>
                                <Checkbox.Indicator/>
                            </Checkbox.Control>
                            {item.name}
                        </Checkbox.Content>
                    </Checkbox>)}
                </CheckboxGroup>
            </div>
            {/* Price */}
            <div className="space-y-4">
                <Slider
                    className="w-full max-w-xs"
                    defaultValue={[100, 500]}
                    formatOptions={{currency: "USD", style: "currency"}}
                    maxValue={1000}
                    minValue={0}
                    step={50}
                    value={price}
                    onChange={handlePriceChange}
                    onChangeEnd={handlePriceChangeEnd}
                    aria-label={"product-price-range"}
                >
                    <Label>Price Range</Label>
                    <Slider.Output/>
                    <Slider.Track>
                        {({state}) => (
                            <>
                                <Slider.Fill/>
                                {state.values.map((_, i) => (
                                    <Slider.Thumb key={i} index={i}/>
                                ))}
                            </>
                        )}
                    </Slider.Track>
                </Slider>
            </div>
        </div>
    )
}

export default ProductsFilter