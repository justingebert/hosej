import React from "react";
import { ClipLoader } from "react-spinners";
import { useTheme } from "next-themes";

const SpinningLoader = ({loading}: { loading: boolean }) => {
    const {theme} = useTheme();
    const color = theme === "dark" ? "#FFFFFF" : "#000000";

    return (
        <div className="flex items-center justify-center h-screen">
            <ClipLoader size={50} color={color} loading={loading}/>
        </div>
    );
};

export default SpinningLoader;
