import {cn} from "tailwind-variants";

const Icon = ({ icon: IconComponent, className, ...props }) => {
    return (
        <IconComponent
            {...props}
            className={cn("size-5", className)}
        />
    );
};

export default Icon;