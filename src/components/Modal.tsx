import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Illustrations';
export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current!; dialog.showModal(); return () => dialog.close(); }, []);
  return <dialog ref={ref} className="modal paper" aria-labelledby="modal-title" onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === ref.current) onClose(); }}><div className="modal-header"><h2 id="modal-title">{title}</h2><button className="icon-button" aria-label="关闭窗口" onClick={onClose}><Icon name="close"/></button></div>{children}</dialog>;
}
