import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const customConfig = defineConfig({
	theme: {
		tokens: {
			colors: {
				text: { value: "#cecbf6" },
				primary: { value: "#534ab7" },
				secondary: { value: "#1a1535" },
				variantDark: { value: "#261f4d" },
				variantLight: { value: "#AFA9EC" },
				success: { value: "#1D9E75" },
				error: { value: "#D85A30" }
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
			padding: 0,
			transition: `
				background-color 0.3s ease,
				border-color 0.3s ease,
				margin 0.3s ease,
				color 0.3s ease
			`
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
