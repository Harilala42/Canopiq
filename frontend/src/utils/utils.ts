export const fetchWithRetry = async (
    fetchFn: () => Promise<any>, 
    retries = 3, 
    delay = 1000
): Promise<any> => {
    try {
        return await fetchFn();
    } catch (err) {
        const status: number = err?.response?.status;
        if (status === 401 || status === 403)
            throw err;

        if (retries <= 0) throw err;
        
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(fetchFn, retries - 1, delay * 2);
    }
};
