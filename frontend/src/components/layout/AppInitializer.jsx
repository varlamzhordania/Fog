'use client';

import React, {useEffect, useState} from 'react';
import {useConfigStore} from '@/stores/config';
import {Button, Card, Typography} from "@heroui/react";
import Loader from "@/components/loader/Loader";
import {TriangleAlert} from "lucide-react";

export default function AppInitializer({children}) {
    const {loaded, loading, error, load} = useConfigStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        load().catch(() => {
        });
    }, [load]);

    if (!mounted || (!loaded && !error)) {
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
                    <Typography type={"span"}
                                className={"font-atomic text-7xl text-accent hover:text-accent-hover uppercase"}>
                        FOG
                    </Typography>
                    <Typography type={"body"} className={"text-foreground"}>
                        Welcome to FOG Ecommerce website
                    </Typography>
                </div>
            </div>
        );
    }

    // Fallback state if backend settings cannot be fetched
    if (error && !loaded) {
        return (
            <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-4 ">
                <Card>
                    <Card.Header>
                        <div className={"w-full flex justify-center items-center mb-2"}>
                            <TriangleAlert size={32}/>
                        </div>
                        <Card.Title className={"text-center"}>
                            Configuration Sync Failed
                        </Card.Title>
                        <Card.Description className={"text-center"}>
                            Unable to connect to service configuration. Verify network connectivity or
                            backend status.
                        </Card.Description>
                    </Card.Header>
                    <Card.Footer className={"justify-center"}>
                        <Button
                            onClick={
                                () => load().catch(() => {
                                })
                            }
                            disabled={loading}
                        >
                            {loading ? 'Retrying...' : 'Retry Connection'}
                        </Button>
                    </Card.Footer>
                </Card>
            </div>
        );
    }

    return <>{children}</>;
}