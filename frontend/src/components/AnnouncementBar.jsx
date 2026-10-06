"use client"
import {useState} from "react";
import Icon from "@/components/Icon/Icon";
import Link from "next/link";
import {useConfig} from "@/queries/config";
import {Button, Typography} from "@heroui/react";
import {XIcon} from "lucide-react";

export function AnnouncementBar() {
    const {data: config} = useConfig();
    const [closed, setClosed] = useState(false);

    if (closed || !config?.ANNOUNCEMENT_BAR_ENABLED || !config?.ANNOUNCEMENT_BAR_TEXT) return null;

    const text = <span>{config.ANNOUNCEMENT_BAR_TEXT}</span>;

    return (<div className="bg-accent text-accent-foreground">
        <div className="container flex items-center justify-between gap-4 py-2">
            <div className={"grow"}>
                {config.ANNOUNCEMENT_BAR_LINK ? (<Link
                    href={config.ANNOUNCEMENT_BAR_LINK}
                    className="text-accent-foreground no-underline hover:underline">
                    <Typography type={"body-sm"} className={"text-center"}>
                        {text}
                    </Typography>
                </Link>) : <Typography type={"body-sm"} className={"text-center"}>text</Typography>}
            </div>
            <Button isIconOnly onPress={() => setClosed(true)}
                    aria-label="Dismiss announcement">
                <Icon icon={XIcon}/>
            </Button>
        </div>
    </div>);
}
