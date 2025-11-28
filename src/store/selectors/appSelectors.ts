import { RootState } from "../index";

export const selectCount = (state: RootState) => state.app.count;

