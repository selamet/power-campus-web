import { useOutletContext } from 'react-router-dom';

export interface ShellContext {
  /** Current global search query from the topbar. */
  search: string;
  /** Opens the "add student" choice modal. */
  openAddFlow: () => void;
}

/** Typed accessor for the shell's outlet context. */
export const useShellContext = () => useOutletContext<ShellContext>();
