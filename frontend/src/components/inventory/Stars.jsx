import {Star} from "lucide-react";
import Icon from "@/components/icon/Icon";

const Stars = ({value = 0, className = "size-4"}) => (
    <span className="inline-flex" role="img" aria-label={`${value} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((n) => (
            <Icon
                key={n}
                icon={Star}
                className={`${className} ${n <= Math.round(value) ? "fill-warning text-warning" : "text-muted"}`}
            />
        ))}
    </span>
);

export default Stars;