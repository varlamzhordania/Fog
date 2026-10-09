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
        useAuthStore.persist.rehydrate();
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
            <div
                className="fixed inset-0 z-50 flex flex-col items-center justify-center"
                role="status"
                aria-live="polite"
            >
                <div className="relative flex items-center justify-center">
                    <Loader/>
                </div>

                <div className="mt-2 flex flex-col items-center gap-1.5">
                    <Typography
                        type="span"
                        className="font-atomic text-7xl text-accent uppercase hover:text-accent-hover"
                    >
                        FOG
                    </Typography>

                    <Typography
                        type="body"
                        className="text-foreground"
                    >
                        Welcome to FOG Ecommerce website
                    </Typography>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4">
                <Card>
                    <Card.Header>
                        <div className="mb-2 flex w-full items-center justify-center">
                            <TriangleAlert size={32}/>
                        </div>

                        <Card.Title className="text-center">
                            Configuration Sync Failed
                        </Card.Title>

                        <Card.Description className="text-center">
                            Unable to connect to service configuration.
                            Verify your network connection or backend status.
                        </Card.Description>

                        {error?.message && (
                            <Typography
                                type="small"
                                className="mt-2 text-center text-muted"
                            >
                                {error.message}
                            </Typography>
                        )}
                    </Card.Header>

                    <Card.Footer className="justify-center">
                        <Button
                            onPress={() => refetch()}
                            isDisabled={isLoading}
                        >
                            {isLoading
                                ? 'Retrying...'
                                : 'Retry Connection'
                            }
                        </Button>
                    </Card.Footer>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}