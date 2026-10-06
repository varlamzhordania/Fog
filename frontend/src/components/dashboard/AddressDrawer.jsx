"use client";

import {useState} from "react";
import {
    Button, Checkbox, Drawer, FieldError, Form, Input, Label, TextField, toast,
} from "@heroui/react";
import {useSaveAddress} from "@/queries/account";
import {getApiErrorMessage} from "@/lib/utils";

const EMPTY_ADDRESS = {
    full_name: "", line1: "", line2: "", city: "", state: "", postal_code: "", country: "",
};

/**
 * `address` null = add a new one, otherwise edit it.
 * `addresses` is the current list, used to move the "default" flag.
 */
const AddressDrawer = ({isOpen, onOpenChange, address = null, addresses = []}) => {
    return (
        <Drawer.Backdrop isOpen={isOpen} onOpenChange={onOpenChange}>
            <Drawer.Content placement="right">
                <Drawer.Dialog>
                    <Drawer.Header className="border-b">
                        <Drawer.Heading>
                            {address ? "Edit address" : "Add address"}
                        </Drawer.Heading>
                    </Drawer.Header>
                    <Drawer.Body>
                        <AddressForm
                            key={address?.id ?? "new"}
                            address={address}
                            addresses={addresses}
                            onClose={() => onOpenChange(false)}
                        />
                    </Drawer.Body>
                </Drawer.Dialog>
            </Drawer.Content>
        </Drawer.Backdrop>
    );
};

const AddressForm = ({address, addresses, onClose}) => {
    const save = useSaveAddress();

    const [form, setForm] = useState({
        ...EMPTY_ADDRESS,
        ...Object.fromEntries(
            Object.entries(address ?? {}).filter(([key]) => key in EMPTY_ADDRESS)
        ),
    });
    // The first address a customer saves becomes the default.
    const [isDefault, setIsDefault] = useState(address?.is_default ?? addresses.length === 0);

    // Normalize nullable fields coming from the API.
    const value = (name) => form[name] ?? "";
    const set = (name) => (next) => setForm((prev) => ({...prev, [name]: next}));

    const field = (name, label, props = {}) => (
        <TextField variant="secondary" name={name} value={value(name)} onChange={set(name)} {...props}>
            <Label>{label}</Label>
            <Input/>
            <FieldError/>
        </TextField>
    );

    const handleSubmit = (e) => {
        e.preventDefault();

        save.mutate(
            {id: address?.id, data: {...form, is_default: isDefault}, addresses},
            {
                onSuccess: () => {
                    toast.success(address ? "Address updated." : "Address added.");
                    onClose();
                },
                onError: (error) => toast.danger(getApiErrorMessage(error, "Could not save the address.")),
            }
        );
    };

    return (
        <Form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {field("full_name", "Full name", {isRequired: true, autoComplete: "name"})}
            {field("line1", "Address", {isRequired: true, autoComplete: "address-line1"})}
            {field("line2", "Apartment, suite, etc. (optional)", {autoComplete: "address-line2"})}
            {field("city", "City", {isRequired: true, autoComplete: "address-level2"})}
            {field("state", "State / province (optional)", {autoComplete: "address-level1"})}
            {field("postal_code", "Postal code", {isRequired: true, autoComplete: "postal-code"})}
            {field("country", "Country", {isRequired: true, autoComplete: "country-name"})}

            <Checkbox isSelected={isDefault} onChange={setIsDefault}>
                <Checkbox.Content>
                    <Checkbox.Control><Checkbox.Indicator/></Checkbox.Control>
                    Use as my default address
                </Checkbox.Content>
            </Checkbox>

            <div className="mt-2 flex gap-3">
                <Button type="submit" isPending={save.isPending} isDisabled={save.isPending}>
                    {address ? "Save changes" : "Add address"}
                </Button>
                <Button type="button" variant="ghost" onPress={onClose}>
                    Cancel
                </Button>
            </div>
        </Form>
    );
};

export default AddressDrawer;
