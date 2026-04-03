import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

import App from "./src/App";

const fallbackMetrics = {
	frame: { x: 0, y: 0, width: 0, height: 0 },
	insets: { top: 0, left: 0, right: 0, bottom: 0 }
};

export default function RootApp() {
	return (
		<SafeAreaProvider initialMetrics={initialWindowMetrics ?? fallbackMetrics}>
			<App />
		</SafeAreaProvider>
	);
}
