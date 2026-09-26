import {cn} from "tailwind-variants";

const Icon = ({ icon: IconComponent, className, ...props }) => {
    return (
        <IconComponent
            {...props}
            className={cn("size-6", className)}
        />
    );
};

export default Icon;