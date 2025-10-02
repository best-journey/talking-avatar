"use client"

import { ChakraProvider, defaultSystem } from "@chakra-ui/react"
import {
  ColorModeProvider,
  type ColorModeProviderProps,
} from "./color-mode"
import { SttProvider } from "../../contexts/SttContext"

export function Provider(props: ColorModeProviderProps) {
  return (
    <ChakraProvider value={defaultSystem}>
      <ColorModeProvider {...props}>
        <SttProvider apiUrl={import.meta.env.VITE_API_URL || 'http://localhost:3000'}>
          {props.children}
        </SttProvider>
      </ColorModeProvider>
    </ChakraProvider>
  )
}
