"use client";

import {useState} from "react";
import {Button, Card, Chip, Skeleton, toast, Typography} from "@heroui/react";
import {MapPinHouse, Pencil, Plus, Trash2} from "lucide-react";
import Icon from "@/components/Icon/Icon";
import AddressDrawer from "@/components/dashboard/AddressDrawer";
import {useAddresses, useDeleteAddress, useSaveAddress} from "@/queries/account";
import {getApiErrorMessage} from "@/lib/utils";

export default function AddressesPage() {
    const {data, isLoading, isError} = useAddresses();
    const saveAddress = useSaveAddress();
    const deleteAddress = useDeleteAddress();

    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [confirmDelete, setConfirmDelete] = useState(null);

    const addresses = data?.results ?? data ?? [];

    const openDrawer = (address = null) => {
        setEditing(address);
        setDrawerOpen(true);
    };

    const makeDefault = (address) =>
        saveAddress.mutate(
            {id: address.id, data: {is_default: true}, addresses},
            {
                onSuccess: () => toast.success("Default address updated."),
                onError: (error) => toast.danger(getApiErrorMessage(error)),
            }
        );

    const remove = (address) =>
        deleteAddress.mutate(address.id, {
            onSuccess: () => {
                setConfirmDelete(null);
                toast.success("Address removed.");
            },
            onError: (error) => toast.danger(getApiErrorMessage(error, "Could not remove the address.")),
        });

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Typography type="h2" className="text-2xl font-light tracking-tight">
                        Addresses
                    </Typography>
                    <Typography type="body-sm" className="text-muted">
                        Choose where your orders are delivered.
                    </Typography>
                </div>
                <Button onPress={() => openDrawer()}>
                    <Icon icon={Plus} className="size-4"/>
                    Add address
                </Button>
            </div>

            {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                    {Array.from({length: 2}).map((_, index) => (
                        <Skeleton key={index} className="h-44 w-full rounded-xl"/>
                    ))}
                </div>
            )}

            {isError && (
                <Typography type="body-sm" className="text-danger">
                    We could not load your addresses. Please refresh the page.
                </Typography>
            )}

            {!isLoading && !isError && addresses.length === 0 && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-border py-16 text-center">
                    <Icon icon={MapPinHouse} className="size-10 text-muted"/>
                    <Typography type="h4">No saved addresses</Typography>
                    <Typography type="body-sm" color="muted" className="max-w-sm">
                        Save an address once and pick it in a click at checkout.
                    </Typography>
                    <Button variant="secondary" className="mt-1" onPress={() => openDrawer()}>
                        Add your first address
                    </Button>
                </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
                {addresses.map((address) => (
                    <Card key={address.id}>
                        <Card.Content className="flex h-full flex-col justify-between gap-5 p-5">
                            <div className="flex flex-col gap-1 text-sm">
                                <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className="font-medium">{address.full_name}</span>
                                    {address.is_default && (
                                        <Chip size="sm" color="accent"><Chip.Label>Default</Chip.Label></Chip>
                                    )}
                                </div>
                                <span className="text-muted">
                                    {[address.line1, address.line2].filter(Boolean).join(", ")}
                                </span>
                                <span className="text-muted">
                                    {[address.city, address.state, address.postal_code].filter(Boolean).join(", ")}
                                </span>
                                <span className="text-muted">{address.country}</span>
                            </div>

                            {confirmDelete === address.id ? (
                                <div className="flex flex-col gap-2">
                                    <Typography type="body-xs" className="text-muted">
                                        Remove this address?
                                    </Typography>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="danger"
                                                isPending={deleteAddress.isPending}
                                                onPress={() => remove(address)}>
                                            Yes, remove
                                        </Button>
                                        <Button size="sm" variant="ghost"
                                                onPress={() => setConfirmDelete(null)}>
                                            Keep
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-wrap items-center gap-2">
                                    <Button size="sm" variant="secondary" onPress={() => openDrawer(address)}>
                                        <Icon icon={Pencil} className="size-3.5"/>
                                        Edit
                                    </Button>
                                    {!address.is_default && (
                                        <Button size="sm" variant="ghost"
                                                isPending={saveAddress.isPending}
                                                onPress={() => makeDefault(address)}>
                                            Make default
                                        </Button>
                                    )}
                                    <Button isIconOnly size="sm" variant="ghost"
                                            className="ml-auto text-muted hover:text-danger"
                                            aria-label={`Remove address for ${address.full_name}`}
                                            onPress={() => setConfirmDelete(address.id)}>
                                        <Icon icon={Trash2} className="size-4"/>
                                    </Button>
                                </div>
                            )}
                        </Card.Content>
                    </Card>
                ))}
            </div>

            <AddressDrawer
                isOpen={drawerOpen}
                onOpenChange={setDrawerOpen}
                address={editing}
                addresses={addresses}
            />
        </div>
    );
}
