"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ChakraProvider } from "@chakra-ui/react";

interface ProvidersProps {
  children: React.ReactNode;
  esubDetails: any;
}

export function Providers({ children, esubDetails }: Readonly<ProvidersProps>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  useEffect(() => {
    if (!esubDetails) return;
    window.sessionStorage.setItem('business_id', esubDetails?.business?.business_id);
    window.sessionStorage.setItem('store_name', esubDetails?.store?.store_name);
  }, [esubDetails]);

  return (
    <ChakraProvider>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </ChakraProvider>
  );
}
