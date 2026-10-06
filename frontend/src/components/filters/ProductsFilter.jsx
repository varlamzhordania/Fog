"use client"

import {
    Accordion,
    Button,
    Checkbox,
    CheckboxGroup,
    Chip,
    Label,
    ListBox,
    Radio,
    RadioGroup,
    SearchField,
    Select,
    Skeleton,
    Slider,
    Typography,
} from "@heroui/react"
import {RotateCcw, SlidersHorizontal} from "lucide-react"
import {useState} from "react"
import Icon from "@/components/icon/Icon"
import {useCategories, usePriceRange} from "@/queries/inventory"
import {useProductFilters} from "@/hooks/useProductFilters"
import {PRODUCT_TYPE_OPTIONS, STOCK_OPTIONS} from "@/data/productFilters"

const ALL = "all"

const ProductsFilter = () => {
    const {activeCount, resetFilters} = useProductFilters()

    return (<div className="w-full">
        {/* Mobile */}
        <div className="lg:hidden">
            <Accordion variant="surface">
                <Accordion.Item id="filters">
                    <Accordion.Heading>
                        <Accordion.Trigger>
                                <span className="flex items-center gap-2">
                                    <Icon
                                        icon={SlidersHorizontal}
                                        className="size-4"
                                    />
                                    Filters

                                    {activeCount > 0 && (<Chip
                                        size="sm"
                                        color="accent"
                                    >
                                        {activeCount}
                                    </Chip>)}
                                </span>

                            <Accordion.Indicator/>
                        </Accordion.Trigger>
                    </Accordion.Heading>

                    <Accordion.Panel>
                        <Accordion.Body>
                            <FilterContent/>

                            <ResetButton
                                activeCount={activeCount}
                                onPress={resetFilters}
                            />
                        </Accordion.Body>
                    </Accordion.Panel>
                </Accordion.Item>
            </Accordion>
        </div>

        {/* Desktop */}
        <div className="hidden lg:block">
            <div className="mb-5 flex items-center justify-between gap-3">
                <Typography type="h2" className="font-semibold">
                    Filters
                </Typography>

                <ResetButton
                    activeCount={activeCount}
                    onPress={resetFilters}
                />
            </div>

            <FilterContent/>
        </div>
    </div>)
}

const ResetButton = ({activeCount, onPress}) => {
    if (activeCount === 0) return null

    return (<Button
        size="sm"
        variant="ghost"
        onPress={onPress}
        className="gap-2"
    >
        <Icon
            icon={RotateCcw}
            className="size-4"
        />
        Reset
    </Button>)
}

const FilterContent = () => {
    const {filters, setFilters} = useProductFilters()

    return (<div className="space-y-7">
        <SearchFilter
            value={filters.search}
            onSubmit={(search) => setFilters({search})}
        />

        <CategoryFilter
            value={filters.category}
            onChange={(category) => setFilters({category})}
        />

        <PriceFilter
            min={filters.min_price}
            max={filters.max_price}
            onChange={(min_price, max_price) => setFilters({
                min_price, max_price,
            })}
        />

        <OptionsFilter
            label="Availability"
            name="stock"
            value={filters.stock}
            options={STOCK_OPTIONS}
            onChange={(stock) => setFilters({stock})}
        />

        {/*<ProductTypeFilter*/}
        {/*    value={filters.product_type}*/}
        {/*    onChange={(product_type) =>*/}
        {/*        setFilters({product_type})*/}
        {/*    }*/}
        {/*/>*/}

        <DiscountFilter
            value={filters.discounted}
            onChange={(discounted) => setFilters({discounted})}
        />

        <DiscountRangeFilter
            min={filters.min_discount}
            max={filters.max_discount}
            onChange={(min_discount, max_discount) => setFilters({
                min_discount, max_discount,
            })}
        />

        <FeaturedFilter
            value={filters.is_featured}
            onChange={(is_featured) => setFilters({is_featured})}
        />
    </div>)
}

const SearchFilter = ({value, onSubmit}) => {
    const [search, setSearch] = useState(value || "")
    const [syncedValue, setSyncedValue] = useState(value)

    // Keep the input in sync when the URL changes from somewhere else
    // (reset, browser back/forward, another component).
    if (syncedValue !== value) {
        setSyncedValue(value)
        setSearch(value || "")
    }

    return (<SearchField
        value={search}
        onChange={setSearch}
        onSubmit={(text) => onSubmit(text.trim())}
        onClear={() => onSubmit(null)}
        name="search"
        variant="secondary"
    >
        <Label>Search</Label>

        <SearchField.Group>
            <SearchField.SearchIcon/>

            <SearchField.Input
                placeholder="Search products..."
            />

            <SearchField.ClearButton/>
        </SearchField.Group>
    </SearchField>)
}

const CategoryFilter = ({value = [], onChange}) => {
    const {
        data, isLoading,
    } = useCategories({
        pagination: false, is_filterable: true,
    })

    const categories = data?.results || data || []

    return (<CheckboxGroup
        name="category"
        value={value}
        onChange={onChange}
    >
        <Label>Categories</Label>

        {isLoading && ([12, 16, 20, 14, 24, 18].map((_, index) => (<Skeleton
            key={index}
            className="h-5 w-full rounded-md"
        />)))}

        {categories.map((item) => (<Checkbox
            key={item.slug}
            value={item.slug}
        >
            <Checkbox.Content>
                <Checkbox.Control>
                    <Checkbox.Indicator/>
                </Checkbox.Control>

                {item.name}
            </Checkbox.Content>
        </Checkbox>))}
    </CheckboxGroup>)
}

const OptionsFilter = ({
                           label, name, value, options, onChange,
                       }) => {
    return (<RadioGroup
        name={name}
        value={value || ALL}
        onChange={(next) => onChange(next === ALL ? null : next,)}
    >
        <Label>{label}</Label>

        <FilterRadio
            value={ALL}
            label="Any"
        />

        {options.map((option) => (<FilterRadio
            key={option.value}
            value={option.value}
            label={option.label}
        />))}
    </RadioGroup>)
}

const FilterRadio = ({value, label}) => {
    return (<Radio
        value={value}
        className="flex-row"
    >
        <Radio.Content>
            <Radio.Control>
                <Radio.Indicator/>
            </Radio.Control>

            <Label className="w-full">
                {label}
            </Label>
        </Radio.Content>
    </Radio>)
}

const ProductTypeFilter = ({value, onChange}) => {
    return (<Select
        fullWidth
        name="product_type"
        variant="secondary"
        placeholder="All types"
        value={value || ALL}
        onChange={(next) => onChange(next === ALL ? null : next,)}
    >
        <Label>Product type</Label>

        <Select.Trigger>
            <Select.Value/>
            <Select.Indicator/>
        </Select.Trigger>

        <Select.Popover>
            <ListBox>
                <ListBox.Item
                    id={ALL}
                    textValue="All types"
                >
                    All types
                    <ListBox.ItemIndicator/>
                </ListBox.Item>

                {PRODUCT_TYPE_OPTIONS.map((option) => (<ListBox.Item
                    key={option.value}
                    id={option.value}
                    textValue={option.label}
                >
                    {option.label}
                    <ListBox.ItemIndicator/>
                </ListBox.Item>))}
            </ListBox>
        </Select.Popover>
    </Select>)
}

const DiscountFilter = ({value, onChange}) => {
    return (<RadioGroup
        name="discounted"
        value={value ? "discounted" : ALL}
        onChange={(next) => onChange(next === "discounted" ? true : null,)}
    >
        <Label>Discount</Label>
        <FilterRadio value={ALL} label="Any"/>
        <FilterRadio value="discounted" label="Discounted"/>
    </RadioGroup>)
}

const FeaturedFilter = ({value, onChange}) => {
    return (<RadioGroup
        name="is_featured"
        value={value ? "featured" : ALL}
        onChange={(next) => onChange(next === "featured" ? true : null,)}
    >
        <Label>Featured</Label>
        <FilterRadio value={ALL} label="Any"/>
        <FilterRadio value="featured" label="Featured only"/>
    </RadioGroup>)
}

// Picks a slider step that fits the size of the price range.
// Examples:
//   0–90   -> 1
//   0–1000 -> 10
//   0–10000 -> 100
const getPriceStep = (range) => {
    if (!(range > 0)) return 1

    return Math.max(1, 10 ** (Math.floor(Math.log10(range)) - 1),)
}

const clamp = (value, lowest, highest) => Math.min(Math.max(value, lowest), highest,)

const PriceFilter = ({min, max, onChange}) => {
    const {
        data, isLoading,
    } = usePriceRange()

    if (isLoading) {
        return (<div className="space-y-3">
            <Skeleton className="h-4 w-24 rounded-md"/>
            <Skeleton className="h-2 w-full rounded-full"/>
        </div>)
    }

    const lowest = Number(data?.min_price ?? 0,)

    const highest = Number(data?.max_price ?? 0,)

    // No products, or every product costs the same.
    if (!(highest > lowest)) {
        return null
    }

    const step = getPriceStep(highest - lowest,)

    return (<PriceSlider
        bounds={{
            min: Math.floor(lowest / step) * step, max: Math.ceil(highest / step) * step, step,
        }}
        min={min}
        max={max}
        onChange={onChange}
    />)
}

const PriceSlider = ({
                         bounds, min, max, onChange,
                     }) => {
    const currentMin = clamp(min ?? bounds.min, bounds.min, bounds.max,)

    const currentMax = clamp(max ?? bounds.max, bounds.min, bounds.max,)

    const [price, setPrice] = useState([currentMin, currentMax,])

    const [syncedValue, setSyncedValue] = useState(`${currentMin}-${currentMax}`,)

    // Keep slider in sync when URL changes.
    if (syncedValue !== `${currentMin}-${currentMax}`) {
        setSyncedValue(`${currentMin}-${currentMax}`,)

        setPrice([currentMin, currentMax,])
    }

    const handleChangeEnd = ([nextMin, nextMax],) => {
        onChange(nextMin > bounds.min ? nextMin : null,

            nextMax < bounds.max ? nextMax : null,)
    }

    return (<Slider
        className="w-full"
        formatOptions={{
            currency: "USD", style: "currency",
        }}
        minValue={bounds.min}
        maxValue={bounds.max}
        step={bounds.step}
        value={price}
        onChange={setPrice}
        onChangeEnd={handleChangeEnd}
        aria-label="product-price-range"
    >
        <Label>Price Range</Label>

        <Slider.Output/>

        <Slider.Track>
            {({state}) => (<>
                <Slider.Fill/>

                {state.values.map((_, index) => (<Slider.Thumb
                    key={index}
                    index={index}
                />),)}
            </>)}
        </Slider.Track>
    </Slider>)
}

const DiscountRangeFilter = ({
                                 min, max, onChange,
                             }) => {
    const bounds = {
        min: 0, max: 100, step: 1,
    }

    const currentMin = clamp(min ?? bounds.min, bounds.min, bounds.max,)

    const currentMax = clamp(max ?? bounds.max, bounds.min, bounds.max,)

    const [discount, setDiscount] = useState([currentMin, currentMax,])

    const [syncedValue, setSyncedValue] = useState(`${currentMin}-${currentMax}`,)

    // Keep the slider in sync when the URL changes
    // from reset / browser navigation / another filter.
    if (syncedValue !== `${currentMin}-${currentMax}`) {
        setSyncedValue(`${currentMin}-${currentMax}`,)

        setDiscount([currentMin, currentMax,])
    }

    const handleChangeEnd = ([nextMin, nextMax],) => {
        onChange(nextMin > bounds.min ? nextMin : null,

            nextMax < bounds.max ? nextMax : null,)
    }

    return (<Slider
        className="w-full"
        minValue={bounds.min}
        maxValue={bounds.max}
        step={bounds.step}
        value={discount}
        onChange={setDiscount}
        onChangeEnd={handleChangeEnd}
        aria-label="product-discount-range"
    >
        <div className="flex items-center justify-between">
            <Label>Discount Range</Label>

            <Slider.Output>
                {({state}) => {
                    const [currentMin, currentMax,] = state.values

                    return `${currentMin}% – ${currentMax}%`
                }}
            </Slider.Output>
        </div>

        <Slider.Track>
            {({state}) => (<>
                <Slider.Fill/>

                {state.values.map((_, index) => (<Slider.Thumb
                    key={index}
                    index={index}
                />),)}
            </>)}
        </Slider.Track>
    </Slider>)
}

export default ProductsFilter

