"use client";

import {Label, ListBox, Select} from "@heroui/react";
import {COUNTRIES} from "@/data/countries";

export default function CountrySelect({value, onChange, isRequired}) {
    const options = value && !COUNTRIES.includes(value) ? [value, ...COUNTRIES] : COUNTRIES;

    return (
        <Select
            fullWidth
            name="country"
            variant="secondary"
            isRequired={isRequired}
            placeholder="Select a country"
            value={value || null}
            onChange={onChange}
        >
            <Label>Country</Label>
            <Select.Trigger>
                <Select.Value/>
                <Select.Indicator/>
            </Select.Trigger>
            <Select.Popover>
                <ListBox>
                    {options.map((name) => (
                        <ListBox.Item key={name} id={name} textValue={name}>
                            {name}
                            <ListBox.ItemIndicator/>
                        </ListBox.Item>
                    ))}
                </ListBox>
            </Select.Popover>
        </Select>
    );
}