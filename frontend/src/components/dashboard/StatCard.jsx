import {Card, Skeleton, Typography} from "@heroui/react";
import Icon from "@/components/Icon/Icon";

const StatCard = ({label, value, hint, icon, isLoading = false}) => {
    return (
        <Card>
            <Card.Content className="flex items-start justify-between gap-3 p-5">
                <div className="min-w-0">
                    <Typography type="body-xs" className="text-muted">
                        {label}
                    </Typography>

                    {isLoading ? (
                        <Skeleton className="mt-2 h-8 w-20 rounded-md"/>
                    ) : (
                        <Typography type="h3" className="mt-1 text-2xl font-semibold">
                            {value}
                        </Typography>
                    )}

                    {hint && (
                        <Typography type="body-xs" className="mt-1 text-muted">
                            {hint}
                        </Typography>
                    )}
                </div>

                {icon && (
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-accent/10">
                        <Icon icon={icon} className="size-5 text-accent"/>
                    </span>
                )}
            </Card.Content>
        </Card>
    );
};

export default StatCard;
