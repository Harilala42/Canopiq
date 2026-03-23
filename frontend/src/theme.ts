import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
	theme: {
		tokens: {
			colors: {
				text: { value: "#cecbf6" },
				primary: { value: "#534ab7" },
				secondary: { value: "#1a1535" }
			},
			fonts: {
				Sansation: { value: "'Sansation', sans-serif" },
				FiraCode: { value: "'Fira Code', sans-serif" }
			}
		}
	},
	globalCss: {
		"*": {
			margin: 0,
			padding: 0
		},
		".title-styles": {
			fontFamily: "Sansation",
			color: "text"
		},
		".text-styles": {
			fontFamily: "FiraCode",
			color: "text"
		}
	}
});

export const system = createSystem(defaultConfig, customConfig);
