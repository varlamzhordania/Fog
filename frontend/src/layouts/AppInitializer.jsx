'use client';

import React, {useEffect, useState} from 'react';
import {Button, Card, Typography} from "@heroui/react";
import {TriangleAlert} from "lucide-react";

import Loader from "@/components/loader/Loader";
import {useConfig} from "@/queries/settings";
import {useCurrentUser} from "@/queries/auth";
import {useAuthStore} from "@/stores/auth";
import {useCartStore} from "@/stores/cart";
import {useThemeStore} from "@/stores/theme";

export default function AppInitializer({children}) {
    const {setAuth, clearAuth, logged_in} = useAuthStore();
    const syncGuestCart = useCartStore((s) => s.syncGuestCart);
    const {data: config, isError, error, refetch, isFetching} = useConfig();
    const {data, isError: userIsError} = useCurrentUser();

    useEffect(() => {
        useCartStore.persist.rehydrate();
        useThemeStore.persist.rehydrate();
    }, []);


    // Existing Auth Synchronization Effect
    useEffect(() => {
        if (!data) {
            if (userIsError) {
                clearAuth();
            }
            return;
        }

        const initializeAuth = async () => {
            try {
                if (data.access_token) {
                    setAuth({
                        user: data.user,
                        access_token: data.access_token,
                    });
                    return;
                }

                setAuth({
                    user: data,
                });
            } catch (error) {
                console.error(
                    "Failed to initialize auth:",
                    error
                );
            }
        };

        initializeAuth();
    }, [
        data,
        userIsError,
        setAuth,
        clearAuth,
    ]);

    useEffect(() => {
        if (logged_in) {
            syncGuestCart();
        }
    }, [logged_in, syncGuestCart]);

    if (isError && !config) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4">
                <Card>
                    <Card.Header>
                        <div className="mb-2 flex w-full items-center justify-center">
                            <TriangleAlert size={32}/>
                        </div>
                        <Card.Title className="text-center">We can't reach the store right now</Card.Title>
                        <Card.Description className="text-center">
                            Please check your connection and try again. If this keeps happening, come back in a few minutes.
                        </Card.Description>
                    </Card.Header>
                    <Card.Footer className="justify-center">
                        <Button onPress={() => refetch()} isDisabled={isFetching}>
                            {isFetching ? "Retrying…" : "Try again"}
                        </Button>
                    </Card.Footer>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}