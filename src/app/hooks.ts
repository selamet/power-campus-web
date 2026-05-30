import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch, RootState } from './store';

/** Typed `useDispatch` — use throughout the app instead of the plain hook. */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Typed `useSelector` — use throughout the app instead of the plain hook. */
export const useAppSelector = useSelector.withTypes<RootState>();
