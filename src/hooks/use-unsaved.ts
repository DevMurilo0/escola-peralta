import { useEffect } from "react";
export function useUnsaved(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const handle = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    const click = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (
        anchor &&
        anchor.target !== "_blank" &&
        anchor.href !== location.href &&
        !window.confirm("Existem alterações não salvas. Deseja descartá-las?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", handle);
    document.addEventListener("click", click, true);
    return () => {
      window.removeEventListener("beforeunload", handle);
      document.removeEventListener("click", click, true);
    };
  }, [dirty]);
}
