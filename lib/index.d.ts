export declare function Foundation({ url, apiKey, uid }: {
    url: string;
    apiKey: string;
    uid?: string;
}): {
    getConfiguration: () => Promise<object | undefined>;
    getEnvironment: () => Promise<object | undefined>;
    getVariable: (name: string, fallback?: any) => Promise<any>;
    subscribe: (cb: (event?: string, data?: any) => void) => void;
};
