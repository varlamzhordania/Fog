"use client"
import {useState} from "react";
import Icon from "@/components/icon/Icon";
import {useConfig} from "@/queries/config";
import {Button, Typography, Link} from "@heroui/react";
import {XIcon} from "lucide-react";

export function AnnouncementBar() {
    const {data: config} = useConfig();
    const [closed, setClosed] = useState(false);

    if (closed || !config?.ANNOUNCEMENT_BAR_ENABLED || !config?.ANNOUNCEMENT_BAR_TEXT) return null;

    const text = <span>{config.ANNOUNCEMENT_BAR_TEXT}</span>;

    return (<div className="bg-accent text-center">
        <div className="container flex items-center justify-between gap-4 py-2">
            <div className={"grow"}>
                {config.ANNOUNCEMENT_BAR_LINK ? (<Link href={config.ANNOUNCEMENT_BAR_LINK}>
                        <Typography type={"body-sm"} className={"text-white "}>
                            {text}
                        </Typography>
                    </Link>) :
                    <Typography type={"body-sm"} className={"text-white"}>text</Typography>}
            </div>
            <Button isIconOnly onPress={() => setClosed(true)}
                    aria-label="Dismiss announcement">
                <Icon icon={XIcon}/>
            </Button>
        </div>
    </div>);
}
