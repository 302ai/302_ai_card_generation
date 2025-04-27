"use client";

import LeftPanel from "@/components/panel/left-panel";
import RightPanel from "@/components/panel/right-panel";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/global/use-mobile";
import { createScopedLogger } from "@/utils/logger";
import { useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { useAtom } from "jotai";
import { uiStoreAtom } from "@/stores/slices/ui_store";

const logger = createScopedLogger("Home");

export default function Home() {
  const isMobile = useIsMobile();

  const [uiStore, setUiStore] = useAtom(uiStoreAtom);

  const handleDrawerClicked = () => {
    setUiStore((prev) => ({
      ...prev,
      drawerOpen: true,
    }));
    logger.debug("Drawer clicked");
  };

  useEffect(() => {
    logger.info("Hello, Welcome to 302.AI");
  }, []);

  return (
    <div className="grid flex-1">
      <div className="container relative mx-auto flex h-full w-full max-w-[1550px] flex-row items-start rounded-lg border bg-background px-6 py-4 shadow-sm">
        {isMobile ? (
          <>
            <div className="flex w-full flex-col items-center">
              <LeftPanel />
              <RightPanel />
            </div>

            {/* <Drawer
              open={uiStore.drawerOpen}
              onOpenChange={(open) =>
                setUiStore((prev) => ({
                  ...prev,
                  drawerOpen: open,
                }))
              }
            >
              <DrawerContent className="h-[85vh]">
                <div className="flex-1 px-4">
                  <RightPanel />
                </div>
              </DrawerContent>
            </Drawer> */}
          </>
        ) : (
          <>
            <div className="h-full w-1/4">
              <LeftPanel />
            </div>
            <Separator className="mx-6" orientation="vertical" />

            <div className="h-full w-3/4">
              <RightPanel />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
