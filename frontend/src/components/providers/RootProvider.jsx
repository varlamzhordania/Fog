import {Toast} from "@heroui/react";

const RootProvider = ({children}) => {
    return <>
        <Toast.Provider />
        {children}
    </>
}

export default RootProvider