def format_stock(quantity, unit):
    """4250,'g' -> '4.25 kg' · 800,'g' -> '800 g' · 3,'unit' -> '3'"""
    quantity = int(quantity or 0)
    if unit == "g" and quantity >= 1000:
        return f"{round(quantity / 1000, 3):g} kg"
    if unit == "ml" and quantity >= 1000:
        return f"{round(quantity / 1000, 3):g} l"
    return f"{quantity:,}" if unit in ("unit", "", None) else f"{quantity:,} {unit}"