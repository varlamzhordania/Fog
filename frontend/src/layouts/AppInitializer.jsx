'use client';

import React, {useEffect, useState} from 'react';
import {Button, Card, Typography} from "@heroui/react";
import {TriangleAlert} from "lucide-react";

import Loader from "@/components/loader/Loader";
import {useConfig} from "@/queries/config";

export default function AppInitializer({children}) {
    const {
        isLoading,
        isError,
        error,
        refetch,
    } = useConfig();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || isLoading) {
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
                            onClick={() => refetch()}
                            disabled={isLoading}
                        >
                            {isLoading
                                ? 'Retrying...'
                                : 'Retry Connection'}
                        </Button>
                    </Card.Footer>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}