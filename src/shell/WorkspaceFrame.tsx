import { useEffect, useState, type ReactNode } from "react";
import { Group, Panel, Separator, useDefaultLayout, usePanelRef } from "react-resizable-panels";
import { useMaxWidth } from "@/hooks/useMediaQuery";

export function WorkspaceFrame({
  storageId,
  toggleEvent,
  rail,
  center,
  inspector,
}: {
  storageId: string;
  toggleEvent: string;
  rail: ReactNode;
  center: ReactNode;
  inspector: ReactNode;
}) {
  const narrow = useMaxWidth(900);
  const [railOpen, setRailOpen] = useState(false);
  const inspectorPanel = usePanelRef();
  const { defaultLayout, onLayoutChanged } = useDefaultLayout({
    id: storageId,
    storage: localStorage,
    panelIds: ["rail", "center", "inspector"],
  });

  useEffect(() => {
    function onToggle() {
      const panel = inspectorPanel.current;
      if (!panel) return;
      if (panel.isCollapsed()) panel.resize("22%");
      else panel.collapse();
    }
    function onShow() {
      const panel = inspectorPanel.current;
      if (panel?.isCollapsed()) panel.resize("22%");
    }
    function onOpenRail() {
      setRailOpen(true);
    }
    window.addEventListener(toggleEvent, onToggle);
    window.addEventListener(`${toggleEvent}:show`, onShow);
    window.addEventListener(`${toggleEvent}:open-rail`, onOpenRail);
    return () => {
      window.removeEventListener(toggleEvent, onToggle);
      window.removeEventListener(`${toggleEvent}:show`, onShow);
      window.removeEventListener(`${toggleEvent}:open-rail`, onOpenRail);
    };
  }, [inspectorPanel, toggleEvent]);

  if (narrow) {
    return (
      <div className="relative flex min-h-0 flex-1 flex-col">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1">{center}</div>
          <div className="max-h-[42%] min-h-24 shrink-0 overflow-auto border-t border-border">{inspector}</div>
        </div>
        {railOpen ? (
          <div className="absolute inset-0 z-20 flex">
            <div className="h-full w-[min(22rem,88vw)] min-w-0 overflow-auto bg-card shadow-2xl">{rail}</div>
            <button type="button" className="flex-1 bg-black/40" aria-label="Close library" onClick={() => setRailOpen(false)} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative min-h-0 flex-1">
      <Group orientation="horizontal" defaultLayout={defaultLayout} onLayoutChanged={onLayoutChanged} className="h-full">
        <Panel id="rail" className="h-full min-h-0" defaultSize="22%" minSize="200px" maxSize="32%">
          <div className="h-full min-h-0 overflow-hidden">{rail}</div>
        </Panel>
        <Separator className="w-1 bg-border" />
        <Panel id="center" className="h-full min-h-0" minSize="40%">
          <div className="h-full min-h-0 overflow-hidden">{center}</div>
        </Panel>
        <Separator className="w-1 bg-border" />
        <Panel
          id="inspector"
          panelRef={inspectorPanel}
          className="h-full min-h-0"
          defaultSize="22%"
          minSize="0%"
          collapsible
          collapsedSize="0%"
        >
          <div className="h-full min-h-0 overflow-hidden">{inspector}</div>
        </Panel>
      </Group>
    </div>
  );
}
