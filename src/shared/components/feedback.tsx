import { useRef, useEffect, useId } from "react";

export function Feedback({ message }: { message: string }) {
  return message ? (
    <p role="status" className="feedback">
      {message}
    </p>
  ) : null;
}
export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      className="modal"
      aria-labelledby={titleId}
    >
      <div className="row">
        <h2 id={titleId}>{title}</h2>
        <button
          type="button"
          className="secondary"
          onClick={onClose}
          aria-label="Fechar janela"
        >
          ✕
        </button>
      </div>
      {children}
    </dialog>
  );
}
