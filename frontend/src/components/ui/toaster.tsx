"use client"

import {
  Toaster as ChakraToaster,
  Portal,
  IconButton,
  Stack,
  Toast,
  createToaster,
} from "@chakra-ui/react"
import { LuX } from "react-icons/lu"

export const toaster = createToaster({
  placement: "top-end",
  pauseOnPageIdle: true,
})

export const Toaster = () => {
  return (
    <Portal>
      <ChakraToaster toaster={toaster} insetInline={{ mdDown: "4" }}>
        {(toast) => (
          <Toast.Root width={{ md: "sm" }} bg={toast.type}>
            <Toast.Indicator />

            <Stack align="space-between" justify="center" flex="1" maxWidth="100%">
              {
                toast.title && 
                <Toast.Title fontFamily="Sansation" fontWeight="semibold" color="white">
                  {toast.title}
                </Toast.Title>
              }

              <Toast.CloseTrigger asChild> 
                <IconButton
                    aria-label="Close Toast"
                    color="white" size="sm"
                    position="absolute"
                    top="2" right="2"
                    bg="transparent"
                  >
                  <LuX />
                </IconButton>
              </Toast.CloseTrigger>
            </Stack>
          </Toast.Root>
        )}
      </ChakraToaster>
    </Portal>
  )
}
