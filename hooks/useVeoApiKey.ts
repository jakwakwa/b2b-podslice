import { useCallback, useEffect, useState } from "react";

export const useVeoApiKey = () => {
	const [isKeyReady, setIsKeyReady] = useState(false);
	const [isChecking, setIsChecking] = useState(true);
	const [keyError, setKeyError] = useState<string | null>(null);

	const checkApiKey = useCallback(async () => {
		setIsChecking(true);
		setKeyError(null);
		// TODO: Implement API key checking
		setIsKeyReady(false);
		setIsChecking(false);
	}, []);

	useEffect(() => {
		checkApiKey();
	}, [checkApiKey]);

	const selectApiKey = async () => {
		try {
			// TODO: Implement API key selection
			// Assume success after dialog opens to avoid race conditions.
			setIsKeyReady(false);
			setKeyError(null);
		} catch (error) {
			console.error("Error opening API key selection:", error);
			setKeyError("Failed to open the API key selection dialog.");
		}
	};

	const handleApiError = useCallback(() => {
		setIsKeyReady(false);
		setKeyError(
			"Your API key seems to be invalid. Please select a valid key to continue."
		);
	}, []);

	return { isKeyReady, isChecking, keyError, selectApiKey, handleApiError };
};
