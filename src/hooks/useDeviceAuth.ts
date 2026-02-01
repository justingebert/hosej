import { useEffect } from "react";
//import { signIn } from 'next-auth/react';
import { v4 as uuidv4 } from "uuid";

const generateDeviceId = () => {
    let deviceId = localStorage.getItem("deviceId");
    if (!deviceId) {
        deviceId = uuidv4();
        localStorage.setItem("deviceId", deviceId);
    }
    return deviceId;
};

export const useDeviceAuth = () => {
    useEffect(() => {
        const deviceId = generateDeviceId();
        document.cookie = `deviceId=${deviceId}; path=/`;
        // Optionally trigger a manual sign-in for pages where the middleware isn't used
        // signIn('device-auth', { redirect: false });
    }, []);
};
